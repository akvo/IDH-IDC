from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.case_import import CaseImport


def create_case_import(
    session: Session,
    *,
    case_id: int,
    user_id: int,
    file_path: str,
) -> CaseImport:
    obj = CaseImport(
        case_id=case_id,
        user_id=user_id,
        file_path=file_path,
    )
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj


def get_case_import(
    session: Session,
    *,
    import_id,
) -> CaseImport:
    obj = session.query(CaseImport).filter(CaseImport.id == import_id).first()

    if not obj:
        raise HTTPException(
            status_code=404,
            detail="Import session not found for this case",
        )

    return obj
