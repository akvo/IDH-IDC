import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  stepPath,
  CurrentCaseState,
  CaseVisualState,
  CaseUIState,
} from "../store";
import {
  Row,
  Col,
  Card,
  Space,
  Carousel,
  Form,
  Button,
  Select,
  Switch,
  message,
  Modal,
  InputNumber,
} from "antd";
import {
  ChartBiggestImpactOnIncome,
  ChartMonetaryImpactOnIncome,
  ChartBinningDriversSensitivityAnalysis,
  ChartBinningHeatmapSensitivityAnalysis,
} from "../visualizations";
import { BinningDriverForm, SegmentSelector } from "../components";
import { map, groupBy, isEqual, isEmpty } from "lodash";
import { commodities } from "../../../store/static";
import { selectProps, api } from "../../../lib";
import {
  removeUndefinedObjectValue,
  InputNumberThousandFormatter,
  determineDecimalRound,
} from "../../../lib";
import { thousandFormatter } from "../../../components/chart/options/common";

/**
 * STEP 4
 */
const AssessImpactMitigationStrategies = ({
  setbackfunction,
  setnextfunction,
}) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const currentCase = CurrentCaseState.useState((s) => s);
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);
  const { sensitivityAnalysis, prevSensitivityAnalysis } =
    CaseVisualState.useState((s) => s);
  const { enableEditCase } = CaseUIState.useState((s) => s.general);

  const [selectedSegment, setSelectedSegment] = useState(null);
  const [showAdjustIncomeModal, setShowAdjustIncomeModal] = useState(false);
  const [percentageSensitivity, setPercentageSensitivity] = useState(true);
  const [adjustedValues, setAdjustedValues] = useState({});

  const [messageApi, contextHolder] = message.useMessage();

  // initial load adjusted income target
  useEffect(() => {
    if (!isEmpty(sensitivityAnalysis?.config)) {
      setAdjustedValues(
        Object.keys(sensitivityAnalysis?.config)
          .filter((x) => x.includes("adjusted-target"))
          .map((x) => ({ [x]: sensitivityAnalysis.config[x] }))
          .reduce((a, c) => ({ ...a, ...c }), {})
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adustedTargetChange = useMemo(() => {
    if (percentageSensitivity) {
      const res =
        adjustedValues?.[
          `${selectedSegment}_absolute-increase_adjusted-target`
        ] || 0;
      return thousandFormatter(res, 2);
    }
    const res =
      adjustedValues?.[
        `${selectedSegment}_percentage-increase_adjusted-target`
      ] || 0;
    return `${res}%`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSegment, percentageSensitivity, adjustedValues]);

  const currentSegmentDetail = useMemo(() => {
    if (selectedSegment && currentCase?.segments?.length) {
      const res = currentCase.segments.find((s) => s.id === selectedSegment);
      return res;
    }
    return null;
  }, [currentCase?.segments, selectedSegment]);

  const handleSaveVisualization = useCallback(() => {
    if (!enableEditCase) {
      return;
    }

    CaseUIState.update((s) => ({
      ...s,
      caseButton: {
        loading: true,
      },
    }));
    const payloads = [sensitivityAnalysis];
    // sensitivity analysis
    const isBinningDataUpdated = !isEqual(
      removeUndefinedObjectValue(prevSensitivityAnalysis?.config),
      removeUndefinedObjectValue(sensitivityAnalysis?.config)
    );
    // Save
    api
      .post(`visualization?updated=${isBinningDataUpdated}`, payloads)
      .then(() => {
        CaseVisualState.update((s) => ({
          ...s,
          prevSensitivityAnalysis: {
            ...sensitivityAnalysis,
          },
        }));
        messageApi.open({
          type: "success",
          content: "Assess impact of mitigation strategies saved successfully.",
        });
        setTimeout(() => {
          navigate(`/case/${currentCase.id}/${stepPath.step5.label}`);
        }, 100);
      })
      .catch((e) => {
        console.error(e);
        const { status, data } = e.response;
        let errorText =
          "Failed to save assess impact of mitigation strategies.";
        if (status === 403) {
          errorText = data.detail;
        }
        messageApi.open({
          type: "error",
          content: errorText,
        });
      })
      .finally(() => {
        CaseUIState.update((s) => ({
          ...s,
          caseButton: {
            loading: false,
          },
        }));
      });
  }, [
    currentCase.id,
    enableEditCase,
    messageApi,
    navigate,
    prevSensitivityAnalysis,
    sensitivityAnalysis,
  ]);

  const onAdjustTarget = (value, qtype) => {
    const currentValue = currentSegmentDetail?.target
      ? parseFloat(currentSegmentDetail.target)
      : 0;
    let newValue = {};
    let adjustedTarget = 0;
    if (qtype === "percentage" && percentageSensitivity) {
      const absoluteValue = value ? (currentValue * value) / 100 : 0;
      adjustedTarget = value ? (absoluteValue + currentValue).toFixed(2) : 0;
      newValue = {
        ...newValue,
        [`${selectedSegment}_absolute-increase_adjusted-target`]:
          parseFloat(adjustedTarget),
        [`${selectedSegment}_percentage-increase_adjusted-target`]: value,
      };
    }
    if (qtype === "absolute" && !percentageSensitivity) {
      adjustedTarget = value || 0;
      const absoluteChanged = value - currentValue;
      const percentage = currentValue ? absoluteChanged / currentValue : 0;
      const percentageIncrease = (percentage * 100).toFixed(2);
      newValue = {
        ...newValue,
        [`${selectedSegment}_percentage-increase_adjusted-target`]:
          parseFloat(percentageIncrease),
        [`${selectedSegment}_absolute-increase_adjusted-target`]:
          absoluteChanged,
      };
    }
    newValue = {
      ...newValue,
      [`${selectedSegment}_adjusted-target`]: parseFloat(adjustedTarget),
    };
    setAdjustedValues((prev) => ({ ...prev, ...newValue }));
  };

  const handleOnSaveAdjustIncomeTarget = () => {
    CaseVisualState.update((s) => ({
      ...s,
      sensitivityAnalysis: {
        ...s.sensitivityAnalysis,
        config: {
          ...s.sensitivityAnalysis.config,
          ...adjustedValues,
        },
      },
    }));
    setShowAdjustIncomeModal(false);
  };

  const backFunction = useCallback(() => {
    navigate(`/case/${currentCase.id}/${stepPath.step3.label}`);
  }, [navigate, currentCase.id]);

  const nextFunction = useCallback(() => {
    handleSaveVisualization();
  }, [handleSaveVisualization]);

  const updateCaseVisualSensitivityAnalysisState = (updatedValue) => {
    CaseVisualState.update((s) => ({
      ...s,
      sensitivityAnalysis: {
        ...s.sensitivityAnalysis,
        ...updatedValue,
      },
    }));
  };

  useEffect(() => {
    if (setbackfunction) {
      setbackfunction(backFunction);
    }
    if (setnextfunction) {
      setnextfunction(nextFunction);
    }
  }, [setbackfunction, setnextfunction, backFunction, nextFunction]);

  const dataSource = useMemo(() => {
    if (!selectedSegment) {
      return [];
    }
    const focusCommodity = currentCase?.case_commodities?.find(
      (cm) => cm.commodity_type === "focus"
    );
    const segmentData = dashboardData.find(
      (segment) => segment.id === selectedSegment
    );
    const answers = segmentData.answers;
    const drivers = answers.filter(
      (answer) => answer.question?.parent_id === 1 && answer.commodityFocus
    );
    const data = map(groupBy(drivers, "question.id"), (d, i) => {
      const currentQuestion = d[0].question;
      const unitName = currentQuestion.unit
        .split("/")
        .map((u) => u.trim())
        .map((u) =>
          u === "crop"
            ? commodities
                .find((c) => c.id === focusCommodity?.commodity)
                ?.name?.toLowerCase() || ""
            : focusCommodity?.[u]
        )
        .join(" / ");
      return {
        key: parseInt(i) - 1,
        name: currentQuestion.text,
        current: d.find((a) => a.name === "current")?.value || 0,
        feasible: d.find((a) => a.name === "feasible")?.value || 0,
        unitName: unitName,
      };
    });
    const currencyUnit = focusCommodity["currency"];
    return [
      ...data,
      {
        key: data.length + 10,
        name: "Diversified Income",
        current: segmentData.total_current_diversified_income,
        feasible: segmentData.total_feasible_diversified_income,
        unitName: currencyUnit,
      },
      {
        key: data.length + 11,
        name: "Total Primary Income",
        current: segmentData.total_current_focus_income?.toFixed() || 0,
        feasible: segmentData.total_feasible_focus_income?.toFixed() || 0,
        unitName: currencyUnit,
      },
      {
        key: data.length + 12,
        name: "Total Income",
        current: segmentData.total_current_income?.toFixed() || 0,
        feasible: segmentData.total_feasible_income?.toFixed() || 0,
        unitName: currencyUnit,
      },
      {
        key: data.length + 13,
        name: "Income Target",
        current: segmentData.target?.toFixed() || 0,
        unitName: currencyUnit,
        render: (i) => {
          <div>test {i}</div>;
        },
      },
    ];
  }, [selectedSegment, dashboardData, currentCase?.case_commodities]);

  const binningValues = useMemo(() => {
    const allBining = Object.keys(sensitivityAnalysis.config);
    const groupBinning = Object.keys(
      groupBy(allBining, (b) => b.split("_")[0])
    ).map((g) => {
      const binning = allBining.filter((b) => b.split("_")[0] === g);
      const binningValue = binning.reduce((acc, b) => {
        const value = sensitivityAnalysis?.config?.[b];
        return {
          ...acc,
          [b.split("_")[1]]: value,
        };
      }, {});
      const selected = [
        "x-axis-driver",
        "y-axis-driver",
        "binning-driver-name",
      ];
      return {
        id: parseInt(g),
        binning: binning,
        values: binningValue,
        selected: selected
          .map((s) => {
            return {
              name: s,
              value: binningValue?.[s],
            };
          })
          .filter((s) => s),
      };
    });
    return groupBinning;
  }, [sensitivityAnalysis.config]);

  const onSensitivityAnalysisValuesChange = (changedValue, allValues) => {
    const objectName = Object.keys(changedValue)[0];
    const [segmentId, valueName] = objectName.split("_");
    const value = changedValue[objectName];

    if (valueName === "x-axis-driver") {
      const dataValue = dataSource.find((d) => d.name === value);
      allValues = {
        ...allValues,
        [`${segmentId}_x-axis-driver`]: dataValue?.name,
        [`${segmentId}_x-axis-min-value`]: dataValue?.current,
        [`${segmentId}_x-axis-max-value`]: dataValue?.feasible,
        [`${segmentId}_x-axis-current-value`]: dataValue?.current,
        [`${segmentId}_x-axis-feasible-value`]: dataValue?.feasible,
      };
    }
    if (valueName === "y-axis-driver") {
      const dataValue = dataSource.find((d) => d.name === value);
      allValues = {
        ...allValues,
        [`${segmentId}_y-axis-driver`]: dataValue?.name,
        [`${segmentId}_y-axis-min-value`]: dataValue?.current,
        [`${segmentId}_y-axis-max-value`]: dataValue?.feasible,
        [`${segmentId}_y-axis-current-value`]: dataValue?.current,
        [`${segmentId}_y-axis-feasible-value`]: dataValue?.feasible,
      };
    }
    if (valueName === "binning-driver-name") {
      const dataValue = dataSource.find((d) => d.name === value);
      allValues = {
        ...allValues,
        [`${segmentId}_binning-driver-name`]: dataValue?.name,
        [`${segmentId}_binning-value-1`]: dataValue?.current,
        [`${segmentId}_binning-value-2`]: dataValue
          ? (dataValue.current + dataValue.feasible) / 2
          : dataValue,
        [`${segmentId}_binning-value-3`]: dataValue?.feasible,
        [`${segmentId}_binning-current-value`]: dataValue?.current,
        [`${segmentId}_binning-feasible-value`]: dataValue?.feasible,
      };
    }
    const filteredValues = Object.entries(allValues).reduce(
      (acc, [key, value]) => {
        if (typeof value !== "undefined" && value !== null) {
          acc[key] = value;
        }
        return acc;
      },
      {}
    );
    updateCaseVisualSensitivityAnalysisState({
      case: currentCase.id,
      config: filteredValues,
    });
    form.setFieldsValue(filteredValues);
  };

  const onChangePercentage = (value) => {
    if (value === "percentage") {
      setPercentageSensitivity(true);
    } else {
      setPercentageSensitivity(false);
    }
  };

  return (
    <Row id="assess-impact-mitigation-strategies" gutter={[24, 24]}>
      {contextHolder}
      <Col span={24} className="header-wrapper">
        <Space direction="vertical">
          <div className="title">
            Assess the impact of mitigation strategies
          </div>
          <div className="description">
            This page enables you to explore various scenarios by adjusting your
            income drivers in different ways across your segments. This allows
            you to understand the potential paths towards improving farmer
            household income
          </div>
        </Space>
      </Col>

      {/* #1 Chart */}
      <Col span={24}>
        <Card className="card-section-wrapper">
          Which drivers have the highest impact on income change?
        </Card>
      </Col>
      {/* Carousel */}
      <Col span={24}>
        <Carousel autoplay>
          <div>
            <ChartBiggestImpactOnIncome />
          </div>
          <div>
            <ChartMonetaryImpactOnIncome />
          </div>
        </Carousel>
      </Col>
      {/* EOL Carousel */}

      {/* #2 Sensitivity Analysis */}
      <Col span={24}>
        <Card className="card-section-wrapper">
          Which pairs of drivers have a strong impact on income?
        </Card>
      </Col>
      <Col span={24}>
        <Card className="card-content-wrapper">
          <Row gutter={[20, 20]}>
            {/* Binning Form */}
            <Col span={24}>
              <SegmentSelector
                selectedSegment={selectedSegment}
                setSelectedSegment={setSelectedSegment}
              />
            </Col>
            <Col span={24}>
              <Form
                name="sensitivity-analysis"
                layout="vertical"
                form={form}
                onValuesChange={onSensitivityAnalysisValuesChange}
                initialValues={sensitivityAnalysis?.config || {}}
              >
                {dashboardData.map((segment, key) => (
                  <BinningDriverForm
                    key={key}
                    selectedSegment={selectedSegment}
                    segment={segment}
                    dataSource={dataSource}
                    selected={
                      binningValues.find((b) => b.id === segment.id)?.selected
                    }
                    hidden={selectedSegment !== segment.id}
                  />
                ))}
              </Form>
            </Col>
            {/* EOL Binning Form */}

            {/* Sensitivity Analysis Chart */}
            <Col span={24}>
              {dashboardData.map((segment) =>
                selectedSegment === segment.id ? (
                  <ChartBinningDriversSensitivityAnalysis
                    key={segment.id}
                    segment={segment}
                    data={sensitivityAnalysis.config}
                    origin={dataSource}
                    setAdjustTargetVisible={() => {}}
                  />
                ) : null
              )}
            </Col>
            <Col span={24}>
              {dashboardData.map((segment) =>
                selectedSegment === segment.id ? (
                  <ChartBinningHeatmapSensitivityAnalysis
                    key={segment.id}
                    segment={segment}
                    data={sensitivityAnalysis.config}
                    origin={dataSource}
                  />
                ) : null
              )}
            </Col>
            {/* EOL Sensitivity Analysis Chart */}
          </Row>
        </Card>
      </Col>
      {/* EOL Sensitivity Analysis */}

      {/* #3 Adjust Income Target */}
      <Col span={24}>
        <Card className="card-section-wrapper adjust-income-target-wrapper">
          <Row gutter={[20, 20]} align="middle">
            <Col span={24}>
              <div className="title">When do we reach the target?</div>
            </Col>
            <Col span={12}>
              <div className="description">
                Based on the selected drivers that are open to change, we run an
                optimization model to search for the minimum required changes in
                order to reach the income target.
              </div>
            </Col>
            <Col span={12}>
              <Space direction="vertical">
                <div className="label">
                  Select the (sub)drivers that you want to include in further
                  analysis:
                </div>
                <Select
                  {...selectProps}
                  options={[]}
                  placeholder="Select driver"
                />
              </Space>
            </Col>
            <Col span={12}>
              <Button
                className="button-ghost-white"
                onClick={() => setShowAdjustIncomeModal(true)}
              >
                Adjust your income target
              </Button>
            </Col>
            <Col span={12}>
              <Space align="center">
                <Switch />
                <div className="label">Stay within feasible ranges?</div>
              </Space>
            </Col>
          </Row>
        </Card>
      </Col>

      <Modal
        title="Adjust your income target"
        open={showAdjustIncomeModal}
        onOk={handleOnSaveAdjustIncomeTarget}
        okButtonProps={{
          disabled: !enableEditCase,
        }}
        okText="Save income target"
        onCancel={() => setShowAdjustIncomeModal(false)}
        width="60%"
        className="adjust-income-target-modal-container"
        maskClosable={false}
        cancelText={null}
        footer={(_, { OkBtn }) => <OkBtn />}
      >
        <div className="description">
          It might be interesting to change your income target after inspecting
          the graphs below to observe how the results vary. If you do not adjust
          the target, we will use the current target value for the calculations
        </div>
        <Row
          align="middle"
          gutter={[20, 20]}
          className="adjust-income-target-step-wrapper"
        >
          <Col span={24}>
            <Space className="step-wrapper" align="center">
              <div className="number">1.</div>
              <div className="label">Changing the target</div>
            </Space>
            <div className="description">
              If you like to change the target, please choose whether you would
              like to express the changes in current values using percentages or
              absolute values.
            </div>
            <div className="description">
              <Row>
                <Col span={8}>
                  <Select
                    style={{ width: "100%" }}
                    options={[
                      {
                        label: "Percentage",
                        value: "percentage",
                      },
                      {
                        label: "Absolute",
                        value: "absolute",
                      },
                    ]}
                    onChange={onChangePercentage}
                    value={percentageSensitivity ? "percentage" : "absolute"}
                  />
                </Col>
              </Row>
            </div>
          </Col>
          <Col span={24}>
            <Space className="step-wrapper" align="center">
              <div className="number">2.</div>
              <div className="label">Adjust current values below</div>
            </Space>
            <div className="description">
              <Row gutter={[20, 20]} align="start">
                <Col span={7}>
                  <div className="input-label">Current Target</div>
                  <div className="current-target-wrapper">
                    {currentSegmentDetail
                      ? thousandFormatter(
                          currentSegmentDetail.target,
                          determineDecimalRound(currentSegmentDetail.target)
                        )
                      : 0}{" "}
                    <small>({currentCase?.currency})</small>
                  </div>
                </Col>
                <Col span={10}>
                  <div className="input-label">
                    {percentageSensitivity ? "% Change" : "Adjusted Target"}
                  </div>
                  {["absolute", "percentage"].map((qtype) => (
                    <div
                      key={qtype}
                      style={{
                        display:
                          qtype !== "percentage" && percentageSensitivity
                            ? "none"
                            : qtype === "percentage" && !percentageSensitivity
                            ? "none"
                            : "",
                      }}
                    >
                      <InputNumber
                        style={{
                          width: "90%",
                        }}
                        addonAfter={qtype === "percentage" ? "%" : ""}
                        {...InputNumberThousandFormatter}
                        controls={false}
                        onChange={(value) => onAdjustTarget(value, qtype)}
                        value={
                          percentageSensitivity
                            ? adjustedValues?.[
                                `${selectedSegment}_percentage-increase_adjusted-target`
                              ]
                            : adjustedValues?.[
                                `${selectedSegment}_adjusted-target`
                              ]
                        }
                      />
                    </div>
                  ))}
                </Col>
                <Col span={7}>
                  <div className="input-label">
                    {percentageSensitivity ? "Adjusted Target" : "% Change"}
                  </div>
                  <div className="adjusted-target-wrapper">
                    {adustedTargetChange}
                  </div>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Modal>
      {/* EOL Adjust Income Target */}
    </Row>
  );
};

export default AssessImpactMitigationStrategies;
