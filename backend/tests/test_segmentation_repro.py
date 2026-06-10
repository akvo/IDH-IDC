import numpy as np
import pandas as pd
from utils.case_import_processing import calculate_numerical_segments_from_cuts


def test_segmentation_floating_point_boundary():
    # Issue: Data has 1.95 + epsilon, but cut is 1.95.
    # Expectation: 1.95+epsilon should be included in
    # the 1.95 bucket if it's "close enough"
    # or if we round data before bucketing.

    epsilon = 2.3e-16  # approximate value from debug output
    val = 1.95 + epsilon

    # Verify that val is strictly greater than 1.95
    assert val > 1.95

    df = pd.DataFrame({"land": [val]})
    cuts = np.array([1.95])

    segments = calculate_numerical_segments_from_cuts(df, "land", cuts)

    # We expect 1 segment with 1 farmer.
    # Currently, because val > 1.95, digtize returns index
    # 1 (buckets are 0-based index from cuts?)
    # cuts=[1.95].
    # bins[0] = 1.95.
    # digitize returns i such that bins[i-1] < x <= bins[i].
    # If x > bins[-1], returns len(bins).
    # Here len(cuts)=1. Returns 1.

    # If returns 1, it means it's beyond the last cut.
    # segments loop iterates zip(cuts, counts).
    # If counts has length 2 (index 0 and 1), and cuts has length 1.
    # zip stops after 1 iteration.
    # So index 1 count is IGNORED.

    # We want the count to be in index 0.
    # So we want digitize to return 0.
    # i=0 means x <= bins[0].

    assert len(segments) == 1
    assert segments[0]["number_of_farmers"] == 1
