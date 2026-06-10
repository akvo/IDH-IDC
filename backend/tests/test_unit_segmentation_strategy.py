import numpy as np
import pandas as pd
from utils.case_import_processing import generate_numerical_cut_values


class TestSegmentationStrategyUnit:
    def test_unit_generate_numerical_cut_values_closest_observation(self):
        # Repro case from UAT feedback (Case 1)
        # data: 39 farmers at 0.5, 58 farmers at 1.3, 52 farmers at 2.0
        # Total = 149
        data = [0.5] * 39 + [1.3] * 58 + [2.0] * 52
        df = pd.DataFrame({"land": data})

        # NEW behavior (closest_observation)
        cuts = generate_numerical_cut_values(
            df, "land", 4, strategy="equal_frequency"
        )

        # Unique cuts: [0.5, 1.3, 2.0]
        assert len(cuts) > 0
        assert np.array_equal(cuts, [0.5, 1.3, 2.0])

    def test_unit_generate_numerical_cut_values_equal_interval(self):
        data = [0, 10, 20, 30, 40, 100]
        df = pd.DataFrame({"val": data})

        # 4 segments, equal interval
        # min=0, max=100. Range=100. Width=25.
        # Cuts: [25, 50, 75, 100]
        cuts = generate_numerical_cut_values(
            df, "val", 4, strategy="equal_interval"
        )
        assert np.array_equal(np.round(cuts, 2), [25.0, 50.0, 75.0, 100.0])

    def test_unit_quantiles_no_empty_segments(self):
        # This specifically tests the issue where linear interpolation creates
        # a cut inside a gap that has no farmers.

        # Suppose index 111 is 1.3 and 112 is 2.16 (example).
        # Linear: 1.3 + 0.75 * (2.16 - 1.3) = 1.3 + 0.645 = 1.945 -> 1.95.
        # This 1.95 is an artificial threshold. Segment 3 (1.31 to 1.95)
        # will be EMPTY because index 111 is 1.3 and 112 is 2.16.

        # Closest observation will pick either 1.3 or 2.16.
        # If it picks 1.3, it's a duplicate cut, and unique() will merge it.
        # If it picks 2.16, Segment 3 will contain farmer at index 112.

        data = [1.3] * 112 + [2.16] * 37
        df = pd.DataFrame({"land": data})
        cuts = generate_numerical_cut_values(
            df, "land", 4, strategy="equal_frequency"
        )

        # Verification: Segment count calculation
        from utils.case_import_processing import (
            calculate_numerical_segments_from_cuts,
        )

        segs = calculate_numerical_segments_from_cuts(df, "land", cuts)

        # Ensure no segment has 0 farmers
        for s in segs:
            assert (
                s["number_of_farmers"] > 0
            ), f"Segment {s['index']} is empty!"
