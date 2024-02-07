export const driverOptions = [
  {
    label: "Land",
    value: "area",
  },
  {
    label: "Volume",
    value: "volume",
  },
  {
    label: "Price",
    value: "price",
  },
  {
    label: "Cost of Production",
    value: "cost_of_production",
  },
  {
    label: "Diversified Income",
    value: "diversified_income",
  },
];

const sources = [
  "Farmfit",
  "Desk research",
  "IDH internal",
  "SDM Data",
  "FAO",
  "Other",
];
export const sourceOptions = sources.map((x) => ({ label: x, value: x }));

export { default as ExploreStudiesPage } from "./ExploreStudiesPage";
