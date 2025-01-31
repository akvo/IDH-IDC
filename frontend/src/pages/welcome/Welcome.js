import React, { useState, useEffect, useMemo } from "react";
import "./welcome.scss";
import {
  Row,
  Col,
  Card,
  Button,
  Spin,
  Table,
  Modal,
  Select,
  Space,
} from "antd";
import { UserState, UIState } from "../../store";
import { ArrowRightOutlined } from "@ant-design/icons";
import { MapView } from "akvo-charts";
import { api, selectProps } from "../../lib";
import { commodityOptions } from "../../store/static";
import "akvo-charts/dist/index.css";
import { Link } from "react-router-dom";
import { groupBy, map, sumBy, uniqBy, uniq } from "lodash";

const perPage = 10;
const defData = {
  current: 1,
  data: [],
  total: 0,
  total_page: 1,
};

const CustomTooltipComponent = ({ props }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 4,
      }}
    >
      <div
        style={{
          fontWeight: 900,
          fontSize: 14,
          color: "#01625F",
          fontFamily: "RocGrotesk",
        }}
      >
        {props?.name || "NA"}
      </div>
      <table border={0} style={{ fontSize: 12 }}>
        <tr>
          <td>Number of cases</td>
          <td>:</td>
          <td>{props?.case_count || "NA"}</td>
        </tr>
        <tr>
          <td>Number of farmers</td>
          <td>:</td>
          <td>{isNaN(props?.total_farmers) ? "NA" : props?.total_farmers}</td>
        </tr>
      </table>
    </div>
  );
};

