import { Store } from "pullstate";

const defaultBenchmarkValue = {
  id: null,
  country: null,
  region: null,
  household_size: null,
  year: null,
  nr_adults: null,
  household_equiv: null,
  source: null,
  links: null,
  value: {
    lcu: null,
    usd: null,
    eur: null,
  },
  case_year_cpi: null,
  last_year_cpi: null,
  cpi_factor: null,
  message: null,
};

const defaultSegmentsValue = {
  id: null,
  case: null,
  name: null,
  region: null,
  target: null,
  adult: null,
  child: null,
  number_of_farmers: null,
  answers: {},
  benchmark: defaultBenchmarkValue,
};

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
  segments: [defaultSegmentsValue],
  case_commodities: [],
  private: false,
  tags: [],
  company: null,
  created_by: null,
  created_at: null,
  updated_by: null,
  updated_at: null,
  status: null,
  import_id: null,
};

const CurrentCaseState = new Store(defaultCurrentCaseState);

export const resetCurrentCaseState = () => {
  CurrentCaseState.update(() => defaultCurrentCaseState);
};

export default CurrentCaseState;
