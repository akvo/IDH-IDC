import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Result, Segmented } from "antd";
import { useSearchParams } from "react-router-dom";
import TableToolbar from "./components/TableToolbar";
import ResourcesTable from "./components/ResourcesTable";
import GlossaryTable from "./components/GlossaryTable";
import academyService, { isRequestCancelled } from "./services/academy";
import useUpdateSearchParams from "./hooks/useUpdateSearchParams";
import "./AcademyResourcesPage.scss";

const toOptions = (values) =>
  values.map((value) => ({ key: value, label: value }));

const TABS = {
  resources: {
    label: "Resources",
    load: (options) => academyService.getResources(options),
    Table: ResourcesTable,
    noun: "resources",
    searchLabel: "Search resources",
    typeOptions: toOptions(["Guidance", "Organisation", "Template", "Tool"]),
  },
  glossary: {
    label: "Glossary",
    load: (options) => academyService.getGlossary(options),
    Table: GlossaryTable,
    noun: "terms",
    searchLabel: "Search terms and definitions",
    typeOptions: toOptions(["Core", "Finance", "Additional"]),
  },
};
const DEFAULT_TAB = "resources";
const NO_ROWS = [];

// `<sort_by>:<sort_order>`, as accepted by both endpoints
const SORT_OPTIONS = [
  { key: "name:asc", label: "Name (A–Z)" },
  { key: "name:desc", label: "Name (Z–A)" },
  { key: "type:asc", label: "Type (A–Z)" },
  { key: "type:desc", label: "Type (Z–A)" },
  { key: "created_at:desc", label: "Newest first" },
  { key: "created_at:asc", label: "Oldest first" },
];
const DEFAULT_SORT = "name:asc";

const AcademyResourcesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // The URL holds the tab and its filters, so a filtered list can be shared,
  // refreshed and navigated back. Unknown values fall back to the defaults.
  const tab = TABS[searchParams.get("tab")]
    ? searchParams.get("tab")
    : DEFAULT_TAB;
  const config = TABS[tab];
  const search = (searchParams.get("search") || "").trim();
  const type = config.typeOptions.some(
    ({ key }) => key === searchParams.get("type")
  )
    ? searchParams.get("type")
    : null;
  const sort = SORT_OPTIONS.some(({ key }) => key === searchParams.get("sort"))
    ? searchParams.get("sort")
    : DEFAULT_SORT;

  // Rows are kept with the tab and filters they came from: switching tabs
  // never renders one tab's rows with the other tab's columns, and a filter
  // change re-renders the rows once, when its own results arrive
  const [list, setList] = useState({
    tab: null,
    rows: [],
    search: "",
    filtered: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // A newer tab/filter aborts the older request so results never arrive
    // out of order
    const controller = new AbortController();
    const [sortBy, sortOrder] = sort.split(":");
    setLoading(true);
    setError(null);
    TABS[tab]
      .load({ search, type, sortBy, sortOrder, signal: controller.signal })
      .then((data) => {
        setList({
          tab,
          rows: data?.data || [],
          search,
          filtered: Boolean(search || type),
        });
        setLoading(false);
      })
      .catch((err) => {
        if (isRequestCancelled(err)) {
          return;
        }
        setError(err.message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [tab, search, type, sort, reloadKey]);

  const updateParams = useUpdateSearchParams(setSearchParams);

  const handleSearch = useCallback(
    (term) => updateParams({ search: term }),
    [updateParams]
  );
  const handleType = useCallback(
    (value) => updateParams({ type: value }),
    [updateParams]
  );
  const handleSort = useCallback(
    (value) => updateParams({ sort: value === DEFAULT_SORT ? null : value }),
    [updateParams]
  );
  // Each tab has its own types, so switching starts from a clean list
  const handleTab = (value) =>
    setSearchParams(value === DEFAULT_TAB ? {} : { tab: value });

  const { Table, noun } = config;
  const emptyText = useMemo(
    () =>
      list.filtered ? (
        <div className="academy-table-empty">
          <p>No {noun} match your search or filter.</p>
          <Button onClick={() => updateParams({ search: null, type: null })}>
            Clear filters
          </Button>
        </div>
      ) : (
        <p className="academy-table-empty">No {noun} yet.</p>
      ),
    [list.filtered, noun, updateParams]
  );

  return (
    <div className="academy-resources" data-testid="academy-resources">
      <div className="academy-resources-header">
        <h1 className="academy-resources-title">
          Technical Resources &amp; Glossary
        </h1>
        <p className="academy-resources-subtitle">
          Everything referenced inside the modules, in one place, grouped by the
          four kinds of resource.
        </p>
      </div>

      <div className="academy-resources-controls">
        <Segmented
          className="academy-resources-tabs"
          aria-label="Resources and glossary"
          value={tab}
          options={Object.entries(TABS).map(([value, { label }]) => ({
            value,
            label,
          }))}
          onChange={handleTab}
        />
        <TableToolbar
          key={tab}
          search={search}
          onSearch={handleSearch}
          searchLabel={config.searchLabel}
          sortOptions={SORT_OPTIONS}
          sortValue={sort}
          onSort={handleSort}
          typeOptions={config.typeOptions}
          typeValue={type}
          onType={handleType}
        />
      </div>

      <div className="academy-resources-card">
        {error ? (
          <Result
            status="error"
            title={`We couldn't load the ${config.noun}`}
            subTitle={error}
            extra={
              <Button
                type="primary"
                onClick={() => setReloadKey((key) => key + 1)}
              >
                Try again
              </Button>
            }
          />
        ) : (
          <Table
            rows={list.tab === tab ? list.rows : NO_ROWS}
            loading={loading}
            highlight={list.search}
            emptyText={emptyText}
          />
        )}
      </div>
    </div>
  );
};

export default AcademyResourcesPage;
