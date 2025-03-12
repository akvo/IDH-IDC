export const LIMIT_RESULT = 15;

export const PROCUREMENT_PROCESS_COLORS = [
  "#FFC0CB", // pink
  "#FF0000", // red
  "#FFFF00", // yellow
  "#FFA500", // orange
  "#00FFFF", // cyan
  "#008000", // green
  "#0000FF", // blue
  "#800080", // purple
  "#1C39BB", // geekblue
  "#FF00FF", // magenta
  "#FF4500", // volcano
  "#FFD700", // gold
  "#00FF00", // lime
  "#556B2F", // dark olive green
  "#8B008B", // dark magenta
  "#483D8B", // dark slate blue
  "#2E8B57", // sea green
  "#4B0082", // indigo
  "#191970", // midnight blue
  "#000080", // navy
  "#808000", // olive
  "#800000", // maroon
  "#008080", // teal
];

export const PROCUREMENT_IMPACT_AREAS = {
  income: "income_impact",
  env: "environmental_impact",
};

export const PROCUREMENT_TABS = [
  {
    key: "farmer_rationale",
    label: "Farmer Rationale",
  },
  {
    key: "business_rationale",
    label: "Business Rationale",
  },
  {
    key: "enabling_conditions",
    label: "Enabling Conditions",
  },
  {
    key: "risks_n_trade_offs",
    label: "Risks and Trade-offs",
  },
  {
    key: "source_or_evidence",
    label: "Source or Evidence",
  },
];

export const PROCUREMENT_SCALE = [
  {
    key: "implementation_time",
    label: "Implementation Time",
    reversed: true,
  },
  {
    key: "implementation_cost_/_effort",
    label: "Implementation Cost / Effort",
    reversed: true,
  },
  {
    key: "income_impact",
    label: "Income Impact",
    reversed: false,
  },
  {
    key: "environmental_impact",
    label: "Environmental Impact",
    reversed: false,
  },
];

export const PROCUREMENT_COLOR_SCALE = [
  "#FF010E",
  "#FF8754",
  "#FEC508",
  "#ABEA53",
  "#48D985",
];
