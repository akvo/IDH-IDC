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
};

const PLState = new Store(defaultPLState);

export default PLState;
