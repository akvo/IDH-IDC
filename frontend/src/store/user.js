import { Store } from "pullstate";

const defaultUserState = {
  id: 0,
  fullname: null,
  email: null,
  role: null,
  active: false,
  business_unit_detail: [
    {
      id: 0,
      name: null,
      role: null,
    },
  ],
  organisation_detail: {
    id: null,
    name: null,
  },
  tags_count: 0,
  cases_count: 0,
  case_access: [],
  internal_user: false,
  company: null,
};

const UserState = new Store(defaultUserState);

export default UserState;
