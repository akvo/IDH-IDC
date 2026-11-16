import { Store } from "pullstate";
import { adminRole } from "./static";

export const defaultUserState = {
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
  company_name: null,
  user_type: null,
  isExternalRegular: false,
  isCaseCreator: false,
  tools: [],
  user_profile: null,
};

const UserState = new Store(defaultUserState);

export const syncUserState = (data) => {
  if (!data) {
    return;
  }
  UserState.update((s) => {
    s.id = data.id ?? s.id;
    s.fullname = data.fullname ?? s.fullname;
    s.email = data.email ?? s.email;
    s.role = data.role ?? s.role;
    s.active = typeof data.active === "boolean" ? data.active : s.active;
    s.organisation_detail = data.organisation_detail || [];
    s.business_unit_detail = data.business_unit_detail || [];
    s.tags_count = data.tags_count ?? s.tags_count;
    s.cases_count = data.cases_count ?? s.cases_count;
    s.case_access = data.case_access || [];
    s.internal_user =
      typeof data.internal_user === "boolean"
        ? data.internal_user
        : s.internal_user;
    s.company = data.company ?? s.company;
    s.company_name = data.company_name || null;
    s.user_type = data.user_type ?? s.user_type;
    s.user_profile = data.user_profile || null;
    s.tools = Array.isArray(data.tools) ? data.tools : [];
    s.isExternalRegular = data.user_type === "external_regular";
    s.isCaseCreator =
      adminRole.includes(data.role) ||
      Boolean(data.internal_user) ||
      data.user_type === "external_advanced";
  });
};

export default UserState;
