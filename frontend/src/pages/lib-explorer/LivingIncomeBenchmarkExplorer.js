import React, { useEffect, useState } from "react";
import "./lib-explorer.scss";
import { ContentLayout } from "../../components/layout";
import {
  Row,
  Col,
  Form,
  Card,
  Space,
  Select,
  Button,
  Input,
  InputNumber,
  Switch,
} from "antd";
import Chart from "../../components/chart";
import { min, max } from "lodash";
import { api } from "../../lib";

const currentYear = new Date().getFullYear();
const yearOptions = Array.from(
  { length: currentYear - 2019 },
  (_, i) => 2020 + i
).map((x) => ({ label: x, value: x }));

const selectProps = {
  showSearch: true,
  allowClear: true,
  optionFilterProp: "label",
  style: {
    width: 135,
  },
};
const inputProps = {
  style: {
    width: 135,
  },
};
const numberProps = {
  controls: false,
  style: {
    width: 135,
  },
};

const LivingIncomeBenchmarkExplorer = () => {
  const [filterForm] = Form.useForm();
  const [libForm] = Form.useForm();

  const countryOptions = window.master.countries;

  const [mapLoading, setMapLoading] = useState(true);
  const [mapData, setMapData] = useState([]);
  const [regionOptions, setRegionOptions] = useState(false);
  const [regionState, setRegionState] = useState({
    status: null,
    loading: false,
    disabled: true,
    placeholder: "Select Region",
  });

  const selectedCountry = Form.useWatch("country", filterForm);

  useEffect(() => {
    if (selectedCountry) {
      setRegionState((prev) => ({ ...prev, loading: true }));
      api
        .get(`region/options?country_id=${selectedCountry}`)
        .then((res) => {
          const { data } = res;
          setRegionOptions(data);
          setRegionState((prev) => ({
            ...prev,
            disabled: false,
            status: 200,
            placeholder: "Select or Type Region",
          }));
        })
        .catch((e) => {
          const { status } = e.response;
          setRegionOptions([]);
          setRegionState((prev) => ({
            ...prev,
            disabled: false,
            status: status,
            placeholder:
              status === 404 ? "Region not available" : prev.placeholder,
          }));
        })
        .finally(() => {
          setRegionState((prev) => ({ ...prev, loading: false }));
        });
    }
  }, [selectedCountry]);

  return (
    <ContentLayout
      breadcrumbItems={[
        { title: "Home", href: "/welcome" },
        { title: "Living income benchmark explorer" },
      ]}
      wrapperId="lib-explorer"
    >
      <Row gutter={[20, 20]} className="lib-content-container">
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
                      form={filterForm}
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
                              style={{ width: "100%" }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <div className="filter-label">Region</div>
                          <Form.Item name="source" noStyle>
                            <Select
                              {...selectProps}
                              options={regionOptions}
                              placeholder={regionState.placeholder}
                              loading={regionState.loading}
                              disabled={regionState.disabled}
                              style={{ width: "100%" }}
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
                <Space align="center" size="large">
                  <h3>12286.00 KES</h3>
                  <p className="max-width">
                    Living income benchmark for a household/year
                  </p>
                </Space>
                <p>
                  Source: <a>Living Income Benchmark</a> 2023
                </p>
              </Card>
            </Col>
          </Row>
        </Col>
        {/* EOL Map & Filter */}

        {/* LIB form field */}
        <Col span={24} className="lib-form-wrapper">
          <Card>
            <h2>Adjust the income benchmark (optional)</h2>
            <p>
              You may need to adjust your income target for a different year (to
              account for inflation) or for a different household composition.
              <br />
              To do so, follow the optional steps below.
            </p>
            <Form form={libForm} layout="vertical">
              {/* Step 1 */}
              <div className="step-container">
                <Space className="step-wrapper" align="center">
                  <div className="number">1.</div>
                  <div className="label">
                    Benchmark adjustment for a different year
                  </div>
                </Space>
                <div>
                  <div className="step-form-item-wrapper">
                    <Form.Item label="Select year" name="year">
                      <Select {...selectProps} options={yearOptions} />
                    </Form.Item>
                    <Form.Item label="Inflation rate" name="inflation_rate">
                      <Input {...inputProps} disabled />
                    </Form.Item>
                    <Form.Item
                      label="Adjusted benchmark value for a household/year"
                      name="adjusted_benchmark_value"
                    >
                      <Input {...inputProps} disabled />
                    </Form.Item>
                  </div>
                  <div>
                    <p>
                      No inflation rate available for the selected year. Please
                      manually enter the Consumer Price Index (CPI) for the
                      required time period using the link below. Once you enter
                      the value, the inflation rate will update, and the
                      benchmark will adjust accordingly.
                    </p>
                    <p>
                      <a>Find consumer price index (CPI)</a>
                    </p>
                    <div className="step-form-item-wrapper">
                      <Form.Item label="Insert the CPI value" name="new_cpi">
                        <InputNumber {...numberProps} />
                      </Form.Item>
                      <Form.Item
                        label="Inflation rate"
                        name="new_inflation_rate"
                      >
                        <Input {...inputProps} disabled />
                      </Form.Item>
                      <Form.Item
                        label="Adjusted benchmark value for a household/year"
                        name="new_adjusted_benchmark_value"
                      >
                        <Input {...inputProps} disabled />
                      </Form.Item>
                    </div>
                  </div>
                </div>
              </div>
              {/* EOL Step 1 */}

              {/* Step 2 */}
              <div className="step-container">
                <Space className="step-wrapper" align="center">
                  <div className="number">2.</div>
                  <div className="label">
                    Benchmark adjustment for a different household composition
                  </div>
                </Space>
                <div>
                  <Form.Item name="take_step_1_into_account">
                    <Switch size="small" /> Take step 1 into account
                  </Form.Item>
                  <div className="step-form-item-wrapper step-2-wrapper">
                    {/* current composition */}
                    <div>
                      <p>Current composition</p>
                      <div className="step-2-value-wrapper">
                        <div className="step-2-field-wrapper step-2-current">
                          <p>Household size: </p>
                          <Form.Item name="current_hh_size" noStyle>
                            <Input size="small" disabled />
                          </Form.Item>
                        </div>
                        <div className="step-2-field-wrapper">
                          <p>Adults: </p>
                          <Form.Item name="current_adult" noStyle>
                            <Input size="small" disabled />
                          </Form.Item>
                        </div>
                        <div className="step-2-field-wrapper">
                          <p>Children: </p>
                          <Form.Item name="current_child" noStyle>
                            <Input size="small" disabled />
                          </Form.Item>
                        </div>
                      </div>
                    </div>
                    {/* EOL current composition */}

                    {/* new composition */}
                    <div>
                      <p>New composition</p>
                      <div className="step-2-value-wrapper">
                        <div className="step-2-field-wrapper">
                          <p>Household size: </p>
                          <Form.Item name="new_current_hh_size" noStyle>
                            <InputNumber {...numberProps} size="small" />
                          </Form.Item>
                        </div>
                        <div className="step-2-field-wrapper">
                          <p>Avg. nr. of adults:</p>
                          <Form.Item name="new_avg_nr_of_adult" noStyle>
                            <InputNumber {...numberProps} size="small" />
                          </Form.Item>
                        </div>
                      </div>
                    </div>
                    {/* EOL new composition*/}

                    {/* adjusted value */}
                    <div>
                      <Form.Item
                        label="Adjusted benchmark value for a household/year"
                        name="new_hh_adjusted_benchmark_value"
                      >
                        <Input {...inputProps} disabled />
                      </Form.Item>
                    </div>
                    {/* EOL adjusted value */}
                  </div>
                </div>
              </div>
              {/* EOL Step 2 */}
            </Form>
          </Card>
        </Col>
        {/* EOL LIB form field */}
      </Row>
    </ContentLayout>
  );
};

export default LivingIncomeBenchmarkExplorer;
