import pytest
import pandas as pd
from sqlalchemy.orm import Session

from models.academy import (
    AcademyTag,
    AcademyResource,
    AcademyResourceType,
    AcademyGlossaryTerm,
    AcademyGlossaryTermType,
    AcademyModule,
    AcademyChapter,
    AcademyTagRelation,
    AcademyUserChapterProgress,
    AcademyChapterProgressStatus,
)
from models.organisation import Organisation
from models.user import User, UserRole
from seeder.academy import (
    seed_academy,
    sync_table_sequence,
    load_csv,
    run,
    DEFAULT_TAGS,
    DEFAULT_MODULES,
    DEFAULT_CHAPTERS,
    DEFAULT_TAG_RELATIONS,
    DEFAULT_RESOURCES,
    DEFAULT_GLOSSARY_TERMS,
)


@pytest.fixture(autouse=True)
def cleanup_test_session(session: Session):
    yield
    session.rollback()
    session.close()


class TestAcademySeederExecution:
    def test_seeder_execution_and_row_counts(self, session: Session):
        """Verify seeder runs and produces expected row counts."""
        seed_academy(session=session)

        # 1. 6 Modules matching the 6 IDH Roadmap steps
        modules = (
            session.query(AcademyModule)
            .order_by(AcademyModule.order_index)
            .all()
        )
        assert len(modules) == 6
        assert [m.order_index for m in modules] == [1, 2, 3, 4, 5, 6]

        # 2. 27 Chapters
        chapters = (
            session.query(AcademyChapter)
            .order_by(AcademyChapter.id)
            .all()
        )
        assert len(chapters) == 27

        # Verify module chapter breakdown
        m1_chapters = [c for c in chapters if c.module_id == 1]
        m2_chapters = [c for c in chapters if c.module_id == 2]
        m3_chapters = [c for c in chapters if c.module_id == 3]
        m4_chapters = [c for c in chapters if c.module_id == 4]
        m5_chapters = [c for c in chapters if c.module_id == 5]
        m6_chapters = [c for c in chapters if c.module_id == 6]

        assert len(m1_chapters) == 4
        assert len(m2_chapters) == 5
        assert len(m3_chapters) == 4
        assert len(m4_chapters) == 6
        assert len(m5_chapters) == 4
        assert len(m6_chapters) == 4

        # 3. 10 Catalog Tags
        tags = session.query(AcademyTag).order_by(AcademyTag.id).all()
        assert len(tags) == 10
        expected_slugs = [
            "income-measurement",
            "income-gap",
            "benchmark",
            "due-diligence",
            "gender",
            "procurement",
            "responsible-pricing",
            "diversification",
            "farmer-segmentation",
            "climate-resilience",
        ]
        assert [t.slug for t in tags] == expected_slugs

        # 4. 35 Tag Relations (14 modules + 21 chapters)
        relations = session.query(AcademyTagRelation).all()
        assert len(relations) == 35

        module_relations = [r for r in relations if r.module_id is not None]
        chapter_relations = [r for r in relations if r.chapter_id is not None]
        assert len(module_relations) == 14
        assert len(chapter_relations) == 21

        # 5. 9 Technical Resources
        resources = session.query(AcademyResource).all()
        assert len(resources) == 9
        resource_types = {r.resource_type for r in resources}
        assert AcademyResourceType.Guidance in resource_types
        assert AcademyResourceType.Tool in resource_types
        assert AcademyResourceType.Organisation in resource_types
        assert AcademyResourceType.Template in resource_types

        # 6. 13 Glossary Terms
        terms = session.query(AcademyGlossaryTerm).all()
        assert len(terms) == 13
        term_types = {t.term_type for t in terms}
        assert AcademyGlossaryTermType.Core in term_types
        assert AcademyGlossaryTermType.Finance in term_types
        assert AcademyGlossaryTermType.Additional in term_types

    def test_seeder_idempotency(self, session: Session):
        """Running the seeder multiple times must produce identical state."""
        # First run
        seed_academy(session=session)
        assert session.query(AcademyModule).count() == 6
        assert session.query(AcademyChapter).count() == 27
        assert session.query(AcademyTag).count() == 10
        assert session.query(AcademyTagRelation).count() == 35
        assert session.query(AcademyResource).count() == 9
        assert session.query(AcademyGlossaryTerm).count() == 13

        # Second run (idempotency check)
        seed_academy(session=session)
        assert session.query(AcademyModule).count() == 6
        assert session.query(AcademyChapter).count() == 27
        assert session.query(AcademyTag).count() == 10
        assert session.query(AcademyTagRelation).count() == 35
        assert session.query(AcademyResource).count() == 9
        assert session.query(AcademyGlossaryTerm).count() == 13


