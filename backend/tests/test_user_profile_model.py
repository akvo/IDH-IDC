from datetime import datetime
import pytest
from pydantic import ValidationError
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy import Integer, String, DateTime
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.organisation import Organisation
from models.region import Region
from models.user import User, UserRole
from models.user_profile import (
    UserProfile,
    UserProfileBase,
    UserProfileCreate,
    UserProfileUpdate,
    UserProfileResponse,
    UserProfileDict,
)


class TestUserProfileModelDefinition:
    def test_table_name_and_columns(self):
        assert UserProfile.__tablename__ == "user_profile"

        # Check primary key
        id_col = UserProfile.__table__.c.id
        assert isinstance(id_col.type, Integer)
        assert id_col.primary_key is True

        # Check user_id FK and unique
        user_id_col = UserProfile.__table__.c.user_id
        assert isinstance(user_id_col.type, Integer)
        assert user_id_col.nullable is False
        assert user_id_col.unique is True
        fk_targets = [fk.target_fullname for fk in user_id_col.foreign_keys]
        assert "user.id" in fk_targets

        # Check region_id FK
        region_id_col = UserProfile.__table__.c.region_id
        assert isinstance(region_id_col.type, Integer)
        assert region_id_col.nullable is True
        region_fk_targets = [
            fk.target_fullname for fk in region_id_col.foreign_keys
        ]
        assert "region.id" in region_fk_targets

        # Check commodities is JSONB
        commodities_col = UserProfile.__table__.c.commodities
        assert isinstance(commodities_col.type, pg.JSONB)
        assert commodities_col.nullable is False

        # Check string columns
        assert isinstance(UserProfile.__table__.c.first_name.type, String)
        assert UserProfile.__table__.c.first_name.type.length == 125
        assert isinstance(UserProfile.__table__.c.last_name.type, String)
        assert UserProfile.__table__.c.last_name.type.length == 125
        assert isinstance(UserProfile.__table__.c.company_name.type, String)
        assert UserProfile.__table__.c.company_name.type.length == 255
        assert isinstance(UserProfile.__table__.c.company_type.type, String)
        assert UserProfile.__table__.c.company_type.type.length == 100
        assert isinstance(UserProfile.__table__.c.sector.type, String)
        assert UserProfile.__table__.c.sector.type.length == 100
        assert isinstance(UserProfile.__table__.c.region_name.type, String)
        assert UserProfile.__table__.c.region_name.type.length == 125

        # Check timestamps
        assert isinstance(UserProfile.__table__.c.created_at.type, DateTime)
        assert isinstance(UserProfile.__table__.c.updated_at.type, DateTime)

    def test_instantiation_and_to_dict(self):
        profile = UserProfile(
            user_id=1,
            first_name="Kole",
            last_name="Jain",
            company_name="Unicef",
            company_type="NGO",
            sector="Agriculture",
            region_id=4,
            region_name="West-Africa",
            commodities=["Cocoa", "Coffee"],
        )

        assert profile.user_id == 1
        assert profile.first_name == "Kole"
        assert profile.last_name == "Jain"
        assert profile.company_name == "Unicef"
        assert profile.commodities == ["Cocoa", "Coffee"]

        d = profile.to_dict()
        assert d["user_id"] == 1
        assert d["first_name"] == "Kole"
        assert d["last_name"] == "Jain"
        assert d["company_name"] == "Unicef"
        assert d["company_type"] == "NGO"
        assert d["sector"] == "Agriculture"
        assert d["region_id"] == 4
        assert d["region_name"] == "West-Africa"
        assert d["commodities"] == ["Cocoa", "Coffee"]

        # Validate typed dict
        typed_d: UserProfileDict = d
        assert typed_d["first_name"] == "Kole"


class TestUserProfileSchemas:
    def test_user_profile_base_defaults(self):
        data = UserProfileBase()
        assert data.first_name is None
        assert data.commodities == []

    def test_user_profile_create_validation(self):
        # user_id is required for create
        create_data = UserProfileCreate(
            user_id=42,
            first_name="Jane",
            last_name="Doe",
            commodities=["Cocoa"],
        )
        assert create_data.user_id == 42
        assert create_data.first_name == "Jane"
        assert create_data.commodities == ["Cocoa"]

        with pytest.raises(ValidationError):
            UserProfileCreate(first_name="Missing UserId")

    def test_user_profile_update_validation(self):
        update_data = UserProfileUpdate(
            first_name="UpdatedName",
            commodities=["Palm Oil", "Rubber"],
        )
        assert update_data.first_name == "UpdatedName"
        assert update_data.last_name is None
        assert update_data.commodities == ["Palm Oil", "Rubber"]

    def test_user_profile_response(self):
        now = datetime.now()
        response = UserProfileResponse(
            id=1,
            user_id=10,
            first_name="Alex",
            last_name="Smith",
            company_name="IDH",
            company_type="Foundation",
            sector="Sustainability",
            region_id=2,
            region_name="East-Africa",
            commodities=["Tea"],
            created_at=now,
            updated_at=now,
        )
        assert response.id == 1
        assert response.user_id == 10
        assert response.commodities == ["Tea"]


