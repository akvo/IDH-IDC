import os

from fastapi import HTTPException

IMPORT_BASE_DIR = "/tmp/idc_case_imports"


def ensure_import_dir():
    os.makedirs(IMPORT_BASE_DIR, exist_ok=True)


def save_import_file(import_id: str, content: bytes) -> str:
    ensure_import_dir()
    path = os.path.join(IMPORT_BASE_DIR, f"{import_id}.xlsx")

    with open(path, "wb") as f:
        f.write(content)

    return path


def load_import_file(path: str) -> bytes:
    if not os.path.exists(path):
        raise HTTPException(
            status_code=404,
            detail=f"Import file {path} not found or expired",
        )

    with open(path, "rb") as f:
        return f.read()


def delete_import_file(path: str):
    if os.path.exists(path):
        try:
            os.remove(path)
        except Exception as e:
            # Log error but don't fail the request
            print(f"Error deleting file {path}: {e}")
