import React, { useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  CurrentCaseState,
  CaseUIState,
  PrevCaseState,
  stepPath,
} from "../store";
import { yesNoOptions } from "../../../store/static";
import {
  InputNumberThousandFormatter,
  selectProps,
  api,
  removeUndefinedObjectValue,
} from "../../../lib";
import { thousandFormatter } from "../../../components/chart/options/common";
import { isEmpty, isEqual } from "lodash";

const formStyle = { width: "100%" };

const calculateHouseholdSize = ({ adult = 0, child = 0 }) => {
  // OECD average household size
  // first adult = 1, next adult 0.5
  // 1 child = 0.3
  const adult_size = adult === 1 ? 1 : 1 + (adult - 1) * 0.5;
  const children_size = child * 0.3;
  return adult_size + children_size;
};

/**
 * STEP 1
 */
const SetIncomeTarget = ({ segment, setbackfunction, setnextfunction }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { enableEditCase } = CaseUIState.useState((s) => s.general);
  const currentCase = CurrentCaseState.useState((s) => s);
  const prevCaseSegments = PrevCaseState.useState((s) => s?.segments || []);
  const stepSetIncomeTargetState = CaseUIState.useState(
    (s) => s.stepSetIncomeTarget
  );
  const setTargetYourself = Form.useWatch(
    `${segment.id}-set_target_yourself`,
    form
  );
  const [messageApi, contextHolder] = message.useMessage();

  const initialIncomeTargetValue = useMemo(() => {
    const values = {};
    Object.keys(segment).map((key) => {
      const value = segment[key];
      if (key === "region" && value && segment.target !== null) {
        values[`${segment.id}-set_target_yourself`] = 0; // set income value by benchmark
      }
      if (key === "region" && !value && segment.target !== null) {
        values[`${segment.id}-set_target_yourself`] = 1; // set income value by manual
      }
      if (["target", "region", "adult", "child"].includes(key)) {
        values[`${segment.id}-${key}`] = value;
      }
    });
    return values;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const upateCaseButtonState = (value) => {
    CaseUIState.update((s) => ({
      ...s,
      caseButton: value,
    }));
  };

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
    ({ region }) => {
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
            showBenchmarNotification({ currentCase });
            // reset benchmark
            updateCurrentSegmentState({
              region: region,
              benchmark: null,
              adult: null,
              child: null,
              target: null,
            });
            return;
          }
          //
          const adult = Math.round(data.nr_adults);
          const child = Math.round(data.household_size - data.nr_adults);
          // setBenchmark(data);
          const defHHSize = calculateHouseholdSize({
            adult,
            child,
          });
          // setHouseholdSize(defHHSize);
          // set hh adult and children default value
          form.setFieldsValue({
            [`${segment.id}-adult`]: adult,
            [`${segment.id}-child`]: child,
          });
          updateCurrentSegmentState({
            region: region,
            benchmark: data,
            adult: adult,
            child: child,
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

  const handleRegionChange = (value) => {
    if (value) {
      fetchBenchmark({ region: value });
    } else {
      updateCurrentSegmentState({ target: null });
    }
  };

  const handleChangeManualTarget = (value) => {
    updateCurrentSegmentState({
      region: null,
      benchmark: null,
      adult: null,
      child: null,
      target: value,
    });
    form.setFieldsValue({
      [`${segment.id}-region`]: null,
      [`${segment.id}-adult`]: null,
      [`${segment.id}-child`]: null,
      [`${segment.id}-target`]: value,
    });
  };

  const handleChangeAdultChildField = (key, value) => {
    // handle income target value when householdSize updated
    const householdSize = calculateHouseholdSize({
      adult: segment.adult,
      child: segment.child,
      [key]: value,
    });
    updateCurrentSegmentState({
      [key]: value,
    });

    if (
      segment?.benchmark &&
      !isEmpty(segment.benchmark) &&
      segment.benchmark !== "NA"
    ) {
      // show benchmark notification
      if (
        segment.benchmark?.value?.[currentCase?.currency?.toLowerCase()] === 0
      ) {
        showBenchmarNotification({ currentCase });
        // reset benchmark
        updateCurrentSegmentState({
          region: null,
          benchmark: null,
          adult: null,
          child: null,
          target: null,
        });
        return;
      }
      // Use LCU if currency if not USD/EUR
      const targetValue =
        segment.benchmark.value?.[currentCase.currency.toLowerCase()] ||
        segment.benchmark.value.lcu;
      // with CPI calculation
      // Case year LI Benchmark = Latest Benchmark*(1-CPI factor)
      if (segment.benchmark?.cpi_factor) {
        const caseYearLIB = targetValue * (1 + segment.benchmark.cpi_factor);
        // incorporate year multiplier
        // const LITarget =
        //   (householdSize / benchmark.household_equiv) * caseYearLIB * 12;
        const LITarget =
          (householdSize / segment.benchmark.household_equiv) * caseYearLIB;
        updateCurrentSegmentState({
          target: LITarget,
        });
        // setIncomeTarget(LITarget);
      } else {
        // incorporate year multiplier
        // const LITarget =
        //   (householdSize / benchmark.household_equiv) * targetValue * 12;
        const LITarget =
          (householdSize / segment.benchmark.household_equiv) * targetValue;
        updateCurrentSegmentState({
          target: LITarget,
        });
      }
    }

    if (
      isEmpty(segment.benchmark) &&
      segment.region &&
      segment.benchmark !== "NA"
    ) {
      fetchBenchmark({
        region: segment.region,
      });
    }
  };

  const handleSaveSegment = useCallback(() => {
    if (!enableEditCase) {
      return;
    }

    if (!isEmpty(currentCase.segments)) {
      // detect is payload updated
      const isUpdated =
        prevCaseSegments
          .map((prev) => {
            prev = {
              ...prev,
              benchmark: null, // set to null
              answers: removeUndefinedObjectValue(prev?.answers || {}),
            };
            let findPayload = currentCase.segments.find(
              (curr) => curr.id === prev.id
            );
            if (!findPayload) {
              // handle deleted segment
              return true;
            }
            findPayload = {
              ...findPayload,
              benchmark: null, // set to null
              answers: removeUndefinedObjectValue(findPayload?.answers || {}),
            };
            const equal = isEqual(
              removeUndefinedObjectValue(prev),
              removeUndefinedObjectValue(findPayload)
            );
            return !equal;
          })
          .filter((x) => x)?.length > 0;

      const payloads = currentCase.segments.map((curr) => ({
        id: curr.id,
        name: curr.name,
        case: curr.case,
        region: curr.region,
        target: curr.target,
        adult: curr.adult,
        child: curr.child,
        answers: [],
      }));
      upateCaseButtonState({ loading: true });
      api
        .put(`/segment?updated=${isUpdated}`, payloads)
        .then((res) => {
          const { data } = res;
          PrevCaseState.update((s) => ({
            ...s,
            segments: data,
          }));
          messageApi.open({
            type: "success",
            content: "Income target saved successfully.",
          });
          setTimeout(() => {
            navigate(`/case/${currentCase.id}/${stepPath.step2.label}`);
          }, 100);
        })
        .catch((e) => {
          console.error(e);
          const { status, data } = e.response;
          let errorText = "Failed to save income target.";
          if (status === 403) {
            errorText = data.detail;
          }
          messageApi.open({
            type: "error",
            content: errorText,
          });
        })
        .finally(() => {
          upateCaseButtonState({ loading: false });
        });
    }
  }, [
    currentCase.id,
    currentCase.segments,
    prevCaseSegments,
    messageApi,
    navigate,
    enableEditCase,
  ]);

  const backFunction = useCallback(() => {
    navigate(-1);
    // navigate("/cases");
  }, [navigate]);

  const nextFunction = useCallback(() => {
    handleSaveSegment();
  }, [handleSaveSegment]);

  useEffect(() => {
    if (setbackfunction) {
      setbackfunction(backFunction);
    }
    if (setnextfunction) {
      setnextfunction(nextFunction);
    }
  }, [setbackfunction, setnextfunction, backFunction, nextFunction]);

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
                disabled={!enableEditCase}
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
                    disabled={!enableEditCase}
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
                    onChange={(value) =>
                      handleChangeAdultChildField("adult", value)
                    }
                    disabled={!enableEditCase}
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
                    onChange={(value) =>
                      handleChangeAdultChildField("child", value)
                    }
                    disabled={!enableEditCase}
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
    <div id="set-income-target">
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
              <Radio.Group options={yesNoOptions} disabled={!enableEditCase} />
            </Form.Item>
          </Col>
          {renderTargetInput(setTargetYourself)}
        </Row>
      </Form>
      {contextHolder}
    </div>
  );
};

export default SetIncomeTarget;
