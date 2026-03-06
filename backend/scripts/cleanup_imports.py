import sys
import os
from datetime import datetime

# Add the parent directory to sys.path to allow importing from models and db
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.connection import SessionLocal  # noqa: E402
from models.case_import import CaseImport  # noqa: E402
from utils.case_import_storage import delete_import_file  # noqa: E402


def cleanup_expired_imports():
    """
    Manually clean up expired case_import records and their associated files.
    Only deletes imports that are NOT associated with any case.
    """
    session = SessionLocal()
    now = datetime.utcnow()

    # Filter for expired imports that aren't linked to a case
    expired_imports = (
        session.query(CaseImport)
        .filter(CaseImport.expires_at < now, CaseImport.case_id.is_(None))
        .all()
    )

    if not expired_imports:
        print("No expired orphaned imports found.")
        session.close()
        return

    msg = f"Found {len(expired_imports)} expired orphaned imports. Starting..."
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
    session.close()
    print(f"Cleanup complete. Deleted {deleted_count} records.")


if __name__ == "__main__":
    cleanup_expired_imports()
