import React, { useCallback, useMemo } from "react";
import {
  Form,
  Radio,
  Row,
  Col,
  InputNumber,
  Select,
  Card,
  Space,
  message,
  Alert,
} from "antd";
import { CurrentCaseState, CaseUIState } from "../store";
import { yesNoOptions } from "../../../store/static";
import { InputNumberThousandFormatter, selectProps, api } from "../../../lib";
import { thousandFormatter } from "../../../components/chart/options/common";

const formStyle = { width: "100%" };

const calculateHouseholdSize = ({
  household_adult = 0,
  household_children = 0,
}) => {
  // OECD average household size
  // first adult = 1, next adult 0.5
  // 1 child = 0.3
  const adult_size =
    household_adult === 1 ? 1 : 1 + (household_adult - 1) * 0.5;
  const children_size = household_children * 0.3;
  return adult_size + children_size;
};

const SetIncomeTarget = ({ segment }) => {
  const [form] = Form.useForm();
  const currentCase = CurrentCaseState.useState((s) => s);
  const stepSetIncomeTargetState = CaseUIState.useState(
    (s) => s.stepSetIncomeTarget
  );

  const [messageApi, contextHolder] = message.useMessage();

  const setTargetYourself = Form.useWatch(
    `${segment.id}-set_target_yourself`,
    form
  );

  const updateCurrentSegmentState = useCallback(
    (updatedSegmentValue) => {
      CurrentCaseState.update((s) => {
        s.segments = s.segments.map((prev) => {
          if (prev.id === segment.id) {
            return {
              ...prev,
              ...updatedSegmentValue,
            };
          }
          return prev;
        });
      });
    },
    [segment.id]
  );

  const preventNegativeValue = (fieldName) => [
    () => ({
      validator(_, value) {
        if (value >= 0) {
          return Promise.resolve();
        }
        form.setFieldValue(fieldName, null);
        return Promise.reject(new Error("Negative value not allowed"));
      },
    }),
  ];

  const showBenchmarNotification = useCallback(
    ({ currentCase }) => {
      return messageApi.open({
        type: "error",
        content: `No benchmark available in the specified currency (${currentCase.currency}). Consider switching to the local currency.`,
      });
    },
    [messageApi]
  );

  const fetchBenchmark = useCallback(
    ({ region, onLoadInitialValue = false }) => {
      // const regionData = { region: region };
      let url = `country_region_benchmark?country_id=${currentCase.country}`;
      url = `${url}&region_id=${region}&year=${currentCase.year}`;
      api
        .get(url)
        .then((res) => {
          // data represent LI Benchmark value
          const { data } = res;
          // if data value by currency not found or 0 return a NA notif
          if (
            !data?.value?.[currentCase.currency.toLowerCase()] ||
            data?.value?.[currentCase.currency.toLowerCase()] === 0
          ) {
            const timeout = onLoadInitialValue ? 500 : 0;
            showBenchmarNotification({ currentCase });
            setTimeout(() => {
              // reset benchmark
              updateCurrentSegmentState({
                region: onLoadInitialValue ? null : region,
                benchmark: null,
                adult: null,
                child: null,
                target: null,
              });
            }, timeout);
            return;
          }
          //
          const household_adult = Math.round(data.nr_adults);
          const household_children = Math.round(
            data.household_size - data.nr_adults
          );
          // setBenchmark(data);
          const defHHSize = calculateHouseholdSize({
            household_adult,
            household_children,
          });
          // setHouseholdSize(defHHSize);
          // set hh adult and children default value
          form.setFieldsValue({
            [`${segment.id}-adult`]: household_adult,
            [`${segment.id}-child`]: household_children,
          });
          updateCurrentSegmentState({
            region: region,
            benchmark: data,
            adult: household_adult,
            child: household_children,
          });
          //
          const targetHH = data.household_equiv;
          // Use LCU if currency if not USE/EUR
          const targetValue =
            data.value?.[currentCase.currency.toLowerCase()] || data.value.lcu;
          // with CPI calculation
          // Case year LI Benchmark = Latest Benchmark*(1-CPI factor)
          // INFLATION RATE HERE
          if (data?.cpi_factor) {
            const caseYearLIB = targetValue * (1 + data.cpi_factor);
            // incorporate year multiplier
            // const LITarget = (defHHSize / targetHH) * caseYearLIB * 12;
            const LITarget = (defHHSize / targetHH) * caseYearLIB;
            form.setFieldValue(`${segment.id}-target`, LITarget);
            updateCurrentSegmentState({ target: LITarget });
          } else {
            // incorporate year multiplier
            // const LITarget = (defHHSize / targetHH) * targetValue * 12;
            const LITarget = (defHHSize / targetHH) * targetValue;
            form.setFieldValue(`${segment.id}-target`, LITarget);
            updateCurrentSegmentState({ target: LITarget });
          }
        })
        .catch((e) => {
          // reset field and benchmark value
          // resetBenchmark({ region: region });
          // show notification
          const { statusText, data } = e.response;
          const content = data?.detail || statusText;
          messageApi.open({
            type: "error",
            content: content,
          });
        });
    },
    [
      currentCase,
      form,
      messageApi,
      segment.id,
      showBenchmarNotification,
      updateCurrentSegmentState,
    ]
  );

  const handleRegionChange = (value) => {
    if (value) {
      fetchBenchmark({ region: value });
    } else {
      updateCurrentSegmentState("target", null);
    }
  };

  const handleChangeManualTarget = (value) => {
    form.setFieldsValue({
      [`${segment.id}-region`]: null,
      [`${segment.id}-adult`]: null,
      [`${segment.id}-child`]: null,
      [`${segment.id}-target`]: value,
    });
    updateCurrentSegmentState({
      region: null,
      benchmark: null,
      adult: null,
      child: null,
      target: value,
    });
  };

  const initialIncomeTargetValue = useMemo(() => {
    const values = {};
    Object.keys(segment).map((key) => {
      const value = segment[key];
      if (key === "region" && value) {
        values[`${segment.id}-set_target_yourself`] = 0; // set income value by benchmark
      }
      if (["target", "region", "adult", "child"].includes(key)) {
        values[`${segment.id}-${key}`] = value;
      }
    });
    return values;
  }, [segment]);

  const renderTargetInput = (key) => {
    switch (key) {
      case 1: // yes
        return (
          <Col span={24}>
            <Form.Item
              name={`${segment.id}-target`}
              label="Target"
              rules={[
                {
                  required: true,
                  message: "Income target required.",
                },
              ]}
            >
              <InputNumber
                style={{ width: "40%" }}
                controls={false}
                addonAfter={currentCase.currency}
                {...InputNumberThousandFormatter}
                // disabled={!disableTarget || !enableEditCase}
                onChange={handleChangeManualTarget}
              />
            </Form.Item>
          </Col>
        );
      case 0: // no
        return (
          <Col span={24}>
            <Row gutter={[12, 12]}>
              <Col span={8}>
                <Form.Item name={`${segment.id}-target`} noStyle hidden>
                  <InputNumber disabled />
                </Form.Item>
                <Form.Item label="Region" name={`${segment.id}-region`}>
                  <Select
                    style={formStyle}
                    options={stepSetIncomeTargetState.regionOptions}
                    // disabled={!enableEditCase}
                    loading={stepSetIncomeTargetState.regionOptionLoading}
                    placeholder={
                      stepSetIncomeTargetState.regionOptionStatus === 404
                        ? "Region not available"
                        : "Select or Type Region"
                    }
                    {...selectProps}
                    onChange={handleRegionChange}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Average number of adults in the household"
                  name={`${segment.id}-adult`}
                  rules={preventNegativeValue("adult")}
                >
                  <InputNumber
                    style={formStyle}
                    // onChange={handleOnChangeHouseholdAdult}
                    // disabled={!disableTarget || !enableEditCase}
                    controls={false}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Average number of children in the household"
                  name={`${segment.id}-child`}
                  rules={preventNegativeValue("child")}
                >
                  <InputNumber
                    style={formStyle}
                    // onChange={handleOnChangeHouseholdChild}
                    // disabled={!enableEditCase}
                    controls={false}
                  />
                </Form.Item>
              </Col>
              {stepSetIncomeTargetState.regionOptionStatus === 404 && (
                <Col span={24}>
                  <Alert
                    showIcon
                    type="warning"
                    message="A benchmark for the country is not available; please switch
                    to manual target."
                  />
                </Col>
              )}
              {segment.region && segment.target && (
                <>
                  <Col span={24}>
                    <Card className="card-income-target-wrapper">
                      <Space size={50}>
                        <div className="income-target-value">
                          {`${
                            segment.target
                              ? thousandFormatter(segment.target.toFixed())
                              : 0
                          } ${currentCase.currency}`}
                        </div>
                        <div className="income-target-text">
                          Living income benchmark value for a household per year
                        </div>
                      </Space>
                    </Card>
                  </Col>
                  <Col span={24}>
                    <Card className="card-lib-wrapper">
                      <Row align="middle">
                        <Col span={12} className="lib-text">
                          Information about Living Income Benchmark
                        </Col>
                        <Col span={12} align="end" className="lib-source">
                          Source:{" "}
                          <a
                            href={segment.benchmark?.links}
                            target="_blank"
                            rel="noreferrer"
                          >{`${segment.benchmark?.source}`}</a>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                </>
              )}
            </Row>
          </Col>
        );
      default:
        return "";
    }
  };

  return (
    <div>
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        initialValues={initialIncomeTargetValue}
      >
        <Row gutter={[12, 12]}>
          <Col span={24}>
            <Form.Item
              name={`${segment.id}-set_target_yourself`}
              label="Do you want to set an income target yourself?"
              rules={[
                {
                  required: true,
                  message: "Please select yes or no",
                },
              ]}
            >
              <Radio.Group options={yesNoOptions} />
            </Form.Item>
          </Col>
          {renderTargetInput(setTargetYourself)}
        </Row>
      </Form>
    </div>
  );
};

export default SetIncomeTarget;
