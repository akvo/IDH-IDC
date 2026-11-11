// Define all route prefixes here
// to disable the routeprefix replace to empty string
const routePrefix = {
  idc: "/income-driver-calculator",
};

// Helper to prefix paths
const withPrefix = (prefix, path) =>
  path ? `${routePrefix[prefix]}${path}` : `${routePrefix[prefix]}`;

// Route definitions
const routePath = {
  idc: {
    landing: withPrefix("idc"),
    login: withPrefix("idc", "/login"),
    dashboard: withPrefix("idc", "/welcome"),
    cases: withPrefix("idc", "/cases"),
    case: withPrefix("idc", "/case"),
    faq: withPrefix("idc", "/faq"),
    livingIncomeBenchmarkExplorer: withPrefix(
      "idc",
      "/living-income-benchmark-explorer"
    ),
    exploreStudies: withPrefix("idc", "/explore-studies"),
  },
  academy: {
    landing: "/academy",
    overview: "/academy/overview",
    courses: "/academy/courses",
    modules: "/academy/modules",
    resources: "/academy/resources",
    account: "/academy/account",
    settings: "/academy/settings",
    register: "/register",
    verify: "/verify-academy",
  },
};

const paths = {
  casesWelcome: routePath.idc.dashboard,
  academy: routePath.academy.landing,
  login: "/login",
  register: "/register",
  verifyAcademy: "/verify-academy",
};

export { routePath, routePrefix, paths };
