from datetime import date

import pytest

from app.models.card import Card, CardCategory
from app.models.period import Period, PeriodStatus, PeriodType
from app.models.user import User
from app.models.proposal import ProposalStatus, ChallengeType
from app.models.credit import LedgerType
from app.services.credit_service import CreditService
from app.services.proposal_service import ProposalService, ProposalError


def _create_user(db_session, name: str) -> User:
    user = User(name=name, pin_hash="hash")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def _create_period(db_session) -> Period:
    period = Period(
        period_type=PeriodType.WEEK,
        status=PeriodStatus.ACTIVE,
        start_date=date.today(),
        end_date=date.today(),
    )
    db_session.add(period)
    db_session.commit()
    db_session.refresh(period)
    return period


def _create_card(db_session) -> Card:
    card = Card(
        title="Sample",
        description="Sample description",
        category=CardCategory.CALIENTES,
    )
    db_session.add(card)
    db_session.commit()
    db_session.refresh(card)
    return card


def test_create_proposal_requires_card_or_custom(db_session):
    proposer = _create_user(db_session, "A")
    recipient = _create_user(db_session, "B")
    period = _create_period(db_session)

    with pytest.raises(ProposalError):
        ProposalService.create_proposal(
            db=db_session,
            period_id=period.id,
            week_index=1,
            proposed_by_user_id=proposer.id,
            proposed_to_user_id=recipient.id,
        )


def test_create_proposal_with_card(db_session):
    proposer = _create_user(db_session, "A")
    recipient = _create_user(db_session, "B")
    period = _create_period(db_session)
    card = _create_card(db_session)

    proposal = ProposalService.create_proposal(
        db=db_session,
        period_id=period.id,
        week_index=1,
        proposed_by_user_id=proposer.id,
        proposed_to_user_id=recipient.id,
        card_id=card.id,
    )

    assert proposal.status == ProposalStatus.PROPOSED
    assert proposal.challenge_type == ChallengeType.SIMPLE
    assert proposal.card_id == card.id


def test_accept_proposal_deducts_credits(db_session):
    proposer = _create_user(db_session, "A")
    recipient = _create_user(db_session, "B")
    period = _create_period(db_session)
    card = _create_card(db_session)

    proposal = ProposalService.create_proposal(
        db=db_session,
        period_id=period.id,
        week_index=1,
        proposed_by_user_id=proposer.id,
        proposed_to_user_id=recipient.id,
        card_id=card.id,
    )

    CreditService.add_ledger_entry(
        db=db_session,
        user_id=proposer.id,
        ledger_type=LedgerType.INITIAL_GRANT,
        amount=5,
        note="seed",
    )

    accepted = ProposalService.respond_to_proposal(
        db=db_session,
        proposal_id=proposal.id,
        user_id=recipient.id,
        response=ProposalStatus.ACCEPTED,
        credit_cost=3,
    )

    assert accepted.status == ProposalStatus.ACCEPTED
    assert accepted.credit_cost == 3
    assert CreditService.get_balance(db_session, proposer.id) == 2
