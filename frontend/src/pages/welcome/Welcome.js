import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./welcome.scss";
import { Row, Col, Card, Button, Table, Select } from "antd";
import { UserState, UIState } from "../../store";
import { ArrowRightOutlined } from "@ant-design/icons";
import { api, selectProps } from "../../lib";
import { commodityOptions } from "../../store/static";
import { Link } from "react-router-dom";
import { groupBy, map, sumBy, uniqBy, min, max } from "lodash";
import Chart from "../../components/chart";
import { ViewSummaryModal } from "../../components/utils";

// TODO :: Map data => case which have segment (current query)
// TODO :: Map table data => all cases that saved on case table (current query)

const perPage = 10;
const defData = {
  current: 1,
  data: [],
  total: 0,
  total_page: 1,
};

const Welcome = () => {
  const { fullname: username, internal_user: isInternalUser } =
    UserState.useState((s) => s);
  const { companyHavingCaseOptions, companyOptions } = UIState.useState(
    (s) => s
  );

  const [mapLoading, setMapLoading] = useState(true);
  const [mapData, setMapData] = useState([]);

  const [selectedCountryId, setSelectedCountryId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableData, setTableData] = useState(defData);

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedCaseData, setSelectedCaseData] = useState({});
  const [selectedCaseToDisplay, setSelectedCaseToDisplay] = useState(null);

  const tableElement = document.getElementById("table-container");

  // old company options way
  // const filteredCompanyOptions = useMemo(() => {
  //   if (!mapData?.length) {
  //     return [];
  //   }
  //   const companyIds = uniq(
  //     mapData
  //       .filter((d) =>
  //         selectedCountryId ? d.country_id === selectedCountryId : true
  //       ) // filter by clicked country
  //       .flatMap((d) => d.companies.map((c) => c.company_id))
  //   );
  //   return companyOptions.filter((c) => companyIds.includes(c.value));
  // }, [mapData, selectedCountryId, companyOptions]);

  const caseToDisplayOptions = useMemo(() => {
    const options = companyHavingCaseOptions.map((o) => ({
      ...o,
      label: `${o.label} (${o.case_count} ${
        o.case_count > 1 ? "cases" : "case"
      })`,
    }));
    return [
      {
        label: "All cases",
        value: null,
      },
      ...options,
    ];
  }, [companyHavingCaseOptions]);

  const fetchMapData = useCallback((companyId) => {
    let url = "/map/case-by-country-and-company";
    if (companyId) {
      url += `?company=${companyId}`;
    }
    api
      .get(url)
      .then((res) => {
        // Group by country_id
        const groupedData = groupBy(res.data, "country_id");

        // Transform the grouped data
        const transformedData = map(groupedData, (items, countryId) => {
          const countryName = items[0].COUNTRY;
          const totalCaseCount = sumBy(items, "case_count");
          const totalFarmers = sumBy(items, "total_farmers");

          // Create a unique list of companies
          const companies = uniqBy(
            items
              .map((item) => ({
                company_id: item.company_id,
                company_name: item.company,
              }))
              .filter((x) => x?.company_id),
            "company_id"
          );

          return {
            country_id: parseInt(countryId),
            COUNTRY: countryName,
            case_count: totalCaseCount,
            name: countryName,
            value: totalCaseCount,
            total_farmers: totalFarmers,
            companies: companies,
          };
        });
        setMapData(transformedData);
      })
      .catch((e) => console.error(`Error fetching map data: ${e}`))
      .finally(() =>
        setTimeout(() => {
          setMapLoading(false);
        }, 100)
      );
  }, []);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  const fetchTableData = ({ countryId, companyId = null }) => {
    let url = `case?page=${currentPage}&limit=${perPage}&country=${countryId}`;
    if (companyId) {
      url += `&company=${companyId}`;
    }
    api
      .get(url)
      .then((res) => {
        setTableData(res.data);
      })
      .catch((e) => console.error(`Error fetching data table: ${e}`))
      .finally(() => {
        setTableLoading(false);
      });
    setTimeout(() => {
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const onClickMap = ({ name: selectedCountry, value }) => {
    if (isNaN(value)) {
      return;
    }
    const findMapData = mapData.find(
      (d) => d.name.toLowerCase() === selectedCountry.toLowerCase()
    );
    if (findMapData?.country_id) {
      setTableLoading(true);
      setSelectedCountryId(findMapData.country_id);
      fetchTableData({
        countryId: findMapData.country_id,
        companyId: selectedCaseToDisplay,
      });
    }
  };

  const handleOnCompanyChange = (companyId) => {
    setMapLoading(true);
    setSelectedCaseToDisplay(companyId || null);
    fetchMapData(companyId);
    if (!companyId) {
      setSelectedCountryId(null);
    }
    if (selectedCountryId) {
      fetchTableData({ countryId: selectedCountryId, companyId });
    }
  };

  const handleOnClickViewSummary = (record) => {
    if (record?.has_scenario_data) {
      setSelectedCaseData(record);
      setShowSummaryModal(true);
    }
  };

  const handleOnCloseViewSummary = () => {
    setShowSummaryModal(false);
    setSelectedCaseData({});
  };

  const columns = useMemo(() => {
    return [
      {
        title: "Case Name",
        dataIndex: "name",
        key: "case",
      },
      {
        title: "Country",
        dataIndex: "country",
        key: "country",
        width: "15%",
      },
      isInternalUser
        ? {
            title: "Company",
            dataIndex: "company",
            key: "company",
            width: "15%",
            render: (val) => {
              const findCompany = companyOptions.find((c) => c.value === val);
              if (findCompany && findCompany?.label) {
                return findCompany.label;
              }
              return "N/A";
            },
          }
        : {},
      {
        title: "Year",
        dataIndex: "year",
        key: "year",
        width: "15%",
      },
      {
        title: "Primary Commodity",
        key: "primary_commodity",
        width: "15%",
        render: (record) => {
          const findPrimaryCommodity = commodityOptions.find(
            (co) => co.value === record.focus_commodity
          );
          if (!findPrimaryCommodity?.label) {
            return "-";
          }
          return findPrimaryCommodity.label;
        },
      },
      {
        title: "Actions",
        key: "action",
        width: "15%",
        align: "center",
        render: (record) => {
          return (
            <Button
              type="primary"
              className="font-roc-grotesk"
              onClick={() => handleOnClickViewSummary({ ...record })}
              disabled={!record?.has_scenario_data}
              ghost
              style={{
                borderRadius: "20px",
              }}
            >
              View summary
            </Button>
          );
        },
      },
    ];
  }, [isInternalUser, companyOptions]);

  return (
    <Row id="welcome" align="middle">
      <div className="welcome-with-padding">
        {/* Header */}
        <Col span={24} className="username-wrapper">
          Hello, {username}!
        </Col>

        {/* Jumbotron */}
        <Col span={24} className="jumbotron-card-wrapper">
          <Card className="welcome-card-wrapper">
            <div className="welcome-title">
              Welcome to the income driver calculator
            </div>
            <div className="welcome-subtitle">
              IDH is working to secure better income for smallholder farmers in
              several sectors and landscapes. Start analysing data, uncover
              trends in household income and explore pathways to bridge the
              living income gap.
            </div>
          </Card>
          <Row
            align="middle"
            justify="center"
            gutter={[24, 24]}
            className="floating-card-wrapper"
          >
            <Col span={7}>
              <Card className="floating-card-item case-card-wrapper">
                <div className="title">
                  <h3>Case Overview</h3>
                </div>
                <div className="description">
                  Create a case to go through the income driver assessment and
                  discover how you can improve farmer income.
                </div>
                <div className="button-wrapper">
                  <Link to="/cases">
                    <Button className="button-explore">
                      View cases <ArrowRightOutlined />
                    </Button>
                  </Link>
                </div>
              </Card>
            </Col>
            <Col span={7}>
              <Card className="floating-card-item explore-studies-card-wrapper">
                <div className="title">
                  <h3>Explore Studies</h3>
                </div>
                <div className="description">
                  Explore whether relevant data on the five income drivers is
                  available for your specific context.
                </div>
                <div className="button-wrapper">
                  <Link to="/explore-studies">
                    <Button className="button-explore">
                      Explore <ArrowRightOutlined />
                    </Button>
                  </Link>
                </div>
              </Card>
            </Col>
            <Col span={7}>
              <Card className="floating-card-item lib-card-wrapper">
                <div className="title">
                  <h3>Living income benchmarks</h3>
                </div>
                <div className="description">
                  To make the data entry process more informed and efficient, we
                  recommend visiting the &quot;Explore Studies&quot; section.
                </div>
                <div className="button-wrapper">
                  <Link to="/living-income-benchmark-explorer">
                    <Button className="button-explore">
                      Explore <ArrowRightOutlined />
                    </Button>
                  </Link>
                </div>
              </Card>
            </Col>
          </Row>
        </Col>
        {/* EOL  Jumbotron */}
      </div>

      {/* Map */}
      <Col span={24} className="map-container">
        <Row gutter={[14, 14]}>
          <Col span={24} className="map-heading-wrapper">
            <div>
              <div className="label">
                Explore cases on the map and gain quick insights
              </div>
              <div className="description">
                Click on a country to view completed cases. Below the map,
                you&apos;ll find a case overview for the selected country with
                quick insights.
              </div>
            </div>
            {isInternalUser ? (
              <div>
                <div className="description">Select cases to display</div>
                <Select
                  {...selectProps}
                  options={caseToDisplayOptions}
                  placeholder="Select cases to display"
                  style={{ width: "24rem" }}
                  onChange={handleOnCompanyChange}
                  value={selectedCaseToDisplay}
                />
              </div>
            ) : null}
          </Col>
          <Col span={24}>
            <Card className="map-card-wrapper">
              <Chart
                wrapper={false}
                type="CHOROPLETH"
                loading={mapLoading}
                height={700}
                data={mapData}
                extra={{
                  seriesName: "Case count by country",
                  min: min(mapData.map((d) => d.value)),
                  max: max(mapData.map((d) => d.value)),
                  visualMapText: ["Number of cases", ""],
                }}
                callbacks={{
                  onClick: onClickMap,
                }}
              />
            </Card>
          </Col>
          {/* Table */}
          <Col span={24} className="table-container">
            {selectedCountryId ? (
              <Table
                rowKey="id"
                className="table-content-wrapper"
                columns={columns}
                dataSource={tableData.data}
                loading={tableLoading}
                pagination={{
                  current: currentPage,
                  pageSize: perPage,
                  total: tableData.total,
                  onChange: (page) => setCurrentPage(page),
                  showSizeChanger: false,
                  showTotal: (total) => (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        marginLeft: "14px",
                      }}
                    >
                      Total number of cases: {total}
                    </div>
                  ),
                }}
              />
            ) : null}
          </Col>
          {/* EOL Table */}
        </Row>
      </Col>
      {/* EOL Map */}

      <ViewSummaryModal
        showSummaryModal={showSummaryModal}
        setShowSummaryModal={handleOnCloseViewSummary}
        selectedCaseData={selectedCaseData}
      />
    </Row>
  );
};

export default Welcome;
