from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List

from models.visualization import (
    Visualization,
    VisualizationDict,
)


def create_or_update_visualization(
    session: Session, payloads: List[dict]
) -> List[Visualization]:
    res = []
    for payload in payloads:
        if not isinstance(payload, dict):
            continue
        case_id = payload.get("case")
        tab = payload.get("tab")
        config = payload.get("config")
        if not case_id or not tab or config is None:
            continue
        prev_data = (
            session.query(Visualization)
            .filter(
                and_(
                    Visualization.case == case_id,
                    Visualization.tab == tab,
                )
            )
            .first()
        )
        if prev_data:
            # update
            prev_data.config = config
            session.commit()
            session.flush()
            session.refresh(prev_data)
            res.append(prev_data)
        else:
            # add
            data = Visualization(
                case=case_id,
                tab=tab,
                config=config,
            )
            session.add(data)
            session.commit()
            session.flush()
            session.refresh(data)
            res.append(data)
    return res


def get_by_case_id(session: Session, case_id: int) -> List[VisualizationDict]:
    return (
        session.query(Visualization)
        .filter(Visualization.case == case_id)
        .all()
    )
