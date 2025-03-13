from typing import List
from sqlalchemy.orm import Session
from models.procurement_library.procurement_process import (
    ProcurementProcess,
    ProcurementProcessDict,
)


def get_all_procurement_processes(
    session: Session
) -> List[ProcurementProcessDict]:
    list = session.query(ProcurementProcess).all()
    return [item.serialize for item in list]
