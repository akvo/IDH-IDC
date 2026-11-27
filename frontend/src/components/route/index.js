import {
  routePath,
  routePrefix,
  paths,
  getAuthenticatedHomeRoute,
} from "./paths";

const showIDCSubMenu = (pathname = window.location.pathname) => {
  if (
    pathname.includes("/income-driver-calculator") ||
    pathname.includes("/admin")
  ) {
    return true;
  }
  return false;
};

export { default as PrivateRoutes } from "./PrivateRoutes";
export { default as RedirectWithSearch } from "./RedirectWithSearch";
export {
  routePath,
  routePrefix,
  paths,
  getAuthenticatedHomeRoute,
  showIDCSubMenu,
};
