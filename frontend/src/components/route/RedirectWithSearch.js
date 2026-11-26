import React from "react";
import { Navigate, useLocation } from "react-router-dom";

// Redirect for a moved page that keeps the query string and hash
const RedirectWithSearch = ({ to }) => {
  const { search, hash } = useLocation();
  return <Navigate to={`${to}${search}${hash}`} replace />;
};

export default RedirectWithSearch;
