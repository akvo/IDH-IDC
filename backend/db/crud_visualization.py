from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List

from models.visualization import (
    Visualization,
    VisualizationDict,
)


def create_or_update_visualization(
    session: Session, payloads: List[dict]
) -> VisualizationDict:
    res = []
    for payload in payloads:
        prev_data = (
            session.query(Visualization)
            .filter(
                and_(
                    Visualization.case == payload.get("case"),
                    Visualization.tab == payload.get("tab"),
                )
            )
            .first()
        )
        if prev_data:
            # update
            prev_data.config = payload.get("config")
            session.commit()
            session.flush()
            session.refresh(prev_data)
            res.append(prev_data)
        else:
            # add
            data = Visualization(
                case=payload.get("case"),
                tab=payload.get("tab"),
                config=payload.get("config"),
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
