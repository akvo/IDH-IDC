export const defaultCaseCommodityValue = {
  commodity: null,
  breakdown: true,
  currency: null,
  area_size_unit: null,
  volume_measurement_unit: null,
  commodity_type: null,
};

export const stepPath = {
  step1: { label: "set-income-target", value: 1 },
  step2: { label: "enter-income-data", value: 2 },
  step3: { label: "understand-income-gap", value: 3 },
  step4: { label: "assess-impact-mitigation-strategies", value: 4 },
  step5: { label: "closing-gap", value: 5 },
};

export { default as CurrentCaseState } from "./current_case";
export { default as CaseUIState } from "./case_ui";
export { default as PrevCaseState } from "./prev_case";
