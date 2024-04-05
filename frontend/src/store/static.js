export const adminRole = ["super_admin", "admin"];
// export const nonAdminRole = ["editor", "viewer", "user"];
export const nonAdminRole = ["user"];
export const allUserRole = [...adminRole, ...nonAdminRole];
export const businessUnitRole = ["admin", "member"];
export const casePermission = ["edit", "view"];
export const businessUnitRequiredForRole = ["admin", "editor", "viewer"];

export const areaUnitOptions = [
  {
    label: "Hectares",
    value: "hectares",
  },
  {
    label: "Acres",
    value: "acres",
  },
  {
    label: "Cubic Metres",
    value: "cubic-metres",
  },
  {
    label: "Cubic Feet",
    value: "cubic-feet",
  },
  {
    label: "Cubic Yards",
    value: "cubic-yards",
  },
  {
    label: "Square Feet",
    value: "square-feet",
  },
  {
    label: "Square Meter",
    value: "square-meter",
  },
];

export const volumeUnitOptions = [
  {
    label: "Kilograms",
    value: "kilograms",
  },
  {
    label: "Grams",
    value: "grams",
  },
  {
    label: "Litres",
    value: "litres",
  },
  {
    label: "Kilolitres",
    value: "kilolitres",
  },
  {
    label: "Barrels",
    value: "barrels",
  },
  {
    label: "Bags",
    value: "bags",
  },
  {
    label: "Tons",
    value: "tons",
  },
];
