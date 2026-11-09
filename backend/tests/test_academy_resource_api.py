from datetime import datetime, timedelta
from jose import jwt
import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session

from db.academy import crud_resource
from middleware import create_access_token, SECRET_KEY, ALGORITHM
from models.academy import (
    AcademyGlossaryItemResponse,
    AcademyGlossaryTerm,
    AcademyGlossaryTermType,
    AcademyResource,
    AcademyResourceItemResponse,
    AcademyResourceType,
)
from models.organisation import Organisation
from models.user import User, UserRole
from routes.academy.resource import get_glossary, get_resources
from seeder.academy import seed_academy


@pytest.fixture(autouse=True)
def ensure_academy_seeded(app: FastAPI, session: Session):
    """Ensure academy curriculum and resources are seeded before test runs."""
    resource_count = session.query(AcademyResource).count()
    glossary_count = session.query(AcademyGlossaryTerm).count()
    if resource_count == 0 or glossary_count == 0:
        seed_academy(session=session)
    yield
    session.rollback()


def get_or_create_test_user(
    session: Session,
    email: str = "resource_learner@test.org",
    fullname: str = "Resource Learner",
) -> User:
    """Helper to retrieve or instantiate an active test learner."""
    user = session.query(User).filter(User.email == email).first()
    if not user:
        org = session.query(Organisation).first()
        if not org:
            org = Organisation(id=None, name="Test Organisation")
            session.add(org)
            session.commit()
            session.refresh(org)
        user = User(
            organisation=org.id,
            fullname=fullname,
            email=email,
            password="test_hashed_password",
            role=UserRole.user,
            is_active=1,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    return user


def get_auth_header(email: str) -> dict:
    """Generate bearer auth header for the given email."""
    token = create_access_token(data={"email": email})
    return {"Authorization": f"Bearer {token}"}


class TestAcademyResourceAuthGuard:
    """Verify resources and glossary endpoints reject unauthenticated calls."""

    @pytest.mark.asyncio
    async def test_resources_auth_guard(
        self, app: FastAPI, client: AsyncClient
    ):
        url = app.url_path_for("academy:get_resources")
        res = await client.get(url)
        assert res.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_glossary_auth_guard(
        self, app: FastAPI, client: AsyncClient
    ):
        url = app.url_path_for("academy:get_glossary")
        res = await client.get(url)
        assert res.status_code in (401, 403)


class TestAcademyResourcesApi:
    """Test suite for GET /academy/resources endpoint."""

    @pytest.mark.asyncio
    async def test_get_resources_unfiltered(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_resources")

        res = await client.get(url, headers=headers)
        assert res.status_code == 200
        payload = res.json()
        assert "total" in payload
        assert "data" in payload
        assert payload["total"] >= 9
        assert len(payload["data"]) == payload["total"]

        first_item = payload["data"][0]
        assert "id" in first_item
        assert "name" in first_item
        assert "type" in first_item
        assert "url" in first_item
        assert "description" in first_item
        assert "created_at" in first_item
        assert first_item["type"] in [
            e.value for e in AcademyResourceType
        ]

    @pytest.mark.asyncio
    async def test_get_resources_search_by_name(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_resources")

        # Case-insensitive name search
        res = await client.get(
            url, headers=headers, params={"search": "roadmap"}
        )
        assert res.status_code == 200
        payload = res.json()
        assert payload["total"] >= 1
        assert any(
            "roadmap" in item["name"].lower() for item in payload["data"]
        )

    @pytest.mark.asyncio
    async def test_get_resources_search_by_url(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_resources")

        res = await client.get(
            url, headers=headers, params={"search": "globallivingwage"}
        )
        assert res.status_code == 200
        payload = res.json()
        assert payload["total"] >= 1
        assert any(
            "globallivingwage" in item["url"].lower()
            for item in payload["data"]
        )

    @pytest.mark.asyncio
    async def test_get_resources_filter_by_type(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_resources")

        res = await client.get(
            url, headers=headers, params={"resource_type": "Guidance"}
        )
        assert res.status_code == 200
        payload = res.json()
        assert payload["total"] >= 1
        assert all(item["type"] == "Guidance" for item in payload["data"])

        res_tool = await client.get(
            url, headers=headers, params={"resource_type": "Tool"}
        )
        assert res_tool.status_code == 200
        payload_tool = res_tool.json()
        assert payload_tool["total"] >= 1
        assert all(item["type"] == "Tool" for item in payload_tool["data"])

    @pytest.mark.asyncio
    async def test_get_resources_combined_search_and_type(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_resources")

        res = await client.get(
            url,
            headers=headers,
            params={"search": "guide", "resource_type": "Guidance"},
        )
        assert res.status_code == 200
        payload = res.json()
        assert all(item["type"] == "Guidance" for item in payload["data"])
        for item in payload["data"]:
            assert (
                "guide" in item["name"].lower()
                or "guide" in item["url"].lower()
            )

    @pytest.mark.asyncio
    async def test_get_resources_sorting_name_asc_and_desc(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_resources")

        res_asc = await client.get(
            url, headers=headers, params={"sort_by": "name", "sort_order": "asc"}
        )
        assert res_asc.status_code == 200
        data_asc = res_asc.json()["data"]
        names_asc = [d["name"].lower() for d in data_asc]
        assert names_asc == sorted(names_asc)

        res_desc = await client.get(
            url,
            headers=headers,
            params={"sort_by": "name", "sort_order": "desc"},
        )
        assert res_desc.status_code == 200
        data_desc = res_desc.json()["data"]
        names_desc = [d["name"].lower() for d in data_desc]
        assert names_desc == sorted(names_desc, reverse=True)

    @pytest.mark.asyncio
    async def test_get_resources_sorting_aliases(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_resources")

        # sort_by=type and sort_by=resource_type
        res_type = await client.get(
            url, headers=headers, params={"sort_by": "type", "sort_order": "asc"}
        )
        assert res_type.status_code == 200

        res_res_type = await client.get(
            url,
            headers=headers,
            params={"sort_by": "resource_type", "sort_order": "asc"},
        )
        assert res_res_type.status_code == 200
        assert (
            [d["id"] for d in res_type.json()["data"]]
            == [d["id"] for d in res_res_type.json()["data"]]
        )

        # sort_by=created_at and sort_by=date
        res_created = await client.get(
            url,
            headers=headers,
            params={"sort_by": "created_at", "sort_order": "desc"},
        )
        assert res_created.status_code == 200

        res_date = await client.get(
            url, headers=headers, params={"sort_by": "date", "sort_order": "desc"}
        )
        assert res_date.status_code == 200
        assert (
            [d["id"] for d in res_created.json()["data"]]
            == [d["id"] for d in res_date.json()["data"]]
        )

    @pytest.mark.asyncio
    async def test_get_resources_empty_search_result(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_resources")

        res = await client.get(
            url, headers=headers, params={"search": "NonExistentTermXYZ123"}
        )
        assert res.status_code == 200
        payload = res.json()
        assert payload["total"] == 0
        assert payload["data"] == []

    @pytest.mark.asyncio
    async def test_get_resources_invalid_enum_422(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_resources")

        res = await client.get(
            url, headers=headers, params={"resource_type": "InvalidTypeValue"}
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_get_resources_search_sql_wildcards_and_injection(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_resources")

        # SQL injection strings must be safely parameterized without errors
        injection_queries = [
            "' OR '1'='1",
            "'; DROP TABLE academy_resource; --",
            '" OR "1"="1',
            "%'",
            "test%pattern",
            "test_pattern",
            "admin'--",
        ]
        for query in injection_queries:
            res = await client.get(
                url, headers=headers, params={"search": query}
            )
            assert res.status_code == 200
            payload = res.json()
            assert "total" in payload
            assert "data" in payload

        # Verify database integrity was preserved
        assert session.query(AcademyResource).count() >= 9

    @pytest.mark.asyncio
    async def test_get_resources_search_whitespace_handling(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_resources")

        # Leading and trailing whitespace should be stripped and match
        res_trimmed = await client.get(
            url, headers=headers, params={"search": "   roadmap   "}
        )
        assert res_trimmed.status_code == 200
        payload_trimmed = res_trimmed.json()
        assert payload_trimmed["total"] >= 1
        assert any(
            "roadmap" in item["name"].lower()
            for item in payload_trimmed["data"]
        )

        # Whitespace-only search should fall back to returning all records
        res_spaces = await client.get(
            url, headers=headers, params={"search": "     "}
        )
        assert res_spaces.status_code == 200
        payload_spaces = res_spaces.json()
        assert payload_spaces["total"] >= 9

    @pytest.mark.asyncio
    async def test_get_resources_resilient_sorting_edge_cases(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_resources")

        # Invalid sort_by falls back gracefully to default 'name'
        res_invalid_sort = await client.get(
            url, headers=headers, params={"sort_by": "non_existent_column"}
        )
        assert res_invalid_sort.status_code == 200
        data_invalid_sort = res_invalid_sort.json()["data"]
        names = [d["name"].lower() for d in data_invalid_sort]
        assert names == sorted(names)

        # Malicious sort_by string falls back safely to 'name'
        res_sql_sort = await client.get(
            url,
            headers=headers,
            params={"sort_by": "id; DROP TABLE academy_resource"},
        )
        assert res_sql_sort.status_code == 200

        # Invalid sort_order falls back to 'asc'
        res_invalid_order = await client.get(
            url,
            headers=headers,
            params={"sort_by": "name", "sort_order": "random_direction"},
        )
        assert res_invalid_order.status_code == 200
        names_order = [d["name"].lower() for d in res_invalid_order.json()["data"]]
        assert names_order == sorted(names_order)

        # Whitespace padded sort params are normalized
        res_padded = await client.get(
            url,
            headers=headers,
            params={"sort_by": "  name  ", "sort_order": "  desc  "},
        )
        assert res_padded.status_code == 200
        names_desc = [d["name"].lower() for d in res_padded.json()["data"]]
        assert names_desc == sorted(names_desc, reverse=True)

    @pytest.mark.asyncio
    async def test_get_resources_enum_case_sensitivity_and_validation(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_resources")

        # Lowercase enum strings fail with strict 422 validation
        res_lower = await client.get(
            url, headers=headers, params={"resource_type": "guidance"}
        )
        assert res_lower.status_code == 422

        res_upper = await client.get(
            url, headers=headers, params={"resource_type": "TOOL"}
        )
        assert res_upper.status_code == 422

        # All valid enum variants succeed with 200
        for r_type in AcademyResourceType:
            res_valid = await client.get(
                url, headers=headers, params={"resource_type": r_type.value}
            )
            assert res_valid.status_code == 200
            for item in res_valid.json()["data"]:
                assert item["type"] == r_type.value


class TestAcademyGlossaryApi:
    """Test suite for GET /academy/glossary endpoint."""

    @pytest.mark.asyncio
    async def test_get_glossary_unfiltered(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_glossary")

        res = await client.get(url, headers=headers)
        assert res.status_code == 200
        payload = res.json()
        assert "total" in payload
        assert "data" in payload
        assert payload["total"] >= 13
        assert len(payload["data"]) == payload["total"]

        first_item = payload["data"][0]
        assert "id" in first_item
        assert "term" in first_item
        assert "type" in first_item
        assert "definition" in first_item
        assert "created_at" in first_item
        assert first_item["type"] in [
            e.value for e in AcademyGlossaryTermType
        ]

    @pytest.mark.asyncio
    async def test_get_glossary_search_by_term(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_glossary")

        res = await client.get(
            url, headers=headers, params={"search": "Living Income"}
        )
        assert res.status_code == 200
        payload = res.json()
        assert payload["total"] >= 1
        assert any(
            "living income" in item["term"].lower()
            for item in payload["data"]
        )

    @pytest.mark.asyncio
    async def test_get_glossary_search_by_definition(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_glossary")

        res = await client.get(
            url, headers=headers, params={"search": "smallholder"}
        )
        assert res.status_code == 200
        payload = res.json()
        assert payload["total"] >= 1
        assert any(
            "smallholder" in item["definition"].lower()
            for item in payload["data"]
        )

    @pytest.mark.asyncio
    async def test_get_glossary_filter_by_type(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_glossary")

        res = await client.get(
            url, headers=headers, params={"term_type": "Core"}
        )
        assert res.status_code == 200
        payload = res.json()
        assert payload["total"] >= 1
        assert all(item["type"] == "Core" for item in payload["data"])

        res_fin = await client.get(
            url, headers=headers, params={"term_type": "Finance"}
        )
        assert res_fin.status_code == 200
        payload_fin = res_fin.json()
        assert payload_fin["total"] >= 1
        assert all(item["type"] == "Finance" for item in payload_fin["data"])

    @pytest.mark.asyncio
    async def test_get_glossary_combined_search_and_type(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_glossary")

        res = await client.get(
            url,
            headers=headers,
            params={"search": "income", "term_type": "Core"},
        )
        assert res.status_code == 200
        payload = res.json()
        assert all(item["type"] == "Core" for item in payload["data"])
        for item in payload["data"]:
            assert (
                "income" in item["term"].lower()
                or "income" in item["definition"].lower()
            )

    @pytest.mark.asyncio
    async def test_get_glossary_sorting_term_asc_and_desc(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_glossary")

        res_asc = await client.get(
            url, headers=headers, params={"sort_by": "name", "sort_order": "asc"}
        )
        assert res_asc.status_code == 200
        data_asc = res_asc.json()["data"]
        terms_asc = [d["term"].lower() for d in data_asc]
        assert terms_asc == sorted(terms_asc)

        res_desc = await client.get(
            url,
            headers=headers,
            params={"sort_by": "term", "sort_order": "desc"},
        )
        assert res_desc.status_code == 200
        data_desc = res_desc.json()["data"]
        terms_desc = [d["term"].lower() for d in data_desc]
        assert terms_desc == sorted(terms_desc, reverse=True)

    @pytest.mark.asyncio
    async def test_get_glossary_sorting_aliases(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_glossary")

        # sort_by=type and sort_by=term_type
        res_type = await client.get(
            url, headers=headers, params={"sort_by": "type", "sort_order": "asc"}
        )
        assert res_type.status_code == 200

        res_term_type = await client.get(
            url,
            headers=headers,
            params={"sort_by": "term_type", "sort_order": "asc"},
        )
        assert res_term_type.status_code == 200
        assert (
            [d["id"] for d in res_type.json()["data"]]
            == [d["id"] for d in res_term_type.json()["data"]]
        )

        # sort_by=created_at and sort_by=date
        res_created = await client.get(
            url,
            headers=headers,
            params={"sort_by": "created_at", "sort_order": "asc"},
        )
        assert res_created.status_code == 200

        res_date = await client.get(
            url, headers=headers, params={"sort_by": "date", "sort_order": "asc"}
        )
        assert res_date.status_code == 200
        assert (
            [d["id"] for d in res_created.json()["data"]]
            == [d["id"] for d in res_date.json()["data"]]
        )

    @pytest.mark.asyncio
    async def test_get_glossary_empty_search_result(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_glossary")

        res = await client.get(
            url, headers=headers, params={"search": "NonExistentXYZ987"}
        )
        assert res.status_code == 200
        payload = res.json()
        assert payload["total"] == 0
        assert payload["data"] == []

    @pytest.mark.asyncio
    async def test_get_glossary_invalid_enum_422(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_glossary")

        res = await client.get(
            url, headers=headers, params={"term_type": "InvalidTermTypeValue"}
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_get_glossary_search_sql_wildcards_and_injection(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_glossary")

        # SQL injection strings must be safely parameterized without errors
        injection_queries = [
            "' OR '1'='1",
            "'; DROP TABLE academy_glossary_term; --",
            '" OR "1"="1',
            "%'",
            "term%pattern",
            "term_pattern",
            "admin'--",
        ]
        for query in injection_queries:
            res = await client.get(
                url, headers=headers, params={"search": query}
            )
            assert res.status_code == 200
            payload = res.json()
            assert "total" in payload
            assert "data" in payload

        # Verify database integrity was preserved
        assert session.query(AcademyGlossaryTerm).count() >= 13

    @pytest.mark.asyncio
    async def test_get_glossary_search_whitespace_handling(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_glossary")

        # Leading and trailing whitespace should be stripped and match
        res_trimmed = await client.get(
            url, headers=headers, params={"search": "   living income   "}
        )
        assert res_trimmed.status_code == 200
        payload_trimmed = res_trimmed.json()
        assert payload_trimmed["total"] >= 1
        assert any(
            "living income" in item["term"].lower()
            for item in payload_trimmed["data"]
        )

        # Whitespace-only search should fall back to returning all records
        res_spaces = await client.get(
            url, headers=headers, params={"search": "   \t\n   "}
        )
        assert res_spaces.status_code == 200
        payload_spaces = res_spaces.json()
        assert payload_spaces["total"] >= 13

    @pytest.mark.asyncio
    async def test_get_glossary_resilient_sorting_edge_cases(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_glossary")

        # Invalid sort_by falls back gracefully to default 'name' (term)
        res_invalid_sort = await client.get(
            url, headers=headers, params={"sort_by": "non_existent_column"}
        )
        assert res_invalid_sort.status_code == 200
        data_invalid_sort = res_invalid_sort.json()["data"]
        terms = [d["term"].lower() for d in data_invalid_sort]
        assert terms == sorted(terms)

        # Malicious sort_by string falls back safely to 'name'
        res_sql_sort = await client.get(
            url,
            headers=headers,
            params={"sort_by": "id; DROP TABLE academy_glossary_term"},
        )
        assert res_sql_sort.status_code == 200

        # Invalid sort_order falls back to 'asc'
        res_invalid_order = await client.get(
            url,
            headers=headers,
            params={"sort_by": "term", "sort_order": "random_direction"},
        )
        assert res_invalid_order.status_code == 200
        terms_order = [
            d["term"].lower() for d in res_invalid_order.json()["data"]
        ]
        assert terms_order == sorted(terms_order)

        # Whitespace padded sort params are normalized
        res_padded = await client.get(
            url,
            headers=headers,
            params={"sort_by": "  term  ", "sort_order": "  desc  "},
        )
        assert res_padded.status_code == 200
        terms_desc = [d["term"].lower() for d in res_padded.json()["data"]]
        assert terms_desc == sorted(terms_desc, reverse=True)

    @pytest.mark.asyncio
    async def test_get_glossary_enum_case_sensitivity_and_validation(
        self, app: FastAPI, client: AsyncClient, session: Session
    ):
        user = get_or_create_test_user(session)
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_glossary")

        # Lowercase enum strings fail with strict 422 validation
        res_lower = await client.get(
            url, headers=headers, params={"term_type": "core"}
        )
        assert res_lower.status_code == 422

        res_upper = await client.get(
            url, headers=headers, params={"term_type": "FINANCE"}
        )
        assert res_upper.status_code == 422

        # All valid enum variants succeed with 200
        for g_type in AcademyGlossaryTermType:
            res_valid = await client.get(
                url, headers=headers, params={"term_type": g_type.value}
            )
            assert res_valid.status_code == 200
            for item in res_valid.json()["data"]:
                assert item["type"] == g_type.value


class TestCrudResourceDirect:
    """Direct testing of crud_resource functions."""

    def test_direct_crud_resources(self, session: Session):
        res = crud_resource.get_academy_resources(
            session=session,
            search="overview",
            resource_type=AcademyResourceType.Guidance,
            sort_by="name",
            sort_order="asc",
        )
        assert res.total >= 1
        assert res.data[0].type == AcademyResourceType.Guidance

        # Branch coverage: created_at sort_by, desc order
        res_date = crud_resource.get_academy_resources(
            session=session,
            sort_by="created_at",
            sort_order="desc",
        )
        assert res_date.total >= 1

        # Branch coverage: type sort_by
        res_type = crud_resource.get_academy_resources(
            session=session,
            sort_by="type",
            sort_order="asc",
        )
        assert res_type.total >= 1

        # Branch coverage: fallback sort_by
        res_fb = crud_resource.get_academy_resources(
            session=session,
            sort_by="unknown_column",
            sort_order="asc",
        )
        assert res_fb.total >= 1

    def test_direct_crud_glossary(self, session: Session):
        res = crud_resource.get_academy_glossary(
            session=session,
            search="benchmark",
            term_type=AcademyGlossaryTermType.Core,
            sort_by="name",
            sort_order="asc",
        )
        assert res.total >= 1
        assert res.data[0].type == AcademyGlossaryTermType.Core

        # Branch coverage: created_at sort_by, desc order
        res_date = crud_resource.get_academy_glossary(
            session=session,
            sort_by="created_at",
            sort_order="desc",
        )
        assert res_date.total >= 1

        # Branch coverage: type sort_by
        res_type = crud_resource.get_academy_glossary(
            session=session,
            sort_by="type",
            sort_order="asc",
        )
        assert res_type.total >= 1

        # Branch coverage: fallback sort_by
        res_fb = crud_resource.get_academy_glossary(
            session=session,
            sort_by="unknown_column",
            sort_order="asc",
        )
        assert res_fb.total >= 1

    def test_direct_crud_resources_edge_cases(self, session: Session):
        # Empty and whitespace searches return unfiltered results
        for empty_s in (None, "", "   \t\n   "):
            res = crud_resource.get_academy_resources(
                session=session, search=empty_s
            )
            assert res.total >= 9

        # Injections and non-existent patterns return 0 safely
        for inj in ("' OR '1'='1", "%; DROP TABLE academy_resource;"):
            res_inj = crud_resource.get_academy_resources(
                session=session, search=inj
            )
            assert res_inj.total == 0
            assert res_inj.data == []

        # Non-string sort arguments trigger safe default fallbacks
        res_non_str = crud_resource.get_academy_resources(
            session=session,
            sort_by=123,
            sort_order=456,
        )
        assert res_non_str.total >= 9

        # Case-insensitive whitespace-padded sorting aliases
        res_type = crud_resource.get_academy_resources(
            session=session,
            sort_by="  RESOURCE_TYPE  ",
            sort_order="  DESC  ",
        )
        assert res_type.total >= 9

        res_date = crud_resource.get_academy_resources(
            session=session,
            sort_by="  DATE  ",
            sort_order="  ASC  ",
        )
        assert res_date.total >= 9

    def test_direct_crud_glossary_edge_cases(self, session: Session):
        # Empty and whitespace searches return unfiltered results
        for empty_s in (None, "", "   \t\n   "):
            res = crud_resource.get_academy_glossary(
                session=session, search=empty_s
            )
            assert res.total >= 13

        # Injections and non-existent patterns return 0 safely
        for inj in ("' OR '1'='1", "%; DROP TABLE academy_glossary_term;"):
            res_inj = crud_resource.get_academy_glossary(
                session=session, search=inj
            )
            assert res_inj.total == 0
            assert res_inj.data == []

        # Non-string sort arguments trigger safe default fallbacks
        res_non_str = crud_resource.get_academy_glossary(
            session=session,
            sort_by=999,
            sort_order=888,
        )
        assert res_non_str.total >= 13

        # Case-insensitive whitespace-padded sorting aliases
        res_type = crud_resource.get_academy_glossary(
            session=session,
            sort_by="  TERM_TYPE  ",
            sort_order="  DESC  ",
        )
        assert res_type.total >= 13

        res_date = crud_resource.get_academy_glossary(
            session=session,
            sort_by="  DATE  ",
            sort_order="  ASC  ",
        )
        assert res_date.total >= 13

    def test_direct_routes_handlers_edge_cases(self, session: Session):
        from datetime import datetime, timedelta

        user = get_or_create_test_user(session)
        exp_ts = (datetime.now() + timedelta(hours=1)).timestamp()

        class DummyState:
            authenticated = {"email": user.email, "exp": exp_ts}

        class DummyRequest:
            state = DummyState()

        req = DummyRequest()

        # Test route handler with whitespace search and invalid sort parameters
        res_r = get_resources(
            req=req,
            session=session,
            credentials=None,
            search="   ",
            resource_type=None,
            sort_by="invalid_col",
            sort_order="invalid_dir",
        )
        assert res_r.total >= 9

        res_g = get_glossary(
            req=req,
            session=session,
            credentials=None,
            search="   ",
            term_type=None,
            sort_by="invalid_col",
            sort_order="invalid_dir",
        )
        assert res_g.total >= 13

    def test_direct_routes_handlers(self, session: Session):
        from datetime import datetime, timedelta

        user = get_or_create_test_user(session)
        exp_ts = (datetime.now() + timedelta(hours=1)).timestamp()

        class DummyState:
            authenticated = {"email": user.email, "exp": exp_ts}

        class DummyRequest:
            state = DummyState()

        req = DummyRequest()
        res_r = get_resources(
            req=req,
            session=session,
            credentials=None,
            search=None,
            resource_type=None,
            sort_by="name",
            sort_order="asc",
        )
        assert res_r.total >= 9

        res_g = get_glossary(
            req=req,
            session=session,
            credentials=None,
            search=None,
            term_type=None,
            sort_by="name",
            sort_order="asc",
        )
        assert res_g.total >= 13

    def test_pydantic_schema_orm_and_dict_validators(
        self, session: Session
    ):
        r_orm = session.query(AcademyResource).first()
        item_orm = AcademyResourceItemResponse.model_validate(r_orm)
        assert item_orm.id == r_orm.id
        assert item_orm.name == r_orm.name
        assert item_orm.type == r_orm.resource_type
        assert item_orm.url == r_orm.file_url

        item_dict = AcademyResourceItemResponse.model_validate(
            {
                "id": 999,
                "name": "Dict Resource",
                "resource_type": "Tool",
                "file_url": "https://example.com/tool",
                "created_at": r_orm.created_at,
            }
        )
        assert item_dict.type == AcademyResourceType.Tool
        assert item_dict.url == "https://example.com/tool"

        g_orm = session.query(AcademyGlossaryTerm).first()
        g_item_orm = AcademyGlossaryItemResponse.model_validate(g_orm)
        assert g_item_orm.id == g_orm.id
        assert g_item_orm.term == g_orm.name
        assert g_item_orm.type == g_orm.term_type
        assert g_item_orm.definition == g_orm.definition

        g_item_dict = AcademyGlossaryItemResponse.model_validate(
            {
                "id": 888,
                "name": "Dict Term",
                "term_type": "Core",
                "definition": "A test definition",
                "created_at": g_orm.created_at,
            }
        )
        assert g_item_dict.term == "Dict Term"
        assert g_item_dict.type == AcademyGlossaryTermType.Core


class TestAcademyResourceDeepEdgeCases:
    """Deep test verification for resource and glossary edge cases, malformed params, security."""

    @pytest.mark.asyncio
    async def test_resources_extreme_and_invalid_query_parameters(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """Malformed enums return 422, unknown sorts and wildcards fall back gracefully."""
        user = get_or_create_test_user(session, "res_deep_user@test.org")
        headers = {"Authorization": f"Bearer {create_access_token(data={'email': user.email})}"}
        url = app.url_path_for("academy:get_resources")

        # 1. Invalid enum query params return 422
        for invalid_type in ["SUPER_TOOL", "UNKNOWN_TYPE", "123"]:
            res = await client.get(url, params={"resource_type": invalid_type}, headers=headers)
            assert res.status_code == 422, f"Expected 422 for resource_type={invalid_type}"

        # 2. Unknown sort_by and sort_order fall back gracefully
        res_sort = await client.get(
            url,
            params={"sort_by": "unrecognized_column_xyz", "sort_order": "sideways"},
            headers=headers,
        )
        assert res_sort.status_code == 200
        assert "data" in res_sort.json()

        # 3. Whitespace-only search returns full resource list
        res_all = await client.get(url, headers=headers)
        total_all = res_all.json()["total"]

        for ws in ["   ", "\t\t", "\n"]:
            res_ws = await client.get(url, params={"search": ws}, headers=headers)
            assert res_ws.status_code == 200
            assert res_ws.json()["total"] == total_all

        # 4. SQL wildcards and injections resilience
        for sql_term in ["%", "_", "' OR '1'='1", "\\0", "UNION SELECT"]:
            res_sql = await client.get(url, params={"search": sql_term}, headers=headers)
            assert res_sql.status_code == 200

        # 5. Unicode and emoji search resilience
        res_uni = await client.get(url, params={"search": "🌾 Cacao Tool 🍫"}, headers=headers)
        assert res_uni.status_code == 200

    @pytest.mark.asyncio
    async def test_glossary_extreme_and_invalid_query_parameters(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """Malformed glossary enums return 422, single letters and wildcards handled cleanly."""
        user = get_or_create_test_user(session, "glossary_deep_user@test.org")
        headers = {"Authorization": f"Bearer {create_access_token(data={'email': user.email})}"}
        url = app.url_path_for("academy:get_glossary")

        # 1. Invalid enum query params return 422
        for invalid_type in ["SUPER_TERM", "INVALID", "999"]:
            res = await client.get(url, params={"term_type": invalid_type}, headers=headers)
            assert res.status_code == 422, f"Expected 422 for term_type={invalid_type}"

        # 2. Unknown sort_by and sort_order fall back gracefully
        res_sort = await client.get(
            url,
            params={"sort_by": "unknown_field", "sort_order": "inverted"},
            headers=headers,
        )
        assert res_sort.status_code == 200
        assert "data" in res_sort.json()

        # 3. Numeric and single-character search
        for char_term in ["A", "z", "ñ", "1", "0"]:
            res_char = await client.get(url, params={"search": char_term}, headers=headers)
            assert res_char.status_code == 200

        # 4. Whitespace-only search returns full glossary
        res_all = await client.get(url, headers=headers)
        total_all = res_all.json()["total"]

        for ws in ["   ", "\t", " \n "]:
            res_ws = await client.get(url, params={"search": ws}, headers=headers)
            assert res_ws.status_code == 200
            assert res_ws.json()["total"] == total_all

        # 5. Unicode and emoji
        res_uni = await client.get(url, params={"search": "🌾 Living Income 🍫"}, headers=headers)
        assert res_uni.status_code == 200

    def test_direct_crud_resources_long_url_and_special_characters(
        self, session: Session
    ):
        """Resource with 500-char URL, special query parameters, and unicode name persists and retrieves."""
        long_url = "https://example.org/files/guidance/" + ("subpath/" * 20) + "doc.pdf?token=xyz123&ver=2.0#frag"
        assert len(long_url) <= 500

        custom_res = AcademyResource(
            name="Guía Técnica: Brecha de Ingreso Vital — 2026 🌾",
            resource_type=AcademyResourceType.Guidance,
            file_url=long_url,
        )
        session.add(custom_res)
        session.commit()
        session.refresh(custom_res)

        try:
            lookup = crud_resource.get_academy_resources(
                session=session,
                search="Brecha de Ingreso Vital",
            )
            assert lookup.total >= 1
            found = next((r for r in lookup.data if r.id == custom_res.id), None)
            assert found is not None
            assert found.name == "Guía Técnica: Brecha de Ingreso Vital — 2026 🌾"
            assert found.url == long_url
            assert found.type == AcademyResourceType.Guidance
        finally:
            session.delete(custom_res)
            session.commit()

    def test_direct_crud_glossary_multiline_html_and_markdown(
        self, session: Session
    ):
        """Glossary term with multi-paragraph definition, HTML, and punctuation stores cleanly."""
        multiline_def = (
            "<p>First paragraph explaining the living income benchmark.</p>\n"
            "<p>Second paragraph detailing cost of basic decent living including:</p>\n"
            "<ul><li>Food</li><li>Housing</li><li>Education</li><li>Healthcare</li></ul>"
        )
        custom_term = AcademyGlossaryTerm(
            name="Living Income Benchmark (Multi-line) 📊",
            term_type=AcademyGlossaryTermType.Core,
            definition=multiline_def,
        )
        session.add(custom_term)
        session.commit()
        session.refresh(custom_term)

        try:
            lookup = crud_resource.get_academy_glossary(
                session=session,
                search="Healthcare",
            )
            assert lookup.total >= 1
            found = next((g for g in lookup.data if g.id == custom_term.id), None)
            assert found is not None
            assert found.term == "Living Income Benchmark (Multi-line) 📊"
            assert found.type == AcademyGlossaryTermType.Core
            assert "Healthcare" in found.definition
        finally:
            session.delete(custom_term)
            session.commit()

    def test_empty_table_isolated_crud_operations(
        self, session: Session
    ):
        """Search query matching no records cleanly returns total=0 and empty data list."""
        empty_res = crud_resource.get_academy_resources(
            session=session,
            search="absolutely_non_existent_token_xyz_99999",
        )
        assert empty_res.total == 0
        assert empty_res.data == []

        empty_glossary = crud_resource.get_academy_glossary(
            session=session,
            search="absolutely_non_existent_token_xyz_99999",
        )
        assert empty_glossary.total == 0
        assert empty_glossary.data == []

    @pytest.mark.asyncio
    async def test_resource_and_glossary_reject_expired_jwt(
        self, app: FastAPI, client: AsyncClient
    ):
        """Expired JWT token returns 401 on resources and glossary endpoints."""
        expired_token = jwt.encode(
            {
                "email": "resource_learner@test.org",
                "exp": datetime.utcnow() - timedelta(hours=2),
            },
            SECRET_KEY,
            algorithm=ALGORITHM,
        )
        headers = {"Authorization": f"Bearer {expired_token}"}

        res_r = await client.get(app.url_path_for("academy:get_resources"), headers=headers)
        assert res_r.status_code in (401, 403)

        res_g = await client.get(app.url_path_for("academy:get_glossary"), headers=headers)
        assert res_g.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_resource_and_glossary_reject_tampered_jwt(
        self, app: FastAPI, client: AsyncClient
    ):
        """Tampered JWT signature returns 401 on resources and glossary endpoints."""
        tampered_token = jwt.encode(
            {
                "email": "resource_learner@test.org",
                "exp": datetime.utcnow() + timedelta(hours=2),
            },
            "completely_fake_secret_key_abcdef123456",
            algorithm=ALGORITHM,
        )
        headers = {"Authorization": f"Bearer {tampered_token}"}

        res_r = await client.get(app.url_path_for("academy:get_resources"), headers=headers)
        assert res_r.status_code in (401, 403)

        res_g = await client.get(app.url_path_for("academy:get_glossary"), headers=headers)
        assert res_g.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_resource_and_glossary_reject_malformed_auth_headers(
        self, app: FastAPI, client: AsyncClient
    ):
        """Malformed authorization headers return 401/403."""
        malformed = [
            {"Authorization": "Bearer"},
            {"Authorization": "Bearer "},
            {"Authorization": "Basic dGVzdDp0ZXN0"},
            {"Authorization": "Token xyz"},
            {"Authorization": ""},
        ]
        for h in malformed:
            res_r = await client.get(app.url_path_for("academy:get_resources"), headers=h)
            assert res_r.status_code in (401, 403)
            res_g = await client.get(app.url_path_for("academy:get_glossary"), headers=h)
            assert res_g.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_resource_and_glossary_reject_user_not_found_in_db(
        self, app: FastAPI, client: AsyncClient
    ):
        """Valid JWT containing email that does not exist in DB returns 401."""
        ghost_token = create_access_token(data={"email": "ghost_resource_learner@test.org"})
        headers = {"Authorization": f"Bearer {ghost_token}"}

        res_r = await client.get(app.url_path_for("academy:get_resources"), headers=headers)
        assert res_r.status_code in (401, 403)

        res_g = await client.get(app.url_path_for("academy:get_glossary"), headers=headers)
        assert res_g.status_code in (401, 403)
