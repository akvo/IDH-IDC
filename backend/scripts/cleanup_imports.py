import sys
import os
from datetime import datetime

# Add the parent directory to sys.path to allow importing from models and db
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.connection import SessionLocal  # noqa: E402
from models.case_import import CaseImport  # noqa: E402
from models.case import Case  # noqa
from models.user import User  # noqa
from utils.case_import_storage import delete_import_file  # noqa: E402


def cleanup_expired_imports(session: SessionLocal = None, force: bool = False):
    """
    Manually clean up expired case_import records and their associated files.
    Only deletes imports that are NOT associated with any case.
    """
    if session is None:
        session = SessionLocal()

    now = datetime.utcnow()
    print(f"Current UTC time: {now}")

    # Query all orphaned imports
    orphaned_imports = (
        session.query(CaseImport).filter(CaseImport.case_id.is_(None)).all()
    )

    if not orphaned_imports:
        print("No orphaned imports found in database.")
        return

    expired_imports = []
    for imp in orphaned_imports:
        is_expired = imp.expires_at and imp.expires_at < now
        if force or is_expired:
            expired_imports.append(imp)
        else:
            time_left = imp.expires_at - now
            print(
                f"Skipping ID {imp.id}: Not yet expired. "
                f"Expires in {time_left}"
            )

    if not expired_imports:
        print("No orphaned imports meet the expiration criteria.")
        return

    msg = f"Found {len(expired_imports)} imports to clean up. Starting..."
    print(msg)

    deleted_count = 0
    for imp in expired_imports:
        try:
            # Delete file
            print(f"Deleting file: {imp.file_path}")
            delete_import_file(imp.file_path)

            # Delete DB record
            session.delete(imp)
            deleted_count += 1
        except Exception as e:
            print(f"Error cleaning up import {imp.id}: {e}")
            session.rollback()

    session.commit()
    print(f"Cleanup complete. Deleted {deleted_count} records.")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Cleanup orphaned cell imports."
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force cleanup of all orphaned imports regardless of expiration",
    )
    args = parser.parse_args()

    cleanup_expired_imports(force=args.force)
