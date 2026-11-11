import React, { useMemo } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useCookies } from "react-cookie";
import { UserState } from "../../store";
import { paths, routePrefix, routePath } from "./paths";

const IDC_RESTRICTED_PREFIXES = [
  routePrefix.idc,
  "/cases",
  "/case",
  "/old-welcome",
  "/old-cases",
  "/admin",
];

const isIdcRestrictedPath = (pathname = "") =>
  IDC_RESTRICTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

const PrivateRoutes = () => {
  const [cookies] = useCookies(["AUTH_TOKEN"]);
  const userId = UserState.useState((s) => s.id);
  const userActive = UserState.useState((s) => s.active);
  const rawTools = UserState.useState((s) => s.tools);
  const location = useLocation();

  const authTokenAvailable = useMemo(() => {
    const res = cookies?.AUTH_TOKEN && cookies?.AUTH_TOKEN !== "undefined";
    return res;
  }, [cookies?.AUTH_TOKEN]);

  const userTools = useMemo(
    () => (Array.isArray(rawTools) ? rawTools : []),
    [rawTools]
  );

  const isAuthenticated = Boolean(authTokenAvailable || (userId && userActive));

  if (!isAuthenticated) {
    return <Navigate to={paths.login} state={{ from: location }} replace />;
  }

  if (isIdcRestrictedPath(location.pathname) && !userTools.includes("idc")) {
    return (
      <Navigate
        to={routePath.academy.landing}
        state={{ unauthorizedIDC: true }}
        replace
      />
    );
  }

  return <Outlet />;
};

export default PrivateRoutes;
