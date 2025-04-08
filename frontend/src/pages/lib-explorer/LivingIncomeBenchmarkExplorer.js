import React, { useCallback, useEffect, useState, useMemo } from "react";
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
  Alert,
} from "antd";
import Chart from "../../components/chart";
import { min, max, isEmpty } from "lodash";
import { api, roundToOneDecimal, calculateHouseholdSize } from "../../lib";
import { thousandFormatter } from "../../components/chart/options/common";
import { NewCpiForm } from "../../components/utils";

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
const step2InputProps = {
  style: {
    width: 50,
  },
  className: "step2-input-field",
};
const disabledInputProps = {
  style: {
    width: 135,
  },
  className: "disabled-field",
};
const step2NumberProps = {
  controls: false,
  style: {
    width: 50,
  },
};

const defaultRegionState = {
  status: null,
  loading: false,
  placeholder: "Select Region",
};

const LivingIncomeBenchmarkExplorer = () => {
  const [filterForm] = Form.useForm();
  const [libForm] = Form.useForm();

  const [mapLoading, setMapLoading] = useState(true);
  const [mapData, setMapData] = useState([]);
  const [regionOptions, setRegionOptions] = useState(false);
  const [regionState, setRegionState] = useState(defaultRegionState);
  const [defaultLIB, setDefaultLIB] = useState({}); // default LIB
  const [showCustomCPIField, setShowCustomCPIField] = useState(false);
  const [adjustedLIB, setAdjustedLIB] = useState({}); // from step 1
  const [incorporateStepOne, setIncorporateStepOne] = useState(false);
  const [newCPIFactor, setNewCPIFactor] = useState(null);

  // Search form
  const selectedCountry = Form.useWatch("country", filterForm);
  const selectedRegion = Form.useWatch("region", filterForm);

  // Adjusted LIB form
  const selectedYear = Form.useWatch("year", libForm);
  const newCPI = Form.useWatch("new_cpi", libForm);
  const newHhSize = Form.useWatch("new_hh_size", libForm);
  const newAvgNrAdult = Form.useWatch("new_avg_nr_of_adult", libForm);

  const countryOptions = window.master.countries;
  const currencies = window.master.currencies;

  const filteredCountryOptions = useMemo(() => {
    const mapCountryIds = mapData.map((d) => d.country_id);
    return countryOptions.filter((c) => mapCountryIds.includes(c.value));
  }, [countryOptions, mapData]);

  const currencyUnit = useMemo(() => {
    filterForm.setFieldValue("region", null);
    if (selectedCountry) {
      return (
        currencies.find((c) => c.country === selectedCountry)?.label || "LCU"
      );
    }
    return "LCU";
  }, [currencies, selectedCountry, filterForm]);

  // handle fetch map data
  useEffect(() => {
    api
      .get("count-lib-by-country")
      .then((res) => {
        setMapData(
          res.data.map((d) => ({
            ...d,
            name: d.COUNTRY,
            value: d.benchmark_count,
          }))
        );
      })
      .catch((e) => {
        console.error(`Error fetch lib map: ${e.response}`);
      })
      .finally(() => {
        setMapLoading(false);
      });
  }, []);

  // handle on clear search
  const handleClearSearch = useCallback(
    ({ resetFilterFields = true }) => {
      if (resetFilterFields) {
        filterForm.resetFields();
      }
      libForm.resetFields();
      setDefaultLIB({});
      setAdjustedLIB({});
      setShowCustomCPIField(false);
      setRegionState(defaultRegionState);
      setRegionOptions([]);
      setNewCPIFactor(null);
      setIncorporateStepOne(false);
    },
    [filterForm, libForm]
  );

  // handle on selected country
  useEffect(() => {
    handleClearSearch({ resetFilterFields: false });
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
          console.error(`Error handle on selected country: ${e.response}`);
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
  }, [selectedCountry, handleClearSearch]);

  // handle onSearch
  const onSearch = (values) => {
    const { country, region } = values;
    let url = `country_region_benchmark?country_id=${country}`;
    url = `${url}&region_id=${region}&year=${currentYear}`;
    api
      .get(url)
      .then((res) => {
        const { data } = res;
        const adult = roundToOneDecimal(data.nr_adults);
        const child = roundToOneDecimal(data.household_size - data.nr_adults);
        const defHHSize = calculateHouseholdSize({
          adult,
          child,
        });
        const targetHH = data.household_equiv;
        // Use LCU
        const targetValue = data.value.lcu;
        // with CPI calculation
        // Case year LI Benchmark = Latest Benchmark*(1-CPI factor)
        // INFLATION RATE HERE
        let LITarget = 0;
        if (data?.cpi_factor) {
          const caseYearLIB = targetValue * (1 + data.cpi_factor);
          LITarget = (defHHSize / targetHH) * caseYearLIB;
        } else {
          LITarget = (defHHSize / targetHH) * targetValue;
        }
        setDefaultLIB({ ...data, LITarget });
      })
      .catch((e) => {
        console.error(`Error handle onSearch: ${e.response}`);
      });
  };

  // handle onChange year
  useEffect(() => {
    if (selectedYear) {
      let url = `country_region_benchmark?country_id=${selectedCountry}`;
      url = `${url}&region_id=${selectedRegion}&year=${selectedYear}`;
      api
        .get(url)
        .then((res) => {
          const { data } = res;
          const adult = roundToOneDecimal(data.nr_adults);
          const child = roundToOneDecimal(data.household_size - data.nr_adults);
          const defHHSize = calculateHouseholdSize({
            adult,
            child,
          });
          const targetHH = data.household_equiv;
          // Use LCU
          const targetValue = data.value.lcu;
          // with CPI calculation
          // Case year LI Benchmark = Latest Benchmark*(1-CPI factor)
          // INFLATION RATE HERE
          let LITarget = 0;
          if (data?.cpi_factor || data?.cpi_factor === 0) {
            libForm.setFieldValue("inflation_rate", data.cpi_factor.toFixed(2));
            const caseYearLIB = targetValue * (1 + data.cpi_factor);
            LITarget = (defHHSize / targetHH) * caseYearLIB;
            setShowCustomCPIField(false);
          } else {
            libForm.setFieldValue("inflation_rate", "NA");
            LITarget = (defHHSize / targetHH) * targetValue;
            setShowCustomCPIField(selectedYear > data.year ? true : false);
          }
          if (selectedYear <= data.year) {
            libForm.setFieldValue(
              "adjusted_benchmark_value",
              `${thousandFormatter(LITarget, 2)} ${currencyUnit}`
            );
          } else {
            libForm.setFieldValue("adjusted_benchmark_value", "NA");
          }
          setAdjustedLIB({ ...data, LITarget });
        })
        .catch((e) => {
          console.error(`Error handle onChange year: ${e.response}`);
        });
    }
  }, [selectedYear, selectedCountry, selectedRegion, libForm, currencyUnit]);

  // handle benchmark adjustment (Step 1)
  useEffect(() => {
    if (!isEmpty(adjustedLIB) && newCPI) {
      const last_year_cpi = adjustedLIB.last_year_cpi;
      const adult = roundToOneDecimal(adjustedLIB.nr_adults);
      const child = roundToOneDecimal(
        adjustedLIB.household_size - adjustedLIB.nr_adults
      );
      const defHHSize = calculateHouseholdSize({
        adult,
        child,
      });
      const targetHH = adjustedLIB.household_equiv;
      // Use LCU
      const targetValue = adjustedLIB.value.lcu;

      const newCPIFactor = (newCPI - last_year_cpi) / last_year_cpi; // inflation rate
      setNewCPIFactor(newCPIFactor);

      const caseYearLIB = targetValue * (1 + newCPIFactor);
      const LITarget = (defHHSize / targetHH) * caseYearLIB;

      libForm.setFieldValue("new_inflation_rate", newCPIFactor.toFixed(2));
      libForm.setFieldValue(
        "new_adjusted_benchmark_value",
        `${thousandFormatter(LITarget, 2)} ${currencyUnit}`
      );
    } else {
      libForm.setFieldValue("new_inflation_rate", null);
      libForm.setFieldValue("new_adjusted_benchmark_value", null);
    }
  }, [newCPI, adjustedLIB, libForm, currencyUnit]);

  // handle benchmark adjustment (Step 2)
  useEffect(() => {
    const currentLIB = incorporateStepOne ? adjustedLIB : defaultLIB;
    if (!isEmpty(currentLIB)) {
      const currHhSize = currentLIB.household_size;
      const currAdult = roundToOneDecimal(currentLIB.nr_adults);
      const currChild = roundToOneDecimal(currHhSize - currentLIB.nr_adults);
      libForm.setFieldsValue({
        current_hh_size: currHhSize,
        current_adult: currAdult,
        current_child: currChild,
      });

      // new hh size
      const newHhSizeValue = newHhSize || currHhSize;
      const newAdult = newAvgNrAdult ? newAvgNrAdult : currAdult;
      const newChild = roundToOneDecimal(newHhSizeValue - newAdult);
      const defHHSize = calculateHouseholdSize({
        adult: roundToOneDecimal(newAdult),
        child: newChild,
      });
      const targetHH = currentLIB.household_equiv;
      // Use LCU
      const targetValue = currentLIB.value.lcu;
      const cpiFactor =
        newCPIFactor && incorporateStepOne
          ? newCPIFactor
          : currentLIB.cpi_factor;

      let LITarget = currentLIB?.LITarget || 0;
      if (cpiFactor) {
        const caseYearLIB = targetValue * (1 + cpiFactor);
        LITarget = (defHHSize / targetHH) * caseYearLIB;
      } else {
        LITarget = (defHHSize / targetHH) * targetValue;
      }
      libForm.setFieldValue(
        "new_hh_adjusted_benchmark_value",
        `${thousandFormatter(LITarget, 2)} ${currencyUnit}`
      );
    }
  }, [
    incorporateStepOne,
    adjustedLIB,
    defaultLIB,
    libForm,
    newHhSize,
    newAvgNrAdult,
    newCPIFactor,
    currencyUnit,
  ]);

  const onClickMap = ({ name: selectedCountry, value }) => {
    if (isNaN(value)) {
      return;
    }
    const findMapData = mapData.find(
      (d) => d.name.toLowerCase() === selectedCountry.toLowerCase()
    );
    if (findMapData?.country_id) {
      handleClearSearch({ resetFilterFields: false });
      const countryId = parseInt(findMapData?.country_id);
      filterForm.setFieldValue("country", countryId);
    }
  };

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

        {regionState.status === 404 && (
          <Col span={24}>
            <Alert
              showIcon
              type="warning"
              message="A benchmark for the country is not available."
            />
          </Col>
        )}

        {/* Map & Filter */}
        <Col span={24}>
          <Row gutter={[12, 12]} align="top" className="map-filter-container">
            <Col span={16}>
              <Card className="map-card-wrapper">
                <Chart
                  wrapper={false}
                  type="CHOROPLETH"
                  loading={mapLoading}
                  height={505}
                  data={mapData}
                  extra={{
                    seriesName: "Benchmark count by country",
                    min: min(mapData.map((d) => d.value)),
                    max: max(mapData.map((d) => d.value)),
                    visualMapText: ["Available benchmarks", ""],
                  }}
                  callbacks={{
                    onClick: onClickMap,
                  }}
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
                      onFinish={onSearch}
                    >
                      <Row gutter={[16, 16]} className="lib-filter-wrapper">
                        <Col span={24}>
                          <div className="filter-label">Country</div>
                          <Form.Item name="country" noStyle>
                            <Select
                              {...selectProps}
                              options={filteredCountryOptions}
                              placeholder="Select Country"
                              style={{ width: "100%" }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <div className="filter-label">Region</div>
                          <Form.Item name="region" noStyle>
                            <Select
                              {...selectProps}
                              options={regionOptions}
                              placeholder={regionState.placeholder}
                              loading={regionState.loading}
                              style={{ width: "100%" }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24} align="end">
                          <Space wrap={true}>
                            <Button
                              className="clear-button"
                              onClick={handleClearSearch}
                            >
                              Clear
                            </Button>
                            <Form.Item noStyle>
                              <Button
                                className="search-button"
                                htmlType="submit"
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
                  <h3>
                    {thousandFormatter(defaultLIB?.LITarget || 0, 2)}{" "}
                    {currencyUnit}
                  </h3>
                  <p className="max-width">
                    Living income benchmark for a household/year
                  </p>
                </Space>
                {defaultLIB?.source ? (
                  <p>
                    Source:{" "}
                    <a
                      href={
                        defaultLIB?.links && defaultLIB?.links !== 0
                          ? defaultLIB.links
                          : "#"
                      }
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {defaultLIB.source}
                    </a>{" "}
                    {defaultLIB.year}
                  </p>
                ) : (
                  ""
                )}
              </Card>
            </Col>
          </Row>
        </Col>
        {/* EOL Map & Filter */}

        {/* LIB form field */}
        <Col
          span={24}
          className={`lib-form-wrapper ${
            regionState.status !== 200 || isEmpty(defaultLIB)
              ? "hide-visual"
              : ""
          }`}
        >
          <Card>
            <h2>Adjust the income benchmark (optional)</h2>
            <p>
              You may want to adjust your income target for a different year (to
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
                      <Input {...disabledInputProps} disabled />
                    </Form.Item>
                    <Form.Item
                      label="Adjusted benchmark value for a household/year"
                      name="adjusted_benchmark_value"
                    >
                      <Input
                        {...disabledInputProps}
                        style={{ width: 300 }}
                        disabled
                      />
                    </Form.Item>
                  </div>
                  <div className={showCustomCPIField ? "" : "hide-visual"}>
                    <p className="error">
                      No inflation rate available for the selected year. Please
                      manually enter the Consumer Price Index (CPI) for the
                      required time period using the link below. Once you enter
                      the value, the inflation rate will update, and the
                      benchmark will adjust accordingly.
                    </p>
                    <NewCpiForm
                      adjustedBenchmarkValueFieldProps={{
                        style: { width: 300 },
                      }}
                    />
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
                    <Switch
                      size="small"
                      onChange={setIncorporateStepOne}
                      disabled={isEmpty(adjustedLIB)}
                      checked={incorporateStepOne}
                    />{" "}
                    Take step 1 into account
                  </Form.Item>
                  <div className="step-form-item-wrapper step-2-wrapper">
                    {/* current composition */}
                    <div>
                      <p>Current composition</p>
                      <div className="step-2-value-wrapper step-2-current">
                        <div className="step-2-field-wrapper">
                          <p>Household size: </p>
                          <Form.Item name="current_hh_size" noStyle>
                            <Input {...step2InputProps} size="small" disabled />
                          </Form.Item>
                        </div>
                        <div className="step-2-field-wrapper">
                          <p>Adults: </p>
                          <Form.Item name="current_adult" noStyle>
                            <Input {...step2InputProps} size="small" disabled />
                          </Form.Item>
                        </div>
                        <div className="step-2-field-wrapper">
                          <p>Children: </p>
                          <Form.Item name="current_child" noStyle>
                            <Input {...step2InputProps} size="small" disabled />
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
                          <Form.Item name="new_hh_size" noStyle>
                            <InputNumber {...step2NumberProps} size="small" />
                          </Form.Item>
                        </div>
                        <div className="step-2-field-wrapper">
                          <p>Nr. of adults</p>
                          <Form.Item name="new_avg_nr_of_adult" noStyle>
                            <InputNumber {...step2NumberProps} size="small" />
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
                        <Input
                          {...disabledInputProps}
                          style={{ width: 300 }}
                          disabled
                        />
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
