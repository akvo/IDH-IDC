// Define all route prefixes here
// to disable the routeprefix replace to empty string
const routePrefix = {
  idc: "/income-driver-calculator",
};

// Helper to prefix paths
const withPrefix = (prefix, path) => `${routePrefix[prefix]}${path}`;

// Route definitions
const routePath = {
  idc: {
    login: withPrefix("idc", "/login"),
    dashboard: withPrefix("idc", "/welcome"),
    cases: withPrefix("idc", "/cases"),
    case: withPrefix("idc", "/case"),
  },
};

export { default as PrivateRoutes } from "./PrivateRoutes";
export { routePath };
