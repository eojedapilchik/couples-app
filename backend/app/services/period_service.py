"""Period Service - Period lifecycle and weekly grants."""

from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.models.period import Period, PeriodType, PeriodStatus
from app.services.credit_service import CreditService


class PeriodError(Exception):
    """Custom exception for period errors."""
    pass


class PeriodService:
    """Period lifecycle management."""

    # Duration in weeks for each period type
    PERIOD_DURATIONS = {
        PeriodType.WEEK: 1,
        PeriodType.MONTH: 4,
        PeriodType.TWO_MONTH: 8,
    }

    @staticmethod
    def calculate_end_date(start_date: date, period_type: PeriodType) -> date:
        """Calculate end date based on period type."""
        weeks = PeriodService.PERIOD_DURATIONS[period_type]
        return start_date + timedelta(weeks=weeks)

    @staticmethod
    def create_period(
        db: Session,
        period_type: PeriodType,
        start_date: date,
        weekly_base_credits: int = 3,
        cards_to_play_per_week: int = 3,
    ) -> Period:
        """Create a new period."""
        # Check no active period exists
        active = db.query(Period).filter(
            Period.status == PeriodStatus.ACTIVE
        ).first()
        if active:
            raise PeriodError("Ya existe un periodo activo")

        end_date = PeriodService.calculate_end_date(start_date, period_type)

        period = Period(
            period_type=period_type,
            status=PeriodStatus.SETUP,
            start_date=start_date,
            end_date=end_date,
            weekly_base_credits=weekly_base_credits,
            cards_to_play_per_week=cards_to_play_per_week,
        )
        db.add(period)
        db.commit()
        db.refresh(period)
        return period

    @staticmethod
    def activate_period(db: Session, period_id: int) -> Period:
        """Activate a period (start the game)."""
        period = db.query(Period).filter(Period.id == period_id).first()
        if not period:
            raise PeriodError("Periodo no encontrado")

        if period.status != PeriodStatus.SETUP:
            raise PeriodError("Solo periodos en setup pueden activarse")

        period.status = PeriodStatus.ACTIVE
        db.commit()
        db.refresh(period)
        return period

    @staticmethod
    def complete_period(db: Session, period_id: int) -> Period:
        """Mark a period as done."""
        period = db.query(Period).filter(Period.id == period_id).first()
        if not period:
            raise PeriodError("Periodo no encontrado")

        period.status = PeriodStatus.DONE
        db.commit()
        db.refresh(period)
        return period

    @staticmethod
    def get_active_period(db: Session) -> Period | None:
        """Get the currently active period."""
        return db.query(Period).filter(
            Period.status == PeriodStatus.ACTIVE
        ).first()

    @staticmethod
    def get_periods(
        db: Session,
        status: PeriodStatus | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Period], int]:
        """Get periods with optional filtering."""
        query = db.query(Period)
        if status:
            query = query.filter(Period.status == status)
        total = query.count()
        periods = query.order_by(Period.start_date.desc()).offset(offset).limit(limit).all()
        return periods, total

    @staticmethod
    def get_period(db: Session, period_id: int) -> Period | None:
        """Get a single period."""
        return db.query(Period).filter(Period.id == period_id).first()

    @staticmethod
    def get_current_week(period: Period) -> int:
        """Calculate current week number for a period."""
        if period.status != PeriodStatus.ACTIVE:
            return 0
        today = date.today()
        if today < period.start_date:
            return 0
        if today > period.end_date:
            return PeriodService.PERIOD_DURATIONS[period.period_type]
        days_elapsed = (today - period.start_date).days
        return (days_elapsed // 7) + 1

    @staticmethod
    def grant_weekly_credits_to_users(
        db: Session,
        period_id: int,
        user_ids: list[int],
    ) -> int:
        """Grant weekly credits to all users for a period. Returns number of grants."""
        period = db.query(Period).filter(Period.id == period_id).first()
        if not period:
            raise PeriodError("Periodo no encontrado")

        count = 0
        for user_id in user_ids:
            CreditService.grant_weekly_credits(
                db, user_id, period_id, period.weekly_base_credits
            )
            count += 1
        return count
