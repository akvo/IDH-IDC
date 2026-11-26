import React from "react";
import { Table } from "antd";
import { TOTAL_MODULES, formatNumber } from "../utils";

export const getCompanyColumns = (totalModules = TOTAL_MODULES) => [
  {
    title: "Company",
    dataIndex: "company",
    key: "company",
    sorter: (a, b) => a.company.localeCompare(b.company),
  },
  {
    title: "Users",
    dataIndex: "users_count",
    key: "users_count",
    sorter: (a, b) => a.users_count - b.users_count,
    render: (value) => formatNumber(value),
  },
  {
    title: "Average progress",
    dataIndex: "average_progress_pct",
    key: "average_progress_pct",
    sorter: (a, b) => a.average_progress_pct - b.average_progress_pct,
    render: (value) => `${value}%`,
  },
  {
    title: `Completed all ${totalModules}`,
    dataIndex: "completed_all_modules_count",
    key: "completed_all_modules_count",
    sorter: (a, b) =>
      a.completed_all_modules_count - b.completed_all_modules_count,
    render: (value) => formatNumber(value),
  },
];

const CompaniesParticipationTable = ({
  companies = [],
  totalModules = TOTAL_MODULES,
  loading = false,
}) => (
  <div
    className="academy-stats-card academy-stats-companies"
    data-testid="companies-participation-table"
  >
    <h3 className="academy-stats-companies__title">Companies taking part</h3>
    <Table
      rowKey="company"
      size="middle"
      columns={getCompanyColumns(totalModules)}
      dataSource={companies}
      loading={loading}
      pagination={{ pageSize: 10, hideOnSinglePage: true }}
      scroll={{ x: true }}
    />
  </div>
);

export default CompaniesParticipationTable;
