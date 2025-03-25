import React, { useState } from "react";
import "./lib-explorer.scss";
import { ContentLayout } from "../../components/layout";
import { Row, Col, Form, Card, Space, Select, Button } from "antd";
import Chart from "../../components/chart";
import { min, max } from "lodash";

const selectProps = {
  showSearch: true,
  allowClear: true,
  optionFilterProp: "label",
  style: {
    width: "100%",
  },
};

const LivingIncomeBenchmarkExplorer = () => {
  const [form] = Form.useForm();

  const [mapLoading, setMapLoading] = useState(true);
  const [mapData, setMapData] = useState([]);

  const countryOptions = window.master.countries;

  return (
    <ContentLayout
      breadcrumbItems={[
        { title: "Home", href: "/welcome" },
        { title: "Living income benchmark explorer" },
      ]}
      wrapperId="lib-explorer"
    >
      <Row gutter={[20, 20]} className="lib-content-wrapper">
        {/* Page title */}
        <Col span={24} className="lib-page-title-wrapper">
          <div className="title">Living income benchmark explorer</div>
          <div className="description">
            Discover available living income benchmarks by selecting a country
            to see which regions are covered. Customize benchmarks based on
            household composition or adjust for inflation as needed.
          </div>
        </Col>
        {/* EOL Page title */}

        {/* Map & Filter */}
        <Col span={24}>
          <Row gutter={[12, 12]} align="top" className="map-filter-container">
            <Col span={16}>
              <Card className="map-card-wrapper">
                <Chart
                  wrapper={false}
                  type="CHOROPLETH"
                  // loading={mapLoading}
                  height={505}
                  data={mapData}
                  extra={{
                    seriesName: "Case count by country",
                    min: min(mapData.map((d) => d.value)),
                    max: max(mapData.map((d) => d.value)),
                    visualMapText: ["Number of benchmark", ""],
                  }}
                  // callbacks={{
                  //   onClick: onClickMap,
                  // }}
                />
              </Card>
            </Col>
            <Col span={8} className="filter-benchmark-value-wrapper">
              <Card className="filter-card-wrapper">
                <Row gutter={[20, 20]}>
                  <Col span={24}>
                    <h3>Search Benchmarks</h3>
                    <p>
                      Here you can access benchmarks for the regions available.
                    </p>
                  </Col>
                  <Col span={24}>
                    <Form
                      form={form}
                      name="filter-form"
                      className="filter-form-container"
                      layout="vertical"
                      // initialValues={filterInitialValues}
                      // onFinish={onFilter}
                    >
                      <Row gutter={[16, 16]} className="lib-filter-wrapper">
                        <Col span={24}>
                          <div className="filter-label">Country</div>
                          <Form.Item name="country" noStyle>
                            <Select
                              {...selectProps}
                              options={countryOptions}
                              placeholder="Select Country"
                              loading={mapLoading}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <div className="filter-label">Region</div>
                          <Form.Item name="source" noStyle>
                            <Select
                              {...selectProps}
                              options={[]}
                              placeholder="Select Region"
                              loading={mapLoading}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24} align="end">
                          <Space wrap={true}>
                            <Button
                              className="clear-button"
                              // onClick={handleClearFilter}
                              disabled={mapLoading}
                            >
                              Clear
                            </Button>
                            <Form.Item noStyle>
                              <Button
                                className="search-button"
                                htmlType="submit"
                                disabled={mapLoading}
                              >
                                Search
                              </Button>
                            </Form.Item>
                          </Space>
                        </Col>
                      </Row>
                    </Form>
                  </Col>
                </Row>
              </Card>
              <Card className="benchmark-value-card-wrapper">
                <div>12286.00 KES</div>
                <div>Living income benchmark for a household/year</div>
                <div>
                  Source: <a>Living Income Benchmark</a> 2023
                </div>
              </Card>
            </Col>
          </Row>
        </Col>
        {/* EOL Map & Filter */}
      </Row>
    </ContentLayout>
  );
};

export default LivingIncomeBenchmarkExplorer;
