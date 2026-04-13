import pytest
from pydantic import ValidationError
from models.case import CaseBase
from models.segment import CaseSettingSegmentPayload


def test_case_base_segment_limit():
    # Valid case with 5 segments
    valid_data = {
        "name": "Limit Case",
        "country": 2,
        "focus_commodity": 2,
        "currency": "USD",
        "area_size_unit": "hectare",
        "volume_measurement_unit": "liters",
        "cost_of_production_unit": "Per-area",
        "segmentation": True,
        "multiple_commodities": False,
        "segments": [
            CaseSettingSegmentPayload(
                name=f"Segment {i}", number_of_farmers=10
            )
            for i in range(5)
        ],
    }
    case = CaseBase(**valid_data)
    assert len(case.segments) == 5

    # Invalid case with 6 segments
    invalid_data = valid_data.copy()
    invalid_data["segments"] = [
        CaseSettingSegmentPayload(name=f"Segment {i}", number_of_farmers=10)
        for i in range(6)
    ]

    with pytest.raises(ValidationError) as excinfo:
        CaseBase(**invalid_data)

    errors = excinfo.value.errors()
    print("ERRORS:", errors)
    # In Pydantic V2, the type might be
    # 'list_limit_max' or 'too_long' or similar
    assert any(e["loc"] == ("segments",) for e in errors)
    print("Validation successfully caught 6 segments")


if __name__ == "__main__":
    test_case_base_segment_limit()
