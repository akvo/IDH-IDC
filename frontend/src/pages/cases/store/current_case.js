import { Store } from "pullstate";

const defaultCurrentCaseState = {
  id: null,
  name: null,
  description: null,
  date: null,
  year: null,
  country: null,
  focus_commodity: null,
  currency: null,
  area_size_unit: null,
  volume_measurement_unit: null,
  cost_of_production_unit: "cost_of_production_unit",
  reporting_period: "per-year",
  segmentation: true,
  living_income_study: null,
  multiple_commodities: null,
  segments: [],
  case_commodities: [],
  private: false,
  tags: [],
  company: null,
  created_by: null,
  created_at: null,
  updated_by: null,
  updated_at: null,
};

const CurrentCaseState = new Store(defaultCurrentCaseState);

export default CurrentCaseState;
