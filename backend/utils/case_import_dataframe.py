import pandas as pd
from io import BytesIO
from fastapi import HTTPException


def load_data_dataframe_from_bytes(content: bytes) -> pd.DataFrame:
    try:
        xls = pd.ExcelFile(BytesIO(content))
        df = pd.read_excel(xls, sheet_name="data")
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Failed to load data sheet",
        )

    if df.empty:
        raise HTTPException(
            status_code=400,
            detail="Data sheet is empty",
        )

    return df
