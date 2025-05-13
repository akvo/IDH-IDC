export const adminRole = ["super_admin", "admin"];
// export const nonAdminRole = ["editor", "viewer", "user"];
export const nonAdminRole = ["user"];
export const allUserRole = [...adminRole, ...nonAdminRole];
export const businessUnitRole = ["admin", "member"];
export const casePermission = ["edit", "view"];
export const businessUnitRequiredForRole = ["admin", "editor", "viewer"];

export const disableLandUnitFieldForCommodityTypes = ["livestock"];
export const disableIncomeDriversFieldForCommodityTypes = ["timber"];
export const excludeCommodityTypesFromPrimaryCrop = ["livestock", "timber"];

export const areaUnitOptions = [
  {
    label: "Hectares",
    value: "hectares",
  },
  {
    label: "Acres",
    value: "acres",
  },
  {
    label: "Cubic Metres",
    value: "cubic-metres",
  },
  {
    label: "Cubic Feet",
    value: "cubic-feet",
  },
  {
    label: "Cubic Yards",
    value: "cubic-yards",
  },
  {
    label: "Square Feet",
    value: "square-feet",
  },
  {
    label: "Square Meter",
    value: "square-meter",
  },
];

export const volumeUnitOptions = [
  {
    label: "Kilograms",
    value: "kilograms",
  },
  {
    label: "Grams",
    value: "grams",
  },
  {
    label: "Litres",
    value: "litres",
  },
  {
    label: "Kilolitres",
    value: "kilolitres",
  },
  {
    label: "Barrels",
    value: "barrels",
  },
  {
    label: "Bags",
    value: "bags",
  },
  {
    label: "Tons",
    value: "tons",
  },
];

const commodityCategories = window.master?.commodity_categories || [];
export const commodities = commodityCategories
  ? commodityCategories.reduce(
      (acc, category) => [
        ...acc,
        ...category.commodities.map((c) => ({
          ...c,
          category: category.name.toLowerCase(),
        })),
      ],
      []
    )
  : [];

// create focus/primary commodities filtered by excludeCommodityTypesFromPrimaryCrop
export const focusCommodityOptions = commodities
  .filter(
    (c) =>
      !excludeCommodityTypesFromPrimaryCrop.includes(c.category.toLowerCase())
  )
  .map((commodity) => ({
    label: commodity.name,
    value: commodity.id,
  }));

export const commodityOptions = commodities.map((commodity) => ({
  label: commodity.name,
  value: commodity.id,
}));

export const currencyOptions = window.master?.currencies || [];
export const countryOptions = window.master?.countries || [];

export const yesNoOptions = [
  {
    label: "Yes",
    value: 1,
  },
  {
    label: "No",
    value: 0,
  },
];

export const tagOptions = [
  {
    label: "Smallholder",
    value: "smallholder",
  },
  {
    label: "Large Scale",
    value: "large-scale",
  },
  {
    label: "Plantation",
    value: "plantation",
  },
  {
    label: "Processing",
    value: "processing",
  },
  {
    label: "Trading",
    value: "trading",
  },
  {
    label: "Retail",
    value: "retail",
  },
  {
    label: "Other",
    value: "other",
  },
];

export const reportingPeriod = [
  {
    label: "Per Season",
    value: "per-season",
  },
  {
    label: "Per Year",
    value: "per-year",
  },
];

export const diversifiedIncomeTooltipText =
  "The majority of farmer households also earn an income from other sources than the primary commodity. This can be income from other crops, livestock, income earned from off-farm labour or non-farm non labour sources (e.g. remittances, government transfers).";

export const CaseStatusEnum = {
  COMPLETED: 1,
  INCOMPLETED: 0,
};

export const caseStepItems = [
  {
    title: "Set an income target",
    description: "Use a living income benchmark or define the target yourself.",
  },
  {
    title: "Enter your income data",
    description:
      "Enter current and feasible data for the five income drivers and its subcomponents for each segment",
  },
  {
    title: "Understand the income gap",
    description:
      "Explore the current income situation and the gap to reach your income target.",
  },
  {
    title: "Assess impact of mitigation strategies",
    description:
      "Analyse which drivers impact income increase the most, and how to close the gap.",
  },
  {
    title: "Closing the gap",
    description:
      "Create scenarios and visualize their effectiveness to close the gap.",
  },
];

// update value "incomedrivercalculator.idhtrade.org" or "localhost"
export const PROD_HOST = "incomedrivercalculator.idhtrade.org";

// TODO:: update to new-case step link (/cases)
// handled by hostname to enable new case step in dev mode
// update value "/old-cases" or "/cases"
export const LINK_TO_CASE_PROD = "/cases";
