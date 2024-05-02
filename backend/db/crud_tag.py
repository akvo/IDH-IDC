from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from typing_extensions import TypedDict
from fastapi import HTTPException, status

from models.tag import Tag, TagListDict, TagBase, UpdateTagBase, TagDict
from models.case_tag import CaseTag
from models.user import User


class PaginatedTagData(TypedDict):
    count: int
    data: List[TagListDict]


def get_all_tag(
    session: Session,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 10,
) -> List[TagListDict]:
    tag = session.query(Tag)
    if search:
        tag = tag.filter(Tag.name.ilike("%{}%".format(search.lower().strip())))
    count = tag.count()
    tag = tag.order_by(Tag.id.desc()).offset(skip).limit(limit).all()
    return PaginatedTagData(count=count, data=tag)


def add_tag(session: Session, payload: TagBase, user: User) -> TagListDict:
    last_tag = session.query(Tag).order_by(desc(Tag.id)).first()
    tag = Tag(
        id=last_tag.id + 1 if last_tag else None,
        name=payload.name,
        description=payload.description,
        created_by=user.id if user else None,
    )
    if payload.cases:
        for proj in payload.cases:
            case_tag = CaseTag(case=proj)
            tag.tag_cases.append(case_tag)
    session.add(tag)
    session.commit()
    session.flush()
    session.refresh(tag)
    return tag


def get_tag_by_id(session: Session, id: int) -> TagListDict:
    tag = session.query(Tag).filter(Tag.id == id).first()
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Tag {id} not found"
        )
    return tag


def update_tag(
    session: Session, id: int, payload: UpdateTagBase
) -> TagListDict:
    tag = get_tag_by_id(session=session, id=id)
    tag.name = payload.name
    tag.description = payload.description
    if payload.cases:
        # delete previous case tag then add new tag
        session.query(CaseTag).filter(CaseTag.tag == tag.id).delete()
        for proj in payload.cases:
            case_tag = CaseTag(case=proj, tag=tag.id)
            tag.tag_cases.append(case_tag)
    session.commit()
    session.flush()
    session.refresh(tag)
    return tag


def get_all_tag_options(session: Session) -> List[TagDict]:
    return session.query(Tag).all()


def get_tag_by_user_id(session: Session, user_id: int):
    tags = session.query(Tag).filter(Tag.created_by == user_id).all()
    return tags
