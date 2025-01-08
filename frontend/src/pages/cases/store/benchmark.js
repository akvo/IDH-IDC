import { Store } from "pullstate";

const defaultBenchmarkState = {
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

const BenchmarkState = new Store(defaultBenchmarkState);

export default BenchmarkState;
