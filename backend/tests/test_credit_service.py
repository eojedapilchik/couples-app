from app.models.credit import LedgerType
from app.models.user import User
from app.services.credit_service import CreditService


def test_add_ledger_entry_creates_balance(db_session):
    user = User(name="Alex", pin_hash="hash")
    db_session.add(user)
    db_session.commit()

    entry = CreditService.add_ledger_entry(
        db=db_session,
        user_id=user.id,
        ledger_type=LedgerType.INITIAL_GRANT,
        amount=5,
        note="init",
    )

    balance = CreditService.get_balance(db_session, user.id)
    assert balance == 5
    assert entry.user_id == user.id
    assert entry.amount == 5
