import { useEffect, useState } from "react";
import { api } from "../../lib";

export const getErrorDetail = (err, fallback) => {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail) && detail[0]?.msg) {
    return detail[0].msg;
  }
  return fallback;
};

const PROFILE_FIELDS = [
  "first_name",
  "last_name",
  "password",
  "company_name",
  "company_type",
  "sector",
  "region_name",
  "commodities",
];

// Account payload shared by Academy sign-up and invitation completion
export const toProfilePayload = (values) =>
  PROFILE_FIELDS.reduce((payload, field) => {
    const value = values[field];
    payload[field] =
      typeof value === "string" && field !== "password" ? value.trim() : value;
    return payload;
  }, {});

// Existing company names, suggested in the free-text Organisation field
export const useCompanyNames = () => {
  const [companyNames, setCompanyNames] = useState([]);
  useEffect(() => {
    let active = true;
    api
      .get("company/options")
      .then(({ data }) => {
        if (active && Array.isArray(data)) {
          setCompanyNames(data.map((company) => company.label));
        }
      })
      // Suggestions are optional; the field still accepts any text
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return companyNames;
};
