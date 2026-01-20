"""Proposal Service - State machine and business rules."""

from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.proposal import Proposal, ProposalStatus, ChallengeType, RewardType
from app.models.card import Card
from app.services.credit_service import CreditService
from app.config import CURRENCY_NAME_LOWER


class ProposalError(Exception):
    """Custom exception for proposal errors."""
    pass


class ProposalService:
    """
    Proposal state machine and business rules.

    Allowed transitions:
    - proposed → accepted | maybe_later | rejected
    - accepted → completed_pending_confirmation
    - completed_pending_confirmation → completed_confirmed

    Credit flow (new):
    - Proposing is FREE (no cost)
    - When recipient ACCEPTS, they set credit_cost (1-7)
    - Proposer pays credit_cost when recipient accepts
    - Recipient earns credit_cost when proposer confirms completion
    """

    # Valid state transitions
    VALID_TRANSITIONS = {
        ProposalStatus.PROPOSED: {
            ProposalStatus.ACCEPTED,
            ProposalStatus.MAYBE_LATER,
            ProposalStatus.REJECTED,
        },
        ProposalStatus.ACCEPTED: {
            ProposalStatus.COMPLETED_PENDING_CONFIRMATION,
        },
        ProposalStatus.COMPLETED_PENDING_CONFIRMATION: {
            ProposalStatus.COMPLETED_CONFIRMED,
        },
    }

    MAX_CREDIT_COST = 7

    @staticmethod
    def can_transition(from_status: ProposalStatus, to_status: ProposalStatus) -> bool:
        """Check if a status transition is valid."""
        valid = ProposalService.VALID_TRANSITIONS.get(from_status, set())
        return to_status in valid

    @staticmethod
    def create_proposal(
        db: Session,
        period_id: int,
        week_index: int,
        proposed_by_user_id: int,
        proposed_to_user_id: int,
        card_id: int | None = None,
        custom_title: str | None = None,
        custom_description: str | None = None,
        # Challenge type and guided/custom fields
        challenge_type: ChallengeType = ChallengeType.SIMPLE,
        why_proposing: str | None = None,
        boundary: str | None = None,
        location: str | None = None,
        duration: str | None = None,
        boundaries_json: str | None = None,
        reward_type: RewardType | None = None,
        reward_details: str | None = None,
    ) -> Proposal:
        """
        Create a new proposal.
        Can be from a card OR a custom reto.
        Supports 3 challenge types: simple, guided, custom.
        Proposing is FREE - credits are charged when recipient accepts.
        """
        # Validate: must have card_id OR custom_title
        if not card_id and not custom_title:
            raise ProposalError("Debe proporcionar card_id o custom_title")

        # If card-based, verify card exists
        if card_id:
            card = db.query(Card).filter(Card.id == card_id).first()
            if not card:
                raise ProposalError("Carta no encontrada")

        # Create proposal (FREE - no credit deduction)
        proposal = Proposal(
            period_id=period_id,
            week_index=week_index,
            proposed_by_user_id=proposed_by_user_id,
            proposed_to_user_id=proposed_to_user_id,
            card_id=card_id,
            challenge_type=challenge_type,
            custom_title=custom_title,
            custom_description=custom_description,
            # Guided challenge fields
            why_proposing=why_proposing,
            boundary=boundary,
            # Custom challenge fields
            location=location,
            duration=duration,
            boundaries_json=boundaries_json,
            reward_type=reward_type,
            reward_details=reward_details,
            status=ProposalStatus.PROPOSED,
        )
        db.add(proposal)
        db.commit()
        db.refresh(proposal)
        return proposal

    @staticmethod
    def respond_to_proposal(
        db: Session,
        proposal_id: int,
        user_id: int,
        response: ProposalStatus,
        credit_cost: int | None = None,
    ) -> Proposal:
        """
        Respond to a proposal (accept, maybe_later, reject).
        Only the recipient can respond.
        When accepting, must set credit_cost (1-7).
        Credits are deducted from proposer when accepted.
        """
        proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        if not proposal:
            raise ProposalError("Propuesta no encontrada")

        # Only recipient can respond
        if proposal.proposed_to_user_id != user_id:
            raise ProposalError("Solo el destinatario puede responder")

        # Validate transition
        if not ProposalService.can_transition(proposal.status, response):
            raise ProposalError(
                f"Transicion invalida: {proposal.status} → {response}"
            )

        # Validate response is one of the allowed ones
        allowed_responses = {
            ProposalStatus.ACCEPTED,
            ProposalStatus.MAYBE_LATER,
            ProposalStatus.REJECTED,
        }
        if response not in allowed_responses:
            raise ProposalError(f"Respuesta invalida: {response}")

        # If accepting, require credit_cost
        if response == ProposalStatus.ACCEPTED:
            if credit_cost is None:
                raise ProposalError(f"Debes establecer el costo en {CURRENCY_NAME_LOWER} (1-7)")
            if credit_cost < 1 or credit_cost > ProposalService.MAX_CREDIT_COST:
                raise ProposalError(f"El costo debe ser entre 1 y {ProposalService.MAX_CREDIT_COST}")

            # Check proposer has sufficient currency
            if not CreditService.has_sufficient_credits(db, proposal.proposed_by_user_id, credit_cost):
                raise ProposalError(
                    f"El proponente no tiene suficientes {CURRENCY_NAME_LOWER} ({credit_cost} requeridos)"
                )

            # Deduct credits from proposer
            CreditService.deduct_proposal_cost(
                db, proposal.proposed_by_user_id, proposal.id, credit_cost
            )

            # Store the credit cost
            proposal.credit_cost = credit_cost

        proposal.status = response
        proposal.responded_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(proposal)
        return proposal

    @staticmethod
    def mark_as_completed(
        db: Session,
        proposal_id: int,
        user_id: int,
    ) -> Proposal:
        """
        Recipient marks proposal as completed (pending confirmation).
        Only the recipient can mark as done.
        """
        proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        if not proposal:
            raise ProposalError("Propuesta no encontrada")

        # Only recipient can mark as completed
        if proposal.proposed_to_user_id != user_id:
            raise ProposalError("Solo el destinatario puede marcar como completado")

        # Validate transition
        if not ProposalService.can_transition(
            proposal.status, ProposalStatus.COMPLETED_PENDING_CONFIRMATION
        ):
            raise ProposalError(
                f"Transicion invalida: {proposal.status} → completed_pending_confirmation"
            )

        proposal.status = ProposalStatus.COMPLETED_PENDING_CONFIRMATION
        proposal.completed_requested_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(proposal)
        return proposal

    @staticmethod
    def confirm_completion(
        db: Session,
        proposal_id: int,
        user_id: int,
    ) -> Proposal:
        """
        Proposer confirms completion.
        Awards credit_cost to the recipient.
        """
        proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        if not proposal:
            raise ProposalError("Propuesta no encontrada")

        # Only proposer can confirm
        if proposal.proposed_by_user_id != user_id:
            raise ProposalError("Solo quien propuso puede confirmar")

        # Validate transition
        if not ProposalService.can_transition(proposal.status, ProposalStatus.COMPLETED_CONFIRMED):
            raise ProposalError(
                f"Transicion invalida: {proposal.status} → completed_confirmed"
            )

        # Get reward amount (credit_cost set when accepted)
        reward = proposal.credit_cost
        if not reward:
            raise ProposalError(f"No hay costo de {CURRENCY_NAME_LOWER} establecido")

        # Update status
        proposal.status = ProposalStatus.COMPLETED_CONFIRMED
        proposal.completed_confirmed_at = datetime.now(timezone.utc)

        # Award credits to recipient
        CreditService.award_completion_reward(
            db, proposal.proposed_to_user_id, proposal.id, reward
        )

        db.commit()
        db.refresh(proposal)
        return proposal

    @staticmethod
    def update_proposal(
        db: Session,
        proposal_id: int,
        user_id: int,
        update_data,
    ) -> Proposal:
        """Update a proposal before it is accepted."""
        proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        if not proposal:
            raise ProposalError("Propuesta no encontrada")

        if proposal.proposed_by_user_id != user_id:
            raise ProposalError("Solo quien propuso puede editar")

        if proposal.status not in {ProposalStatus.PROPOSED, ProposalStatus.MAYBE_LATER}:
            raise ProposalError("Solo se puede editar antes de aceptar")

        if proposal.card_id:
            raise ProposalError("Solo los retos personalizados se pueden editar")

        data = update_data.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(proposal, key, value)

        if not proposal.custom_title:
            raise ProposalError("El titulo es obligatorio")

        if proposal.challenge_type == ChallengeType.GUIDED and not proposal.boundary:
            raise ProposalError("Los retos guiados requieren un limite/boundary")

        if proposal.challenge_type == ChallengeType.CUSTOM and not proposal.boundaries_json:
            raise ProposalError("Los retos personalizados requieren limites/boundaries")

        db.commit()
        db.refresh(proposal)
        return proposal

    @staticmethod
    def delete_proposal(
        db: Session,
        proposal_id: int,
        user_id: int,
    ) -> None:
        """Delete a proposal before it is accepted."""
        proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        if not proposal:
            raise ProposalError("Propuesta no encontrada")

        if proposal.proposed_by_user_id != user_id:
            raise ProposalError("Solo quien propuso puede eliminar")

        if proposal.status not in {ProposalStatus.PROPOSED, ProposalStatus.MAYBE_LATER}:
            raise ProposalError("Solo se puede eliminar antes de aceptar")

        db.delete(proposal)
        db.commit()

    @staticmethod
    def get_proposals_for_user(
        db: Session,
        user_id: int,
        as_recipient: bool = True,
        status: ProposalStatus | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Proposal], int]:
        """Get proposals for a user (as recipient or proposer)."""
        if as_recipient:
            query = db.query(Proposal).filter(Proposal.proposed_to_user_id == user_id)
        else:
            query = db.query(Proposal).filter(Proposal.proposed_by_user_id == user_id)

        if status:
            query = query.filter(Proposal.status == status)

        total = query.count()
        proposals = query.order_by(Proposal.created_at.desc()).offset(offset).limit(limit).all()
        return proposals, total

    @staticmethod
    def get_proposal(db: Session, proposal_id: int) -> Proposal | None:
        """Get a single proposal."""
        return db.query(Proposal).filter(Proposal.id == proposal_id).first()

    @staticmethod
    def get_proposals_for_period(
        db: Session,
        period_id: int,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Proposal], int]:
        """Get all proposals for a period."""
        query = db.query(Proposal).filter(Proposal.period_id == period_id)
        total = query.count()
        proposals = query.order_by(Proposal.created_at.desc()).offset(offset).limit(limit).all()
        return proposals, total
