import React, { useMemo } from "react";
import { Spin } from "antd";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { UserState } from "../../store";
import { adminRole } from "../../store/static";
import { useAuthInitializing } from "../../lib/authRefresh";
import { paths, routePrefix, routePath } from "./paths";

const IDC_RESTRICTED_PREFIXES = [
  routePrefix.idc,
  "/cases",
  "/case",
  "/old-welcome",
  "/old-cases",
  "/admin",
];

export const isAdminPath = (pathname = "") =>
  pathname === "/admin" || pathname.startsWith("/admin/");

export const isIdcRestrictedPath = (pathname = "") =>
  IDC_RESTRICTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

const PrivateRoutes = () => {
  const storeIsAuth = UserState.useState((s) => s.isAuthenticated);
  const storeAuthInitializing = UserState.useState((s) => s.authInitializing);
  const contextAuthInitializing = useAuthInitializing();
  const userId = UserState.useState((s) => s.id);
  const userActive = UserState.useState((s) => s.active);
  const userRole = UserState.useState((s) => s.role);
  const rawTools = UserState.useState((s) => s.tools);
  const location = useLocation();

  const authInitializing = contextAuthInitializing || storeAuthInitializing;

  const userTools = useMemo(
    () => (Array.isArray(rawTools) ? rawTools : []),
    [rawTools]
  );

  const isAuthenticated = Boolean(storeIsAuth || (userId && userActive));

  if (authInitializing) {
    return (
      <div
        data-testid="auth-loading"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={paths.login} state={{ from: location }} replace />;
  }

  const canAccessAdmin =
    isAdminPath(location.pathname) && adminRole.includes(userRole);

  if (
    isIdcRestrictedPath(location.pathname) &&
    !userTools.includes("idc") &&
    !canAccessAdmin
  ) {
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
