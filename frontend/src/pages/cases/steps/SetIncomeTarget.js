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
  Modal,
  Input,
  Button,
  Tooltip,
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
  roundToDecimal,
  calculateHouseholdSize,
} from "../../../lib";
import { thousandFormatter } from "../../../components/chart/options/common";
import { isEmpty, isEqual } from "lodash";
import { NewCpiForm } from "../../../components/utils";
import {
  EditOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";

const formStyle = { width: "100%" };
const showInformationAboutLIBCard = false;

/**
 * STEP 1
 */
const SetIncomeTarget = ({
  segment,
  setbackfunction,
  setnextfunction,
  setsavefunction,
}) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [cpiForm] = Form.useForm();

  const { enableEditCase } = CaseUIState.useState((s) => s.general);
  const currentCase = CurrentCaseState.useState((s) => s);
  const prevCaseSegments = PrevCaseState.useState((s) => s?.segments || []);
  const stepSetIncomeTargetState = CaseUIState.useState(
    (s) => s.stepSetIncomeTarget
  );
  const newCpiModalVisible =
    stepSetIncomeTargetState?.newCpiModalVisible || false;

  const [messageApi, contextHolder] = message.useMessage();

  const setTargetYourself = Form.useWatch(
    `${segment.id}-set_target_yourself`,
    form
  );

  const newCPI = Form.useWatch(`${segment.id}-new_cpi`, cpiForm);

  const setNewCpiModalVisible = (value) => {
    CaseUIState.update((s) => ({
      ...s,
      stepSetIncomeTarget: {
        ...s.stepSetIncomeTarget,
        newCpiModalVisible: value,
      },
    }));
  };

  const setNewCPIState = ({ newCPI, newCPIFactor }) => {
    CaseUIState.update((s) => ({
      ...s,
      stepSetIncomeTarget: {
        ...s.stepSetIncomeTarget,
        newCPI,
        newCPIFactor,
      },
    }));
  };

  // handle when reset field when Do you want to set an income target yourself change
  useEffect(() => {
    if (setTargetYourself === 1) {
      form.setFieldValue(`${segment.id}-new_benchmark_value`, null);
      cpiForm.setFieldValue(`${segment.id}-new_cpi`, null);
      cpiForm.setFieldValue(`${segment.id}-new_inflation_rate`, null);
      cpiForm.setFieldValue(`${segment.id}-new_adjusted_benchmark_value`, null);
    }
    if (setTargetYourself === 0) {
      form.setFieldValue(`${segment.id}-target`, null);
    }
  }, [setTargetYourself, form, cpiForm, segment.id]);

  // handle benchmark adjustment (Step 1)
  useEffect(() => {
    if (!isEmpty(segment?.benchmark) && newCPI) {
      const benchmark = segment?.benchmark;
      const currencyUnit = currentCase?.currency;
      const last_year_cpi = benchmark.last_year_cpi;
      const defHHSize = calculateHouseholdSize({
        adult: segment.adult,
        child: segment.child,
      });
      const targetHH = benchmark.household_equiv;
      const targetValue =
        benchmark.value?.[currencyUnit?.toLowerCase()] || benchmark.value.lcu;
      const newCPIFactor = (newCPI - last_year_cpi) / last_year_cpi; // inflation rate
      const caseYearLIB = targetValue * (1 + newCPIFactor);
      const LITarget = (defHHSize / targetHH) * caseYearLIB;
      setNewCPIState({
        newCPI,
        newCPIFactor,
      });
      cpiForm.setFieldValue(
        `${segment.id}-new_inflation_rate`,
        newCPIFactor.toFixed(2)
      );
      cpiForm.setFieldValue(
        `${segment.id}-new_adjusted_benchmark_value`,
        `${thousandFormatter(LITarget, 2)} ${currencyUnit}`
      );
    } else {
      setNewCPIState({
        newCPI: null,
        newCPIFactor: null,
      });
      cpiForm.setFieldValue(`${segment.id}-new_inflation_rate`, null);
      cpiForm.setFieldValue(`${segment.id}-new_adjusted_benchmark_value`, null);
    }
  }, [
    newCPI,
    segment?.benchmark,
    cpiForm,
    currentCase?.currency,
    segment.adult,
    segment.child,
    segment.id,
  ]);

  const handleOnSaveAdjustedBenchmarkByNewCpi = () => {
    const adjustedBenchmark = cpiForm.getFieldValue(
      `${segment.id}-new_adjusted_benchmark_value`
    );
    if (adjustedBenchmark) {
      const [newBenchmarkValue] = adjustedBenchmark.split(" ");
      const LITarget = parseFloat(newBenchmarkValue.replace(/,/g, ""));
      updateCurrentSegmentState({ target: LITarget });
      form.setFieldValue(
        `${segment.id}-new_benchmark_value`,
        adjustedBenchmark
      );
      setNewCpiModalVisible(false);
    }
  };

  const isBenchmarkNotAvailable = useMemo(() => {
    if (!isEmpty(segment?.benchmark)) {
      const lcu = segment?.benchmark?.value?.lcu;
      const benchmark =
        segment?.benchmark?.value?.[currentCase?.currency?.toLowerCase()];
      return !benchmark && !lcu;
    }
    return false;
  }, [segment?.benchmark, currentCase?.currency]);

  const isAdjustBenchmarkUsingCPIValuesVisible = useMemo(() => {
    if (
      (segment?.benchmark?.value?.[currentCase?.currency?.toLowerCase()] ||
        segment?.benchmark?.value?.lcu) &&
      segment?.benchmark?.year !== currentCase.year
    ) {
      return true;
    }
    if (cpiForm) {
      cpiForm.resetFields();
    }
    return false;
  }, [segment?.benchmark, currentCase?.currency, currentCase?.year, cpiForm]);

  const greenLIBValue = useMemo(() => {
    if (
      isAdjustBenchmarkUsingCPIValuesVisible ||
      isBenchmarkNotAvailable ||
      stepSetIncomeTargetState.regionOptionStatus === 404
    ) {
      return "NA";
    }
    return `${
      segment.target ? thousandFormatter(segment.target.toFixed(2)) : 0
    } ${currentCase.currency}`;
  }, [
    isAdjustBenchmarkUsingCPIValuesVisible,
    segment?.target,
    currentCase?.currency,
    isBenchmarkNotAvailable,
    stepSetIncomeTargetState?.regionOptionStatus,
  ]);

  // handle ajusted benchmark using CPI values onLoad
  useEffect(() => {
    if (isAdjustBenchmarkUsingCPIValuesVisible && segment?.target) {
      const value = `${
        segment.target ? thousandFormatter(segment.target.toFixed(2)) : 0
      } ${currentCase.currency}`;
      form.setFieldValue(`${segment.id}-new_benchmark_value`, value);
      cpiForm.setFieldValue(
        `${segment.id}-new_adjusted_benchmark_value`,
        value
      );

      // calculate new CPI value and inflation rate on load
      const benchmark = segment?.benchmark;
      const last_year_cpi = benchmark.last_year_cpi;
      const defHHSize = calculateHouseholdSize({
        adult: segment.adult,
        child: segment.child,
      });
      const targetHH = benchmark.household_equiv;

      const targetValue =
        benchmark.value?.[currentCase?.currency?.toLowerCase()] ||
        benchmark.value.lcu;

      const caseYearLIB = (segment.target * targetHH) / defHHSize;
      const newCPIFactor = caseYearLIB / targetValue - 1;
      const newCPI = last_year_cpi * (1 + newCPIFactor);

      setNewCPIState({
        newCPI,
        newCPIFactor,
      });

      cpiForm.setFieldValue(
        `${segment.id}-new_inflation_rate`,
        newCPIFactor.toFixed(2)
      );
      cpiForm.setFieldValue(`${segment.id}-new_cpi`, newCPI.toFixed(2));
    } else {
      form.setFieldValue(`${segment.id}-new_benchmark_value`, null);
      cpiForm.resetFields();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form,
    cpiForm,
    segment?.benchmark,
    currentCase?.currency,
    isAdjustBenchmarkUsingCPIValuesVisible,
  ]);

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
      } else {
        values[`${segment.id}-${key}`] = null;
      }
    });
    form.setFieldsValue(values);
    return values;
    // maybe need:: eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segment, form]);

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
          const benchmarkByCurrency =
            data?.value?.[currentCase.currency.toLowerCase()];
          if (!benchmarkByCurrency && !isEmpty(data?.value?.lcu)) {
            showBenchmarNotification({ currentCase });
            form.setFieldValue(`${segment.id}-new_benchmark_value`, null);
            cpiForm.setFieldValue(`${segment.id}-new_cpi`, null);
            cpiForm.setFieldValue(`${segment.id}-new_inflation_rate`, null);
            cpiForm.setFieldValue(
              `${segment.id}-new_adjusted_benchmark_value`,
              null
            );
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
          const adult = roundToDecimal(data.nr_adults);
          const child = roundToDecimal(data.household_size - data.nr_adults);
          // setBenchmark(data);
          const defHHSize = calculateHouseholdSize({
            adult,
            child,
          });
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

          // handle have benchmark value but year !== case year
          if (targetValue && currentCase?.year !== data?.year) {
            // show new CPI Form
            updateCurrentSegmentState({ target: null });
            form.setFieldValue(`${segment.id}-new_benchmark_value`, null);
            cpiForm.setFieldValue(`${segment.id}-new_cpi`, null);
            cpiForm.setFieldValue(`${segment.id}-new_inflation_rate`, null);
            cpiForm.setFieldValue(
              `${segment.id}-new_adjusted_benchmark_value`,
              null
            );
            //
            setNewCpiModalVisible(true);
            return;
          }
          // eol handle have benchmark value but year !== case year

          if (data?.cpi_factor) {
            // with CPI calculation
            // Case year LI Benchmark = Latest Benchmark*(1-CPI factor)
            // INFLATION RATE HERE
            const caseYearLIB = targetValue * (1 + data.cpi_factor);
            // incorporate year multiplier
            // const LITarget = (defHHSize / targetHH) * caseYearLIB * 12;
            const LITarget = (defHHSize / targetHH) * caseYearLIB;
            form.setFieldValue(`${segment.id}-target`, LITarget);
            updateCurrentSegmentState({ target: LITarget });
          } else {
            // has benchmark, use the benchmark value
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
      cpiForm,
      messageApi,
      segment.id,
      showBenchmarNotification,
      updateCurrentSegmentState,
    ]
  );

  // handle show new CPI form when segment region not saved into DB yet
  useEffect(() => {
    if (
      (currentCase.year || currentCase.country) &&
      isEmpty(segment?.benchmark) &&
      segment?.region
    ) {
      fetchBenchmark({ region: segment.region });
    }
  }, [
    currentCase?.year,
    currentCase?.country,
    segment?.region,
    segment?.benchmark,
    fetchBenchmark,
    form,
  ]);

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
      [`${segment.id}-new_benchmark_value`]: null,
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
      const benchmarkByCurrency =
        segment.benchmark?.value?.[currentCase?.currency?.toLowerCase()];
      if (!benchmarkByCurrency && !isEmpty(segment?.benchmark?.value?.lcu)) {
        showBenchmarNotification({ currentCase });
        form.setFieldValue(`${segment.id}-new_benchmark_value`, null);
        cpiForm.setFieldValue(`${segment.id}-new_cpi`, null);
        cpiForm.setFieldValue(`${segment.id}-new_inflation_rate`, null);
        cpiForm.setFieldValue(
          `${segment.id}-new_adjusted_benchmark_value`,
          null
        );
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

      // adjust using manual CPI value
      if (
        stepSetIncomeTargetState?.newCPIFactor &&
        isAdjustBenchmarkUsingCPIValuesVisible
      ) {
        const caseYearLIB =
          targetValue * (1 + stepSetIncomeTargetState.newCPIFactor);
        const LITarget =
          (householdSize / segment.benchmark.household_equiv) * caseYearLIB;
        form.setFieldValue(
          "new_benchmark_value",
          `${thousandFormatter(LITarget.toFixed(2))} ${currentCase.currency}`
        );
        updateCurrentSegmentState({
          target: LITarget,
        });
        return;
      }

      // with CPI calculation provide by API
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

  const handleSaveSegment = useCallback(
    ({ allowNavigate = false }) => {
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
            if (allowNavigate) {
              setTimeout(() => {
                navigate(`/case/${currentCase.id}/${stepPath.step2.label}`);
              }, 100);
            }
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
    },
    [
      currentCase.id,
      currentCase.segments,
      prevCaseSegments,
      messageApi,
      navigate,
      enableEditCase,
    ]
  );

  const backFunction = useCallback(() => {
    navigate(-1);
    // navigate("/cases");
  }, [navigate]);

  const nextFunction = useCallback(() => {
    handleSaveSegment({ allowNavigate: true });
  }, [handleSaveSegment]);

  const saveFunction = useCallback(() => {
    handleSaveSegment({ allowNavigate: false });
  }, [handleSaveSegment]);

  useEffect(() => {
    if (setbackfunction) {
      setbackfunction(backFunction);
    }
    if (setnextfunction) {
      setnextfunction(nextFunction);
    }
    if (setsavefunction) {
      setsavefunction(saveFunction);
    }
  }, [
    setbackfunction,
    setnextfunction,
    setsavefunction,
    backFunction,
    nextFunction,
    saveFunction,
  ]);

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

              {greenLIBValue && (
                <>
                  <Col span={24}>
                    <Card className="card-income-target-wrapper">
                      <div className="lib-value-wrapper">
                        <Space size={50}>
                          <div className="income-target-value">
                            {greenLIBValue}
                          </div>
                          <div className="income-target-text">
                            Living income benchmark value for a household per
                            year
                          </div>
                        </Space>
                        <div className="lib-text-button-wrapper">
                          {segment?.benchmark?.source ? (
                            <div className="lib-source-text">
                              Source:{" "}
                              <a
                                href={segment.benchmark?.links}
                                target="_blank"
                                rel="noreferrer"
                              >{`${segment.benchmark?.source}`}</a>
                            </div>
                          ) : (
                            ""
                          )}
                          <div className="button-wrapper">
                            <Tooltip
                              title={
                                <>
                                  Living income is the net annual income
                                  required for a household in a particular place
                                  to afford a decent standard of living for all
                                  members of that household. Elements of a
                                  decent standard of living include: food,
                                  water, housing, education, healthcare,
                                  transport, clothing, and other essential needs
                                  including provision for unexpected events. To
                                  find out more, visit{" "}
                                  <a
                                    href="https://www.living-income.com/the-concept"
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    style={{
                                      color: "#fff",
                                      textDecoration: "underline",
                                    }}
                                  >
                                    https://www.living-income.com/the-concept
                                  </a>
                                </>
                              }
                            >
                              <Button
                                icon={<QuestionCircleOutlined />}
                                type="ghost"
                                style={{
                                  color: "#fff",
                                  fontSize: 16,
                                }}
                              />
                            </Tooltip>
                            <Button
                              icon={<FileTextOutlined />}
                              type="ghost"
                              style={{
                                color: "#fff",
                                fontSize: 16,
                              }}
                              onClick={() => {
                                window.open(
                                  "/files/explanation-contextualisation-benchmarks.pdf",
                                  "_blank"
                                );
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>

                  {showInformationAboutLIBCard ? (
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
                  ) : (
                    ""
                  )}
                </>
              )}

              {(stepSetIncomeTargetState.regionOptionStatus === 404 ||
                isBenchmarkNotAvailable) && (
                <Col span={24}>
                  <Alert
                    showIcon
                    type="warning"
                    message="A benchmark for the country is not available; please switch to manual target."
                  />
                </Col>
              )}

              {/* Show adjust benchmark using CPI values */}
              {isAdjustBenchmarkUsingCPIValuesVisible ? (
                <Col span={24}>
                  <p>
                    No living income benchmark is available for the selected
                    year in the case settings. To ensure accuracy, you adjusted
                    the benchmark value using CPI data. The value below reflects
                    your saved adjusted benchmark for a household per year.
                  </p>
                  <div className="adjusted-benchmark-value-wrapper">
                    <Form.Item
                      name={`${segment.id}-new_benchmark_value`}
                      label="New Value"
                    >
                      <Input
                        style={{ width: 200 }}
                        className="disabled-field"
                        disabled
                      />
                    </Form.Item>
                    <Button
                      className="button-green"
                      onClick={() => setNewCpiModalVisible(true)}
                    >
                      <EditOutlined /> Adjust benchmark using CPI values
                    </Button>
                  </div>
                </Col>
              ) : (
                ""
              )}
              {/* EOL Show adjust benchmark using CPI values */}
            </Row>
          </Col>
        );
      default:
        return "";
    }
  };

  return (
    <div id="set-income-target">
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
              <Radio.Group options={yesNoOptions} disabled={!enableEditCase} />
            </Form.Item>
          </Col>
          {renderTargetInput(setTargetYourself)}
        </Row>
      </Form>

      {/* This modal opened when lib year !== case year and benchmark available */}
      <Modal
        open={newCpiModalVisible}
        title="No benchmark available for the year you selected"
        centered
        okText="Save new benchmark value"
        className="adjust-benchmark-modal-wrapper"
        width={700}
        onCancel={() => setNewCpiModalVisible(false)}
        onOk={() => handleOnSaveAdjustedBenchmarkByNewCpi()}
      >
        <p>
          If you still want to use a Living Income Benchmark for the year you
          selected, please manually enter the Consumer Price Index (CPI) for the
          required time period using the link below. Once you enter the value,
          the inflation rate will update, and the benchmark will adjust
          accordingly.
        </p>
        <Form form={cpiForm} layout="vertical">
          <NewCpiForm
            fieldPreffix={`${segment.id}-`}
            adjustedBenchmarkValueFieldProps={{ style: { width: 300 } }}
          />
        </Form>
      </Modal>
    </div>
  );
};

export default SetIncomeTarget;
