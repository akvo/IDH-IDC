import { Store } from "pullstate";

const defaultUIState = {
  organisationOptions: [],
  tagOptions: [],
  companyOptions: [],
};

const UIState = new Store(defaultUIState);

export default UIState;