const Welcome = () => {
  const { fullname: username, internal_user: isInternalUser } =
    UserState.useState((s) => s);
  const companyOptions = UIState.useState((s) => s.companyOptions);

  const [mapLoading, setMapLoading] = useState(true);
  const [mapData, setMapData] = useState([]);

  const [selectedCountryId, setSelectedCountryId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableData, setTableData] = useState(defData);

  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const tableElement = document.getElementById("table-container");

  const filteredCompanyOptions = useMemo(() => {
    if (!mapData?.length) {
      return [];
    }
    const companyIds = uniq(
      mapData
        .filter((d) => d.country_id === selectedCountryId) // filter by clicked country
        .flatMap((d) => d.companies.map((c) => c.company_id))
    );
    return companyOptions.filter((c) => companyIds.includes(c.value));
  }, [mapData, selectedCountryId, companyOptions]);

  useEffect(() => {
    if (mapLoading) {
      api
        .get("/map/case-by-country-and-company")
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
    }
  }, [mapLoading]);

  const config = {
    center: [0, 0],
    zoom: 2.3,
    height: "75vh",
    width: "100%",
  };

  const tile = {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    maxZoom: 19,
    minZoom: 2.3,
    attribution: "© OpenStreetMap",
  };

  const onClickMap = (map, { target }) => {
    const selectedCountry = target?.feature?.properties?.COUNTRY;
    const findMapData = mapData.find(
      (d) => d.COUNTRY.toLowerCase() === selectedCountry.toLowerCase()
    );
    if (findMapData?.country_id) {
      setTableLoading(true);
      setSelectedCountryId(findMapData.country_id);
      const url = `case?page=${currentPage}&limit=${perPage}&country=${findMapData.country_id}`;
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
        map.fitBounds(target._bounds, { animate: true });
      }, 100);
    }
  };

  const layer = {
    source: window.topojson,
    style: {
      color: "#fff",
      weight: 1.5,
      dashArray: 2,
      fillOpacity: 1,
    },
    color: [
      "#EAF2F2",
      "#D0E2E2",
      "#B6D2D1",
      "#9CC2C1",
      "#82B2B1",
      "#69A2A0",
      "#4F9290",
      "#358280",
      "#1B726F",
      "#01625F",
    ],
    mapKey: "COUNTRY",
    choropleth: "case_count",
    tooltip: {
      show: true,
      showTooltipForAll: false,
      tooltipComponent: CustomTooltipComponent,
    },
    onClick: onClickMap,
  };

  const handleOnClickViewSummary = () => {
    setShowSummaryModal(true);
    // TODO :: fetch view summary data?
  };

  const columns = [
    {
      title: "Case Name",
      dataIndex: "name",
      key: "case",
      defaultSortOrder: "descend",
    },
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
      width: "15%",
      defaultSortOrder: "descend",
    },
    {
      title: "Year",
      dataIndex: "year",
      key: "year",
      width: "15%",
      defaultSortOrder: "descend",
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
            className="button-green-transparent button-light font-roc-grotesk"
            onClick={() => handleOnClickViewSummary({ ...record })}
          >
            View summary
          </Button>
        );
      },
    },
  ];

  return (
    <Row id="welcome" align="middle" gutter={[20, 20]}>
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
            Enter in this creative world. Discover now the latest NFTs or start
            creating your own!
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
              <Row gutter={[12, 12]}>
                <Col span={24} className="title">
                  Cases
                </Col>
                <Col span={24} className="description">
                  Calculates actual household income and feasible changes in
                  income by using input data on the 5 key drivers of household
                  income.
                </Col>
                <Col span={24} align="end">
                  <Link to="/cases">
                    <Button className="button-explore">
                      Explore <ArrowRightOutlined />
                    </Button>
                  </Link>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col span={7}>
            <Card className="floating-card-item explore-studies-card-wrapper">
              <Row gutter={[12, 12]}>
                <Col span={24} className="title">
                  Explore Studies for Insights
                </Col>
                <Col span={24} className="description">
                  To make the data entry process more informed and efficient, we
                  recommend visiting the &quot;Explore Studies&quot; section.
                </Col>
                <Col span={24} align="end">
                  <Link to="/explore-studies">
                    <Button className="button-explore">
                      Explore <ArrowRightOutlined />
                    </Button>
                  </Link>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col span={7}>
            <Card className="floating-card-item lib-card-wrapper">
              <Row gutter={[12, 12]}>
                <Col span={24} className="title">
                  Living income benchmarks
                </Col>
                <Col span={24} className="description">
                  To make the data entry process more informed and efficient, we
                  recommend visiting the &quot;Explore Studies&quot; section.
                </Col>
                <Col span={24} align="end">
                  <Button className="button-explore">
                    Explore <ArrowRightOutlined />
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Col>
      {/* EOL  Jumbotron */}

      {/* Map */}
      <Col span={24}>
        <Card className="map-card-wrapper">
          {!mapLoading ? (
            <MapView tile={tile} layer={layer} data={mapData} config={config} />
          ) : (
            <div className="loading-container">
              <Spin />
            </div>
          )}
        </Card>
      </Col>
      {/* EOL Map */}

      {/* Table */}
      <Col span={24} id="table-container">
        {selectedCountryId ? (
          <Row gutter={[14, 14]}>
            {isInternalUser ? (
              <Col span={24}>
                <Select
                  {...selectProps}
                  options={filteredCompanyOptions}
                  placeholder="Select company"
                  style={{ width: "24rem" }}
                />
              </Col>
            ) : null}
            <Col span={24}>
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
                      Total Case: {total}
                    </div>
                  ),
                }}
              />
            </Col>
          </Row>
        ) : null}
      </Col>
      {/* EOL Table */}

      {/* View summary modal */}
      <Modal
        title="View summary"
        open={showSummaryModal}
        onCancel={() => setShowSummaryModal(false)}
        width="55%"
        className="view-summary-modal-wrapper"
        maskClosable={false}
        footer={false}
      >
        <Row gutter={[20, 20]} align="middle">
          <Col span={24}>
            <Card className="scenario-outcome-form-wrapper">
              <Row gutter={[12, 12]} align="top">
                <Col span={12}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <label>Scenario</label>
                    <Select {...selectProps} placeholder="Select scenario" />
                  </Space>
                </Col>
                <Col span={12} align="end">
                  <Button className="button-download">
                    Download scenario outcomes
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col span={24}>
            <Table
              columns={[
                {
                  title: "",
                  dataIndex: "name",
                  key: "name",
                },
                {
                  title: "Current value",
                  dataIndex: "current",
                  key: "current",
                  width: "25%",
                },
                {
                  title: "Scenario 1",
                  dataIndex: "scenario",
                  key: "scenario",
                  width: "25%",
                },
              ]}
              dataSource={[]}
            />
          </Col>
        </Row>
      </Modal>
      {/* EOL View summary modal */}
    </Row>
  );
};

export default Welcome;
