import React, { useMemo } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useCookies } from "react-cookie";
import { UserState } from "../../store";
import { routePath } from "./paths";

const PrivateRoutes = () => {
  const [cookies] = useCookies(["AUTH_TOKEN"]);
  const userId = UserState.useState((s) => s.id);
  const userActive = UserState.useState((s) => s.active);
  const location = useLocation();

  const authTokenAvailable = useMemo(() => {
    const res = cookies?.AUTH_TOKEN && cookies?.AUTH_TOKEN !== "undefined";
    return res;
  }, [cookies?.AUTH_TOKEN]);

  return authTokenAvailable || (userId && userActive) ? (
    <Outlet />
  ) : (
    <Navigate to={routePath.idc.login} state={{ from: location }} replace />
  );
};

export default PrivateRoutes;
