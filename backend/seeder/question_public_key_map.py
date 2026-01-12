from typing import Final

PUBLIC_KEY_MAP: Final[dict[int, str]] = {
    # ======================================================
    # AGGREGATED INCOME
    # ======================================================
    1: "income.total",
    # ======================================================
    # CROP / AQUACULTURE / TIMBER
    # ======================================================
    2: "crop.land",
    3: "crop.volume",
    4: "crop.price",
    5: "crop.cost.total",
    # ---- LAND DETAILS
    6: "crop.land.crop",
    7: "crop.land.aquaculture",
    # ---- VOLUME DETAILS
    8: "crop.volume.yield",
    9: "crop.volume.loss",
    # ---- PRICE DETAILS
    10: "crop.price.farmgate",
    11: "crop.price.premium",
    # ---- COST OF PRODUCTION (CROP / TIMBER)
    12: "crop.cost.labour",
    13: "crop.cost.seeds",
    14: "crop.cost.fertiliser.conventional",
    15: "crop.cost.fertiliser.organic",
    16: "crop.cost.chemicals.conventional",
    17: "crop.cost.chemicals.organic",
    # ---- OTHER COSTS (CROP)
    18: "crop.cost.other.total",
    19: "crop.cost.other.irrigation",
    20: "crop.cost.other.energy",
    21: "crop.cost.other.land",
    22: "crop.cost.other.storage",
    23: "crop.cost.other.marketing",
    24: "crop.cost.other.certification",
    25: "crop.cost.other.capital",
    # ======================================================
    # AQUACULTURE COST OF PRODUCTION
    # ======================================================
    26: "aquaculture.cost.total",
    27: "aquaculture.cost.feed.total",
    28: "aquaculture.cost.feed.fcr",
    29: "aquaculture.cost.feed.price",
    30: "aquaculture.cost.farm_production",
    31: "aquaculture.cost.fingerling",
    32: "aquaculture.cost.labour",
    33: "aquaculture.cost.equipment.short_term",
    34: "aquaculture.cost.equipment.long_term",
    # ======================================================
    # DIVERSIFIED INCOME
    # ======================================================
    35: "diversified.livestock.income",
    36: "diversified.off_farm.income",
    37: "diversified.transfers.income",
    38: "diversified.on_farm.other.income",
    39: "diversified.other.income",
    # ======================================================
    # LIVESTOCK
    # ======================================================
    40: "livestock.animals",
    41: "livestock.volume",
    42: "livestock.price",
    43: "livestock.cost.total",
    44: "livestock.cost.feed.total",
    45: "livestock.cost.feed.fcr",
    46: "livestock.cost.feed.price",
    47: "livestock.cost.farm_production",
    48: "livestock.cost.fingerling",
    49: "livestock.cost.labour",
}