class TestAcademySeederConstraintsAndIntegrity:
    def test_foreign_key_and_xor_integrity(self, session: Session):
        """Verify FK references and XOR check constraint compliance."""
        seed_academy(session=session)

        # Chapter FK integrity
        chapters = session.query(AcademyChapter).all()
        for ch in chapters:
            assert ch.module is not None
            assert ch.module.id == ch.module_id
            assert ch.chapter_number >= 1

        # Tag relation XOR and FK integrity
        relations = session.query(AcademyTagRelation).all()
        for rel in relations:
            assert rel.tag is not None
            is_module_target = (
                rel.module_id is not None and rel.chapter_id is None
            )
            is_chapter_target = (
                rel.module_id is None and rel.chapter_id is not None
            )
            # Enforce strict XOR
            assert is_module_target ^ is_chapter_target

            if is_module_target:
                assert rel.module is not None
                assert rel.module.id == rel.module_id
            if is_chapter_target:
                assert rel.chapter is not None
                assert rel.chapter.id == rel.chapter_id

    def test_semantic_html_lesson_content(self, session: Session):
        """Verify lesson content adheres to semantic HTML requirements."""
        seed_academy(session=session)

        chapters = session.query(AcademyChapter).all()
        for ch in chapters:
            assert ch.content_html is not None
            assert ch.estimated_minutes > 0
            # Semantic structure checks
            assert "<h2>" in ch.content_html
            assert "</h2>" in ch.content_html
            assert "<p>" in ch.content_html
            assert "</p>" in ch.content_html
            assert "<ul>" in ch.content_html
            assert "</ul>" in ch.content_html
            assert '<div class="callout-box">' in ch.content_html
            assert '<div class="key-takeaways">' in ch.content_html

    def test_registered_user_non_interference(self, session: Session):
        """Verify seeder does not delete existing registered users."""
        # Ensure test user exists
        test_email = "academy_learner_seeder_test@akvo.org"
        existing_user = (
            session.query(User).filter(User.email == test_email).first()
        )
        if not existing_user:
            org = session.query(Organisation).first()
            org_id = org.id if org else 1
            existing_user = User(
                organisation=org_id,
                fullname="Academy Learner",
                email=test_email,
                password="hashed_test_password",
                role=UserRole.user,
            )
            session.add(existing_user)
            session.commit()
            session.refresh(existing_user)

        # Seed academy
        seed_academy(session=session)

        # Re-query user to confirm non-interference
        user_after_seed = (
            session.query(User).filter(User.id == existing_user.id).first()
        )
        assert user_after_seed is not None
        assert user_after_seed.email == test_email

        # Create progress record for this user
        first_chapter = (
            session.query(AcademyChapter)
            .order_by(AcademyChapter.id)
            .first()
        )
        progress = AcademyUserChapterProgress(
            user_id=existing_user.id,
            chapter_id=first_chapter.id,
            status=AcademyChapterProgressStatus.completed,
        )
        session.add(progress)
        session.commit()
        assert session.query(AcademyUserChapterProgress).count() >= 1

        # Running seeder resets curriculum and user progress cleanly
        # while keeping the user account intact
        seed_academy(session=session)
        assert (
            session.query(User).filter(User.id == existing_user.id).first()
            is not None
        )
        assert session.query(AcademyUserChapterProgress).count() == 0

        # Cleanup test user
        session.delete(existing_user)
        session.commit()


class TestAcademySeederFallbackAndStandalone:
    def test_smart_fallback_constants_integrity(self):
        """Verify fallback dataset lengths and structures."""
        assert len(DEFAULT_TAGS) == 10
        assert len(DEFAULT_MODULES) == 6
        assert len(DEFAULT_CHAPTERS) == 27
        assert len(DEFAULT_TAG_RELATIONS) == 35
        assert len(DEFAULT_RESOURCES) == 9
        assert len(DEFAULT_GLOSSARY_TERMS) == 13

    def test_load_csv_when_missing(self):
        """load_csv must return None when file does not exist."""
        result = load_csv("non_existent_academy_file.csv")
        assert result is None

    def test_load_csv_when_present(self, tmp_path, monkeypatch):
        """load_csv must return DataFrame when CSV exists."""
        csv_file = tmp_path / "academy_test.csv"
        csv_file.write_text("id,name\n1,Test\n")

        monkeypatch.setattr("seeder.academy.MASTER_DIR", str(tmp_path))
        df = load_csv("academy_test.csv")
        assert df is not None
        assert isinstance(df, pd.DataFrame)
        assert len(df) == 1
        assert df.iloc[0]["name"] == "Test"

    def test_sync_table_sequence_graceful(self, session: Session):
        """sync_table_sequence handles valid and invalid table names gracefully."""
        sync_table_sequence(session, "academy_module")
        # Non-existent table should not crash
        sync_table_sequence(session, "invalid_non_existent_tbl")

    def test_standalone_run(self, session: Session):
        """Verify standalone run() entry point works cleanly."""
        session.close()
        run()
        assert session.query(AcademyModule).count() == 6
        assert session.query(AcademyChapter).count() == 27
