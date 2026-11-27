import React, { useMemo } from "react";
import { Table } from "antd";
import { TOTAL_MODULES, formatNumber } from "../utils";

export const getCompanyColumns = (totalModules = TOTAL_MODULES) => [
  {
    title: "Company",
    dataIndex: "company",
    key: "company",
    sorter: (a, b) => (a.company || "").localeCompare(b.company || ""),
  },
  {
    title: "Users",
    dataIndex: "users_count",
    key: "users_count",
    sorter: (a, b) => (a.users_count || 0) - (b.users_count || 0),
    render: (value) => formatNumber(value),
  },
  {
    title: "Average progress",
    dataIndex: "average_progress_pct",
    key: "average_progress_pct",
    sorter: (a, b) =>
      (a.average_progress_pct || 0) - (b.average_progress_pct || 0),
    render: (value) => `${value ?? 0}%`,
  },
  {
    title: `Completed all ${totalModules}`,
    dataIndex: "completed_all_modules_count",
    key: "completed_all_modules_count",
    sorter: (a, b) =>
      (a.completed_all_modules_count || 0) -
      (b.completed_all_modules_count || 0),
    render: (value) => formatNumber(value),
  },
];

const CompaniesParticipationTable = ({
  companies = [],
  totalModules = TOTAL_MODULES,
  loading = false,
}) => {
  const columns = useMemo(
    () => getCompanyColumns(totalModules),
    [totalModules]
  );

  return (
    <div
      className="academy-stats-card academy-stats-companies"
      data-testid="companies-participation-table"
    >
      <h3 className="academy-stats-companies__title">Companies taking part</h3>
      <Table
        rowKey="company"
        size="middle"
        columns={columns}
        dataSource={companies}
        loading={loading}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: true }}
      />
    </div>
  );
};

export default CompaniesParticipationTable;
