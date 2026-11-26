import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Col, Row, Select, Skeleton } from "antd";
import { ContentLayout } from "../../../components/layout";
import { routePath } from "../../../components/route";
import { api, filterSelectProps } from "../../../lib";
import { useWindowDimensions } from "../../../hooks";
import ModuleDistributionChart from "./components/ModuleDistributionChart";
import CompaniesParticipationTable from "./components/CompaniesParticipationTable";
import {
  TOTAL_MODULES,
  buildStatsCsv,
  downloadCsv,
  formatNumber,
  getStatsCsvFilename,
} from "./utils";
import "./AcademyUserStats.scss";

export const STATS_ENDPOINT = "admin/academy-user-statistics";

const toOptions = (values = []) =>
  values.map((value) => ({ label: `${value}`, value }));

const KpiCard = ({ label, value, testId }) => (
  <div className="academy-stats-card academy-stats-kpi" data-testid={testId}>
    <div className="academy-stats-kpi__label">{label}</div>
    <div className="academy-stats-kpi__value">{value}</div>
  </div>
);

const AcademyUserStats = () => {
  const [filters, setFilters] = useState({
    year: null,
    region: null,
    sector: null,
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { windowInnerHeight } = useWindowDimensions();

  useEffect(() => {
    const controller = new AbortController();
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== null)
    );
    setLoading(true);
    setError(null);
    api
      .get(STATS_ENDPOINT, { params, signal: controller.signal })
      .then((res) => setData(res.data))
      .catch((e) => {
        if (!controller.signal.aborted) {
          console.error(e);
          setError("Could not load the Academy user statistics.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [filters]);

  const filterOptions = data?.filter_options;
  const yearOptions = useMemo(
    () => toOptions(filterOptions?.years),
    [filterOptions]
  );
  const regionOptions = useMemo(
    () => toOptions(filterOptions?.regions),
    [filterOptions]
  );
  const sectorOptions = useMemo(
    () => toOptions(filterOptions?.sectors),
    [filterOptions]
  );

  const kpis = data?.kpis;
  const totalModules = kpis?.total_modules || TOTAL_MODULES;

  const setFilter = (key) => (value) =>
    setFilters((prev) => ({ ...prev, [key]: value ?? null }));

  const handleExport = () =>
    downloadCsv(buildStatsCsv(data, filters), getStatsCsvFilename());

  const filterSelects = [
    { key: "year", placeholder: "All years", options: yearOptions },
    { key: "region", placeholder: "All regions", options: regionOptions },
    { key: "sector", placeholder: "All sectors", options: sectorOptions },
  ];

  return (
    <ContentLayout
      breadcrumbItems={[
        { title: "Home", href: routePath.idc.dashboard },
        { title: "Users", href: "/admin/users" },
      ]}
      title="User Management"
      wrapperId="academy-user-stats"
    >
      <div className="academy-stats" data-testid="academy-user-stats">
        <div className="academy-stats-toolbar">
          <div className="academy-stats-toolbar__filters">
            {filterSelects.map(({ key, placeholder, options }) => (
              <Select
                key={key}
                {...filterSelectProps(windowInnerHeight)}
                placeholder={placeholder}
                options={options}
                value={filters[key]}
                onChange={setFilter(key)}
                aria-label={`Filter by ${key}`}
                data-testid={`filter-${key}`}
              />
            ))}
          </div>
          <Button
            className="button-ghost"
            onClick={handleExport}
            disabled={!data}
            data-testid="btn-export-csv"
          >
            Export CSV
          </Button>
        </div>

        {error && (
          <Alert
            type="error"
            showIcon
            message={error}
            className="academy-stats-error"
            data-testid="academy-stats-error"
          />
        )}

        {!data && loading ? (
          <Skeleton active />
        ) : (
          <>
            <Row gutter={[24, 24]} className="academy-stats-kpis">
              {[
                {
                  testId: "kpi-registered-users",
                  label: "Registered Academy users",
                  value: formatNumber(kpis?.registered_users),
                },
                {
                  testId: "kpi-active-users",
                  label: "Active users (last 30 days)",
                  value: formatNumber(kpis?.active_users_30d),
                },
                {
                  testId: "kpi-companies",
                  label: "Companies taking part",
                  value: formatNumber(kpis?.companies_count),
                },
                {
                  testId: "kpi-avg-modules",
                  label: "Average modules completed",
                  value: `${
                    kpis?.avg_modules_completed ?? 0
                  } / ${totalModules}`,
                },
              ].map((kpi) => (
                <Col key={kpi.testId} xs={24} sm={12} xl={6}>
                  <KpiCard {...kpi} />
                </Col>
              ))}
            </Row>
            <Row gutter={[24, 24]}>
              <Col xs={24} xl={12}>
                <ModuleDistributionChart
                  distribution={data?.module_distribution || []}
                  loading={loading}
                />
              </Col>
              <Col xs={24} xl={12}>
                <CompaniesParticipationTable
                  companies={data?.companies || []}
                  totalModules={totalModules}
                  loading={loading}
                />
              </Col>
            </Row>
          </>
        )}
      </div>
    </ContentLayout>
  );
};

export default AcademyUserStats;
