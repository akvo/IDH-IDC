import { Store } from "pullstate";

const defaultUIState = {
  organisationOptions: [],
  tagOptions: [],
  companyOptions: [],
  companyHavingCaseOptions: [],
};

const UIState = new Store(defaultUIState);

export default UIState;