class TestExistingUserRegression:
    """
    Test suite preventing regressions for existing registered users
    when introducing the UserProfile entity.
    """

    def test_existing_user_has_none_profile_by_default(self):
        user = User(
            id=10,
            organisation=1,
            email="registered_user@example.com",
            fullname="Registered User",
            role=UserRole.user,
        )
        assert user.profile is None
        assert user.email == "registered_user@example.com"
        assert user.fullname == "Registered User"
        assert user.role == UserRole.user

    def test_retroactive_profile_attachment_to_registered_user(self):
        user = User(
            id=11,
            organisation=1,
            email="current_user@example.com",
            fullname="Current User",
            role=UserRole.admin,
        )
        assert user.profile is None

        profile = UserProfile(
            user_id=user.id,
            first_name="Current",
            last_name="User",
            company_name="Akvo",
            company_type="NGO",
            sector="Technology",
            commodities=["Cocoa"],
        )
        user.profile = profile

        assert user.profile is not None
        assert user.profile.user_id == 11
        assert user.profile.first_name == "Current"
        assert user.profile.commodities == ["Cocoa"]
        assert user.email == "current_user@example.com"
        assert user.role == UserRole.admin

    def test_blank_profile_defaults_for_uncompleted_registered_user(self):
        profile = UserProfile(user_id=12)
        assert profile.user_id == 12
        assert profile.first_name is None
        assert profile.last_name is None
        assert profile.company_name is None
        assert profile.company_type is None
        assert profile.sector is None
        assert profile.region_id is None
        assert profile.region_name is None
        assert profile.commodities == []

        d = profile.to_dict()
        assert d["user_id"] == 12
        assert d["first_name"] is None
        assert d["commodities"] == []

    def test_profile_field_mutations_do_not_corrupt_registered_user(self):
        user = User(
            id=13,
            organisation=2,
            email="secure_user@example.com",
            fullname="Secure User",
            role=UserRole.editor,
        )
        profile = UserProfile(user_id=user.id)
        user.profile = profile

        user.profile.company_name = "New Corporation"
        user.profile.commodities = ["Coffee", "Tea"]
        user.profile.sector = "Beverages"

        assert user.email == "secure_user@example.com"
        assert user.fullname == "Secure User"
        assert user.role == UserRole.editor
        assert user.organisation == 2

    def test_profile_detachment_leaves_registered_user_intact(self):
        user = User(
            id=14,
            organisation=1,
            email="persist_user@example.com",
            fullname="Persistent User",
            role=UserRole.user,
        )
        profile = UserProfile(user_id=user.id, first_name="Temp")
        user.profile = profile
        assert user.profile is not None

        user.profile = None
        assert user.profile is None
        assert user.email == "persist_user@example.com"
        assert user.id == 14

    def test_user_id_uniqueness_prevents_duplicate_profiles(self):
        user_id_col = UserProfile.__table__.c.user_id
        assert user_id_col.unique is True

    def test_pydantic_schema_handles_empty_registered_user_profile(self):
        now = datetime.now()
        res = UserProfileResponse(
            id=1,
            user_id=15,
            created_at=now,
            updated_at=now,
        )
        assert res.user_id == 15
        assert res.first_name is None
        assert res.last_name is None
        assert res.commodities == []

    def test_pydantic_partial_update_preserves_unspecified_fields(self):
        update = UserProfileUpdate(commodities=["Rice", "Soy"])
        dump = update.model_dump(exclude_unset=True)
        assert dump == {"commodities": ["Rice", "Soy"]}
        assert "first_name" not in dump
        assert "company_name" not in dump

    def test_pydantic_schema_string_length_bounds(self):
        with pytest.raises(ValidationError):
            UserProfileUpdate(first_name="A" * 126)

        with pytest.raises(ValidationError):
            UserProfileUpdate(last_name="B" * 126)

        with pytest.raises(ValidationError):
            UserProfileUpdate(company_name="C" * 256)

        with pytest.raises(ValidationError):
            UserProfileUpdate(company_type="D" * 101)

        with pytest.raises(ValidationError):
            UserProfileUpdate(sector="E" * 101)

        with pytest.raises(ValidationError):
            UserProfileUpdate(region_name="F" * 126)

        # Valid lengths should succeed
        valid_update = UserProfileUpdate(
            first_name="A" * 125,
            last_name="B" * 125,
            company_name="C" * 255,
            company_type="D" * 100,
            sector="E" * 100,
            region_name="F" * 125,
        )
        assert len(valid_update.first_name) == 125


