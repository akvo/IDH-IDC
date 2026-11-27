export const TOTAL_MODULES = 6;

export const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-US");

const FORMULA_TRIGGER_RE = /^[\t\r]*[=+@-]/;

// Quote a CSV cell when needed and neutralize spreadsheet formula prefixes
const toCsvCell = (value) => {
  if (value === null || typeof value === "undefined") {
    return "";
  }
  if (typeof value === "number") {
    return `${value}`;
  }
  const text = `${value}`;
  const safe = FORMULA_TRIGGER_RE.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

const toCsvRows = (rows) =>
  rows.map((row) => row.map(toCsvCell).join(",")).join("\r\n");

// Filters, KPIs, module distribution and companies as one CSV (TAC-4.5)
export const buildStatsCsv = (data, filters = {}) => {
  const kpis = data?.kpis || {};
  const totalModules = kpis.total_modules || TOTAL_MODULES;
  const sections = [
    [
      ["Applied filters"],
      ["Year", filters.year || "All years"],
      ["Region", filters.region || "All regions"],
      ["Sector", filters.sector || "All sectors"],
    ],
    [
      ["Key figures"],
      ["Registered Academy users", kpis.registered_users ?? 0],
      ["Active users (last 30 days)", kpis.active_users_30d ?? 0],
      ["Companies taking part", kpis.companies_count ?? 0],
      [
        "Average modules completed",
        `${kpis.avg_modules_completed ?? 0} / ${totalModules}`,
      ],
    ],
    [
      ["Module completion distribution"],
      ["Modules completed", "Users", "Percentage"],
      ...(data?.module_distribution || []).map((bin) => [
        bin.modules_completed,
        bin.count,
        `${bin.percentage}%`,
      ]),
    ],
    [
      ["Companies taking part"],
      ["Company", "Users", "Average progress %", "Completed all modules"],
      ...(data?.companies || []).map((company) => [
        company.company,
        company.users_count,
        company.average_progress_pct,
        company.completed_all_modules_count,
      ]),
    ],
  ];
  return sections.map(toCsvRows).join("\r\n\r\n");
};

export const getStatsCsvFilename = (date = new Date()) =>
  `li_academy_user_statistics_${date.toISOString().split("T")[0]}.csv`;

// Save a URL (data: or blob:) as a file
export const downloadUrl = (url, filename) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadCsv = (content, filename) => {
  // BOM so Excel reads accented company names as UTF-8
  const blob = new Blob(["﻿", content], {
    type: "text/csv;charset=utf-8",
  });
  const url = window.URL.createObjectURL(blob);
  downloadUrl(url, filename);
  window.URL.revokeObjectURL(url);
};
