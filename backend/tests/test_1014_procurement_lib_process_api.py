import pytest
import sys
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session

sys.path.append("..")


class TestProcurementProcessRoute:
    @pytest.mark.asyncio
    async def test_get_all_procurement_processes(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        res = await client.get(
            app.url_path_for("pl:get_all_procurement_processes"),
        )
        assert res.status_code == 200
        res = res.json()
        assert len(res) == 20
        assert list(res[0].keys()) == [
            "id",
            "label",
        ]