class TestUserProfileLiveDatabaseIntegrity:
    """Validate database constraints (unique, foreign key cascade, set null) and Pydantic boundaries."""

    def test_user_profile_user_id_unique_constraint_enforced_by_db(
        self, session: Session
    ):
        """Database enforces 1:1 unique constraint on user_id in user_profile."""
        org = session.query(Organisation).first()
        if not org:
            org = Organisation(id=None, name="Profile Constraint Org")
            session.add(org)
            session.commit()
            session.refresh(org)

        user = User(
            organisation=org.id,
            fullname="OneToOne User",
            email="onetoone_user@test.org",
            password="pw",
            role=UserRole.user,
            is_active=1,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        p1 = UserProfile(user_id=user.id, first_name="First")
        session.add(p1)
        session.commit()

        # Duplicate profile for same user_id must violate unique constraint
        p_dup = UserProfile(user_id=user.id, first_name="Duplicate")
        session.add(p_dup)
        with pytest.raises(IntegrityError):
            session.commit()
        session.rollback()

        session.delete(user)
        session.commit()

    def test_user_profile_cascade_delete_on_user(
        self, session: Session
    ):
        """Deleting User cascades to delete corresponding UserProfile record."""
        org = session.query(Organisation).first()
        if not org:
            org = Organisation(id=None, name="Cascade Org")
            session.add(org)
            session.commit()
            session.refresh(org)

        user = User(
            organisation=org.id,
            fullname="Cascade User",
            email="cascade_profile_user@test.org",
            password="pw",
            role=UserRole.user,
            is_active=1,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        profile = UserProfile(user_id=user.id, first_name="CascadeTarget")
        session.add(profile)
        session.commit()
        session.refresh(profile)

        profile_id = profile.id
        session.delete(user)
        session.commit()

        orphaned = session.query(UserProfile).filter_by(id=profile_id).first()
        assert orphaned is None

    def test_user_profile_set_null_on_region(
        self, session: Session
    ):
        """Deleting Region sets region_id to NULL on UserProfile while preserving profile."""
        org = session.query(Organisation).first()
        if not org:
            org = Organisation(id=None, name="Set Null Org")
            session.add(org)
            session.commit()
            session.refresh(org)

        user = User(
            organisation=org.id,
            fullname="Region Cascade User",
            email="region_cascade_user@test.org",
            password="pw",
            role=UserRole.user,
            is_active=1,
        )
        from sqlalchemy import func
        max_region_id = session.query(func.max(Region.id)).scalar() or 0
        region = Region(id=max_region_id + 500, name="Temporary Region For Cascade")
        session.add_all([user, region])
        session.commit()
        session.refresh(user)
        session.refresh(region)

        profile = UserProfile(
            user_id=user.id,
            region_id=region.id,
            region_name=region.name,
        )
        session.add(profile)
        session.commit()
        session.refresh(profile)

        # Delete region
        session.delete(region)
        session.commit()

        session.refresh(profile)
        assert profile.region_id is None
        assert profile.region_name == "Temporary Region For Cascade"

        session.delete(user)
        session.commit()

    def test_user_profile_unicode_and_emojis_in_fields(
        self, session: Session
    ):
        """UserProfile stores multi-byte Unicode and emojis across fields safely."""
        org = session.query(Organisation).first()
        if not org:
            org = Organisation(id=None, name="Unicode Org")
            session.add(org)
            session.commit()
            session.refresh(org)

        user = User(
            organisation=org.id,
            fullname="María José 🌾",
            email="unicode_profile_user@test.org",
            password="pw",
            role=UserRole.user,
            is_active=1,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        profile = UserProfile(
            user_id=user.id,
            first_name="María José 🌾",
            last_name="García Márquez",
            company_name="Cooperativa Cacao Fino & Aroma 🍫",
            company_type="Cooperativa",
            sector="Agricultura Sostenible",
            commodities=["Cacao Criollo (Perú) 🍫", "Café Geisha ☕"],
        )
        session.add(profile)
        session.commit()
        session.refresh(profile)

        assert profile.first_name == "María José 🌾"
        assert profile.last_name == "García Márquez"
        assert profile.company_name == "Cooperativa Cacao Fino & Aroma 🍫"
        assert profile.commodities == ["Cacao Criollo (Perú) 🍫", "Café Geisha ☕"]

        session.delete(user)
        session.commit()

    def test_pydantic_create_schema_boundary_values(self):
        """UserProfileCreate enforces length limits on all string fields."""
        with pytest.raises(ValidationError):
            UserProfileCreate(user_id=1, first_name="A" * 126)

        with pytest.raises(ValidationError):
            UserProfileCreate(user_id=1, last_name="A" * 126)

        with pytest.raises(ValidationError):
            UserProfileCreate(user_id=1, company_name="A" * 256)

        with pytest.raises(ValidationError):
            UserProfileCreate(user_id=1, company_type="A" * 101)

        with pytest.raises(ValidationError):
            UserProfileCreate(user_id=1, sector="A" * 101)

        with pytest.raises(ValidationError):
            UserProfileCreate(user_id=1, region_name="A" * 126)

        # Valid create with commodities
        valid_create = UserProfileCreate(
            user_id=999,
            first_name="María",
            commodities=["Cocoa", "Coffee"],
        )
        assert valid_create.user_id == 999
        assert valid_create.commodities == ["Cocoa", "Coffee"]
