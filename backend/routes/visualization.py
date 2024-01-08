import db.crud_visualization as crud_visualization
import db.crud_case as crud_case

from fastapi import APIRouter, Request, Depends, Query
from fastapi.security import HTTPBearer, HTTPBasicCredentials as credentials
from sqlalchemy.orm import Session
from typing import List, Optional

from db.connection import get_session
from models.visualization import VisualizationBase, VisualizationDict
from middleware import verify_case_editor, verify_case_viewer

security = HTTPBearer()
visualization_route = APIRouter()


@visualization_route.post(
    "/visualization",
    response_model=List[VisualizationDict],
    summary="create or update visualization",
    name="visualization:create_or_update",
    tags=["Visualization"],
)
def create_visualization(
    req: Request,
    payload: List[VisualizationBase],
    updated: Optional[bool] = Query(None),
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    case_id = payload[0].case
    user = verify_case_editor(
        session=session, authenticated=req.state.authenticated, case_id=case_id
    )
    data = crud_visualization.create_or_update_visualization(
        session=session, payloads=payload
    )
    if updated:
        crud_case.case_updated_by(
            session=session, case_id=case_id, user_id=user.id
        )
    return [d.serialize for d in data]


@visualization_route.get(
    "/visualization/case/{case_id:path}",
    response_model=List[VisualizationDict],
    summary="get visualization data by case id",
    name="visualization:get_by_case_id",
    tags=["Visualization"],
)
def get_visualization_by_case_id(
    req: Request,
    case_id: int,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    verify_case_viewer(
        session=session, authenticated=req.state.authenticated, case_id=case_id
    )
    data = crud_visualization.get_by_case_id(session=session, case_id=case_id)
    return [d.serialize for d in data]
