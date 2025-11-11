import { Store } from "pullstate";

const defaultPLState = {
  practices: [],
  questions: [],
  filter: {
    search: "",
    impact_area: null,
    procurement_process_ids: [],
  },
  // v2
  categoryWithAttributes: [],
  filterV2: {
    search: "",
    impact_area: null,
    sourcing_strategy_cycle: null,
    procurement_principles: null,
  },
};

const PLState = new Store(defaultPLState);

export default PLState;
