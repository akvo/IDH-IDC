import { routePath } from "./paths";

const showIDCSubMenu = () => {
  const pathname = window.location.pathname;
  if (
    pathname.includes("/income-driver-calculator") ||
    pathname.includes("/admin")
  ) {
    return true;
  }
  return false;
};

export { default as PrivateRoutes } from "./PrivateRoutes";
export { routePath, showIDCSubMenu };
