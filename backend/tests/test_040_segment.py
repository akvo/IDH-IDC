import sys
import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from tests.test_000_main import Acc

sys.path.append("..")

non_admin_account = Acc(email="support@akvo.org", token=None)
admin_account = Acc(email="super_admin@akvo.org", token=None)


class TestSegmentRoute:
    # test_get_all_segment_return_404
    @pytest.mark.asyncio
    async def test_create_segment(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = [
            {
                "name": "Segment 1",
                "case": 1,
                "region": 1,
                "target": 1000,
                "adult": 2,
                "child": 3,
            }
        ]
        # without cred
        res = await client.post(
            app.url_path_for("segment:create"),
            json=payload,
        )
        assert res.status_code == 403
        # with admin user cred
        res = await client.post(
            app.url_path_for("segment:create"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [
            {
                "id": 1,
                "case": 1,
                "region": 1,
                "name": "Segment 1",
                "target": 1000.0,
                "adult": 2.0,
                "child": 3.0,
            }
        ]
        # with admin user cred
        payload = [
            {
                "name": "Segment 2",
                "case": 1,
                "region": 1,
                "target": 2000,
                "adult": 3,
                "child": 2,
            },
            {
                "name": "Segment 3",
                "case": 1,
                "region": 2,
                "target": 3000,
                "adult": 4,
                "child": 2,
                "answers": [
                    {
                        "case_commodity": 1,
                        "question": 1,
                        "current_value": 10000,
                        "feasible_value": None,
                    },
                    {
                        "case_commodity": 1,
                        "question": 2,
                        "current_value": None,
                        "feasible_value": None,
                    },
                ],
            },
        ]
        res = await client.post(
            app.url_path_for("segment:create"),
            params={"updated": True},
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [
            {
                "id": res[0]["id"],
                "case": 1,
                "region": 1,
                "name": "Segment 2",
                "target": 2000.0,
                "adult": 3.0,
                "child": 2.0,
            },
            {
                "id": res[1]["id"],
                "case": 1,
                "region": 2,
                "name": "Segment 3",
                "target": 3000.0,
                "adult": 4.0,
                "child": 2.0,
            },
        ]

    @pytest.mark.asyncio
    async def test_update_segment(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = [
            {
                "id": 1,
                "name": "Segment 1 Updated",
                "case": 1,
                "region": 1,
                "target": 2000,
                "adult": 4,
                "child": 2,
            }
        ]
        # without cred
        res = await client.put(
            app.url_path_for("segment:update"),
            json=payload,
        )
        assert res.status_code == 403
        # with admin user cred
        res = await client.put(
            app.url_path_for("segment:update"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [
            {
                "id": 1,
                "case": 1,
                "region": 1,
                "name": "Segment 1 Updated",
                "target": 2000.0,
                "adult": 4.0,
                "child": 2.0,
            }
        ]
        # with admin user cred
        payload = [
            {
                "id": 1,
                "name": "Segment 1",
                "case": 1,
                "region": 1,
                "target": 2000,
                "adult": 5,
                "child": 0,
            },
            {
                "id": 2,
                "name": "Segment 2",
                "case": 1,
                "region": 2,
                "target": 2000,
                "household_size": 50,
                "adult": 6,
                "child": 0,
            },
            {
                "id": 3,
                "name": "Segment 3",
                "case": 1,
                "region": 1,
                "target": 3000,
                "adult": 4,
                "child": 2,
                "answers": [
                    {
                        "case_commodity": 1,
                        "question": 1,
                        "current_value": 10000,
                        "feasible_value": None,
                    },
                    {
                        "case_commodity": 1,
                        "question": 2,
                        "current_value": None,
                        "feasible_value": None,
                    },
                    {
                        "case_commodity": 1,
                        "question": 3,
                        "current_value": None,
                        "feasible_value": 500,
                    },
                ],
            },
        ]
        res = await client.put(
            app.url_path_for("segment:update"),
            params={"updated": True},
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [
            {
                "id": 1,
                "case": 1,
                "region": 1,
                "name": "Segment 1",
                "target": 2000.0,
                "adult": 5.0,
                "child": 0.0,
            },
            {
                "id": 2,
                "case": 1,
                "region": 2,
                "name": "Segment 2",
                "target": 2000.0,
                "adult": 6.0,
                "child": 0.0,
            },
            {
                "id": 3,
                "case": 1,
                "region": 1,
                "name": "Segment 3",
                "target": 3000.0,
                "adult": 4.0,
                "child": 2.0,
            },
        ]
