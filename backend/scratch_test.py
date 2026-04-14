from pydantic import ValidationError
from models.case import CaseBase
from models.segment import CaseSettingSegmentPayload
from models.case_import import GenerateSegmentValuesRequest, SegmentDefinition


def test_validation():
    print("Checking CaseBase validation for 7 segments...")
    try:
        CaseBase(
            name="Test",
            country=1,
            focus_commodity=1,
            currency="USD",
            area_size_unit="ha",
            volume_measurement_unit="l",
            cost_of_production_unit="p",
            segmentation=True,
            multiple_commodities=False,
            segments=[
                CaseSettingSegmentPayload(name=f"S{i}") for i in range(7)
            ],
        )
        print("BUG: CaseBase allowed 7 segments!")
    except ValidationError:
        print("SUCCESS: CaseBase blocked 7 segments.")

    print(
        "\nChecking GenerateSegmentValuesRequest validation for 7 segments..."
    )
    try:
        GenerateSegmentValuesRequest(
            case_id=1,
            import_id="abc",
            segmentation_variable="var",
            segments=[
                SegmentDefinition(name=f"S{i}", value=i) for i in range(7)
            ],
        )
        print("BUG: GenerateSegmentValuesRequest allowed 7 segments!")
    except ValidationError:
        print("SUCCESS: GenerateSegmentValuesRequest blocked 7 segments.")


if __name__ == "__main__":
    test_validation()
