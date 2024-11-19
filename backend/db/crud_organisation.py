from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.organisation import Organisation, OrganisationDict


def add_organisation(
    session: Session,
    name: str,
    id: Optional[int] = None,
) -> OrganisationDict:
    organisation = Organisation(id=id, name=name)
    session.add(organisation)
    session.commit()
    session.flush()
    session.refresh(organisation)
    return organisation


def get_organisation_by_name(session: Session, name: str) -> Organisation:
    return (
        session.query(Organisation)
        .filter(Organisation.name.ilike("%{}%".format(name.lower().strip())))
        .first()
    )


def get_organisation_by_id(session: Session, id: int) -> OrganisationDict:
    org = session.query(Organisation).filter(Organisation.id == id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"organisation {id} not found",
        )
    return org


def get_all_organisation(session: Session) -> List[OrganisationDict]:
    return session.query(Organisation).all()


def default_organisation(session: Session, name: str) -> Organisation:
    org = get_organisation_by_name(session=session, name=name)
    if not org:
        # add organisation
        organisation = add_organisation(
            session=session,
            name=name,
        )
        return organisation
    return org
