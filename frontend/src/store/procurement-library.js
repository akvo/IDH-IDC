import { Store } from "pullstate";

const defaultPLState = {
  practices: [],
  questions: [],
};

const PLState = new Store(defaultPLState);

export default PLState;
