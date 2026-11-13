import pytest
from typing import Generator
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import inspect
from models.user import User, UserRole, UserBase, UserUpdateBase, ToolType
from pydantic import ValidationError
from db.crud_user import add_user, update_user


@pytest.fixture
def clean_test_users(session: Session) -> Generator:
    """Fixture that tracks created user IDs and deletes them after the test."""
    created_user_ids = []

    def _register(user_id: int):
        created_user_ids.append(user_id)
        return user_id

    yield _register

    for uid in reversed(created_user_ids):
        u = session.query(User).filter(User.id == uid).first()
        if u:
            session.delete(u)
    session.commit()


class TestUserToolsArray:
    """Test suite for User tools PostgreSQL ARRAY column and backward compatibility."""

    def test_user_model_default_tools(
        self, session: Session, clean_test_users
    ) -> None:
        """User created without explicit tools defaults to ['idc', 'academy']."""
        user = User(
            fullname="Default Tools User",
            email="default_tools@example.com",
            role=UserRole.user,
            organisation=1,
        )
        session.add(user)
        session.commit()
        clean_test_users(user.id)

        session.refresh(user)
        assert user.tools == ["idc", "academy"]
        assert isinstance(user.tools, list)

    def test_user_model_custom_tools_preserved(
        self, session: Session, clean_test_users
    ) -> None:
        """User created with specific tools (e.g. Academy-only or IDC-only) preserves exact list."""
        academy_user = User(
            fullname="Academy Only User",
            email="academy_only@example.com",
            role=UserRole.user,
            organisation=1,
            tools=["academy"],
        )
        session.add(academy_user)
        session.commit()
        clean_test_users(academy_user.id)

        session.refresh(academy_user)
        assert academy_user.tools == ["academy"]

        idc_user = User(
            fullname="IDC Only User",
            email="idc_only@example.com",
            role=UserRole.user,
            organisation=1,
            tools=["idc"],
        )
        session.add(idc_user)
        session.commit()
        clean_test_users(idc_user.id)

        session.refresh(idc_user)
        assert idc_user.tools == ["idc"]

    def test_user_model_empty_array_handling(
        self, session: Session, clean_test_users
    ) -> None:
        """User created with empty tools list preserves empty list without null errors."""
        user = User(
            fullname="Empty Tools User",
            email="empty_tools@example.com",
            role=UserRole.user,
            organisation=1,
            tools=[],
        )
        session.add(user)
        session.commit()
        clean_test_users(user.id)

        session.refresh(user)
        assert user.tools == []
        assert user.serialize["tools"] == []
        assert user.to_user_info["tools"] == []

    def test_dto_serialization_contracts(
        self, session: Session, clean_test_users
    ) -> None:
        """User serializers must expose tools: List[str] in all DTO shapes."""
        user = User(
            fullname="DTO Contract User",
            email="dto_contract@example.com",
            role=UserRole.user,
            organisation=1,
            tools=["idc", "academy"],
        )
        session.add(user)
        session.commit()
        clean_test_users(user.id)
        session.refresh(user)

        # serialize (UserDict)
        user_dict = user.serialize
        assert "tools" in user_dict
        assert user_dict["tools"] == ["idc", "academy"]

        # to_user_info (UserInfo)
        info = user.to_user_info
        assert "tools" in info
        assert info["tools"] == ["idc", "academy"]

        # to_user_detail (UserDetailDict)
        detail = user.to_user_detail
        assert "tools" in detail
        assert detail["tools"] == ["idc", "academy"]

        # to_user_list (UserPageDict)
        page_dict = user.to_user_list
        assert "tools" in page_dict
        assert page_dict["tools"] == ["idc", "academy"]

    def test_crud_add_user_default_and_custom(
        self, session: Session, clean_test_users
    ) -> None:
        """CRUD add_user defaults to ['idc', 'academy'] or respects payload.tools."""
        # Default creation
        payload_default = UserBase(
            fullname="CRUD Default User",
            email="crud_default@example.com",
            organisation=1,
            role=UserRole.user,
        )
        user_default = add_user(session=session, payload=payload_default)
        clean_test_users(user_default.id)
        assert user_default.tools == ["idc", "academy"]

        # Custom tools creation
        payload_custom = UserBase(
            fullname="CRUD Custom User",
            email="crud_custom@example.com",
            organisation=1,
            role=UserRole.user,
            tools=["academy"],
        )
        user_custom = add_user(session=session, payload=payload_custom)
        clean_test_users(user_custom.id)
        assert user_custom.tools == ["academy"]

    def test_crud_update_user_preserves_tools_when_omitted(
        self, session: Session, clean_test_users
    ) -> None:
        """Updating user attributes (e.g. fullname) must NOT overwrite or clear existing tools."""
        user = User(
            fullname="Original Name",
            email="preserve_tools@example.com",
            role=UserRole.user,
            organisation=1,
            tools=["academy"],
        )
        session.add(user)
        session.commit()
        clean_test_users(user.id)

        update_payload = UserUpdateBase(
            fullname="Updated Name",
            tools=None,
        )
        updated = update_user(
            session=session, id=user.id, payload=update_payload
        )
        session.refresh(updated)
        assert updated.fullname == "Updated Name"
        assert updated.tools == ["academy"]

    def test_crud_update_user_modifies_tools_when_provided(
        self, session: Session, clean_test_users
    ) -> None:
        """Updating user with explicit tools changes the tool list (e.g. upgrade flow)."""
        user = User(
            fullname="Learner To Upgrade",
            email="upgrade_tools@example.com",
            role=UserRole.user,
            organisation=1,
            tools=["academy"],
        )
        session.add(user)
        session.commit()
        clean_test_users(user.id)

        upgrade_payload = UserUpdateBase(
            fullname="Learner To Upgrade",
            tools=["idc", "academy"],
        )
        updated = update_user(
            session=session, id=user.id, payload=upgrade_payload
        )
        session.refresh(updated)
        assert updated.tools == ["idc", "academy"]

    def test_postgres_array_operators_and_filtering(
        self, session: Session, clean_test_users
    ) -> None:
        """PostgreSQL array operators (contains, overlap) work correctly for tool filtering."""
        u1 = User(
            fullname="Filter User 1",
            email="filter1@example.com",
            role=UserRole.user,
            organisation=1,
            tools=["idc", "academy"],
        )
        u2 = User(
            fullname="Filter User 2",
            email="filter2@example.com",
            role=UserRole.user,
            organisation=1,
            tools=["academy"],
        )
        u3 = User(
            fullname="Filter User 3",
            email="filter3@example.com",
            role=UserRole.user,
            organisation=1,
            tools=["idc"],
        )
        session.add_all([u1, u2, u3])
        session.commit()
        clean_test_users(u1.id)
        clean_test_users(u2.id)
        clean_test_users(u3.id)

        # Query users with 'idc'
        idc_users = (
            session.query(User)
            .filter(User.tools.contains(["idc"]))
            .filter(User.id.in_([u1.id, u2.id, u3.id]))
            .all()
        )
        idc_ids = {u.id for u in idc_users}
        assert idc_ids == {u1.id, u3.id}

        # Query users with 'academy'
        academy_users = (
            session.query(User)
            .filter(User.tools.contains(["academy"]))
            .filter(User.id.in_([u1.id, u2.id, u3.id]))
            .all()
        )
        academy_ids = {u.id for u in academy_users}
        assert academy_ids == {u1.id, u2.id}

    def test_database_column_metadata_and_backward_compatibility(
        self, session: Session
    ) -> None:
        """Verify column inspection shows tools as ARRAY and existing seeded users have tools."""
        inspector = inspect(session.bind)
        columns = {col["name"]: col for col in inspector.get_columns("user")}
        assert "tools" in columns
        assert isinstance(columns["tools"]["type"], ARRAY)
        assert columns["tools"]["nullable"] is False

        # Verify any existing seeded user has backward-compatible backfilled tools
        existing_user = session.query(User).first()
        if existing_user:
            assert existing_user.tools is not None
            assert len(existing_user.tools) > 0
            assert "idc" in existing_user.tools

    def test_tool_type_enum_attributes_and_string_inheritance(self) -> None:
        """Verify ToolType enum values and str subclassing behavior."""
        assert ToolType.idc == "idc"
        assert ToolType.academy == "academy"
        assert isinstance(ToolType.idc, str)
        assert isinstance(ToolType.academy, str)
        assert set(ToolType.__members__.keys()) == {"idc", "academy"}

    def test_pydantic_schema_tool_type_validation(self) -> None:
        """Verify Pydantic models validate tools using ToolType enum."""
        # Valid tools via enum and string
        valid_user = UserBase(
            fullname="Valid Tool User",
            email="valid_tool@example.com",
            tools=[ToolType.idc, "academy"],
        )
        assert valid_user.tools == [ToolType.idc, ToolType.academy]

        # Valid tools in UserUpdateBase
        valid_update = UserUpdateBase(
            fullname="Valid Update User",
            tools=["academy"],
        )
        assert valid_update.tools == [ToolType.academy]

        # Invalid tool string triggers Pydantic ValidationError
        with pytest.raises(ValidationError):
            UserBase(
                fullname="Invalid Tool User",
                email="invalid_tool@example.com",
                tools=["unknown_tool"],
            )

        with pytest.raises(ValidationError):
            UserUpdateBase(
                fullname="Invalid Tool User",
                tools=["bad_tool"],
            )
