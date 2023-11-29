export const adminRole = ["super_admin", "admin"];
// export const nonAdminRole = ["editor", "viewer", "user"];
export const nonAdminRole = ["user"];
export const allUserRole = [...adminRole, ...nonAdminRole];
export const businessUnitRole = ["admin", "member"];
export const casePermission = ["edit", "view"];
export const businessUnitRequiredForRole = ["admin", "editor", "viewer"];
