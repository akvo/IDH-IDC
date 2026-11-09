from fastapi import HTTPException, status
from sqlalchemy.orm import Session

import db.crud_case as crud_case
import db.crud_question as crud_question
import db.crud_reference_data as crud_ref_data
import db.crud_tag as crud_tag
import db.crud_user as crud_user
import db.crud_user_business_unit as crud_bu
import db.crud_user_case_access as crud_uca
from middleware import get_password_hash, verify_password
from models.academy.academy_schemas import ChangePasswordPayload
from models.user import User


def change_user_password(
    session: Session, user: User, payload: ChangePasswordPayload
) -> bool:
    """Validate current password and set new hashed password."""
    if not verify_password(payload.current_password, user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password",
        )
    user.password = get_password_hash(payload.new_password)
    session.commit()
    session.refresh(user)
    return True


def delete_learner_account(session: Session, user: User) -> None:
    """Self-service deletion for learner account with safety checks."""
    cases_owned = crud_case.get_case_by_created_by(
        session=session, created_by=user.id
    )
    if cases_owned:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": (
                    "Cannot delete account: user owns existing cases. "
                    "Please reassign or delete your cases first."
                ),
                "cases": [case.to_dropdown for case in cases_owned],
            },
        )

    cases_updated = crud_case.get_case_by_updated_by(
        session=session, updated_by=user.id
    )
    if cases_updated:
        for case in cases_updated:
            case.updated_by = case.created_by
        session.commit()

    crud_uca.delete_case_access_by_user_id(session=session, user_id=user.id)
    crud_bu.delete_user_business_units_by_user_id(
        session=session, user_id=user.id
    )

    tags = crud_tag.get_tag_by_user_id(session=session, user_id=user.id)
    if tags:
        for tag in tags:
            tag.created_by = None
        session.commit()

    questions = crud_question.get_question_by_created_by(
        session=session, created_by=user.id
    )
    if questions:
        for question in questions:
            question.created_by = None
        session.commit()

    references = crud_ref_data.get_reference_by_created_by(
        session=session, created_by=user.id
    )
    if references:
        for reference in references:
            reference.created_by = None
            session.flush()
            session.commit()

    crud_user.delete_user(session=session, id=user.id)
