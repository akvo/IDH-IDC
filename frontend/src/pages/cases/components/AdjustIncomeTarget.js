import React, { useEffect, useState, useMemo } from "react";
import { CurrentCaseState, CaseVisualState, CaseUIState } from "../store";
import {
  Row,
  Col,
  Card,
  Space,
  Button,
  Select,
  Modal,
  InputNumber,
} from "antd";
import { isEmpty } from "lodash";
import {
  InputNumberThousandFormatter,
  determineDecimalRound,
} from "../../../lib";
import { thousandFormatter } from "../../../components/chart/options/common";

const AdjustIncomeTarget = ({
  selectedSegment,
  buttonView = false,
  onlyClosingGap = false,
  inlineView = false,
  layout = "default", // default, horizontal
  disabled = false,
}) => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const { sensitivityAnalysis } = CaseVisualState.useState((s) => s);
  const { enableEditCase, enableAdvancedTools } = CaseUIState.useState(
    (s) => s.general
  );

  const [showAdjustIncomeModal, setShowAdjustIncomeModal] = useState(false);
  const [calculationType, setCalculationType] = useState(
    onlyClosingGap ? "closing_gap" : "percentage"
  );
  const [adjustedValues, setAdjustedValues] = useState({});

  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);

  const currentSegmentData = useMemo(() => {
    return dashboardData.find((s) => s.id === selectedSegment);
  }, [dashboardData, selectedSegment]);

  const currentIncome = useMemo(() => {
    return currentSegmentData?.total_current_income || 0;
  }, [currentSegmentData]);

  // initial load adjusted income target
  useEffect(() => {
    if (onlyClosingGap) {
      setCalculationType("closing_gap");
    }
  }, [onlyClosingGap]);

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
  }, [sensitivityAnalysis?.config]);

  const currentSegmentDetail = useMemo(() => {
    if (selectedSegment && currentCase?.segments?.length) {
      const res = currentCase.segments.find((s) => s.id === selectedSegment);
      return res;
    }
    return null;
  }, [currentCase?.segments, selectedSegment]);

  const adustedTargetChange = useMemo(() => {
    if (calculationType === "percentage") {
      const res =
        adjustedValues?.[
          `${selectedSegment}_absolute-increase_adjusted-target`
        ] || 0;
      return thousandFormatter(res, 2);
    }
    if (calculationType === "absolute") {
      const res =
        adjustedValues?.[
          `${selectedSegment}_percentage-increase_adjusted-target`
        ] || 0;
      return `${res}%`;
    }
    const res =
      adjustedValues?.[`${selectedSegment}_adjusted-target`] ||
      currentSegmentDetail?.target ||
      0;
    return thousandFormatter(res, 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSegment, calculationType, adjustedValues]);

  const adjustedIncomeTarget = useMemo(() => {
    const adjustedTarget =
      sensitivityAnalysis?.config?.[`${selectedSegment}_adjusted-target`];

    let res = adjustedTarget;
    if (!res) {
      const currentTarget =
        currentCase?.segments?.find((sg) => sg.id === selectedSegment)
          ?.target || 0;
      res = currentTarget;
    }

    const percentAdjustedTarget =
      sensitivityAnalysis?.config?.[
        `${selectedSegment}_percentage-increase_adjusted-target`
      ];

    return {
      value: thousandFormatter(res, 2),
      percent: percentAdjustedTarget ? percentAdjustedTarget : 0,
    };
  }, [selectedSegment, sensitivityAnalysis?.config, currentCase?.segments]);

  const onAdjustTarget = (value, qtype) => {
    const currentValue = currentSegmentDetail?.target
      ? parseFloat(currentSegmentDetail.target)
      : 0;
    let newValue = {};
    let adjustedTarget = 0;

    if (qtype === "percentage" && calculationType === "percentage") {
      const absoluteValue = value ? (currentValue * value) / 100 : 0;
      adjustedTarget = value ? (absoluteValue + currentValue).toFixed(2) : 0;
      newValue = {
        ...newValue,
        [`${selectedSegment}_absolute-increase_adjusted-target`]:
          parseFloat(adjustedTarget),
        [`${selectedSegment}_percentage-increase_adjusted-target`]: value,
      };
    }
    if (qtype === "absolute" && calculationType === "absolute") {
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
    if (qtype === "closing_gap" && calculationType === "closing_gap") {
      const gap = currentValue - currentIncome;
      adjustedTarget = value
        ? (currentIncome + (value / 100) * gap).toFixed(2)
        : currentIncome;
      newValue = {
        ...newValue,
        [`${selectedSegment}_closing-gap-percentage_adjusted-target`]: value,
      };
    }

    newValue = {
      ...newValue,
      [`${selectedSegment}_adjusted-target`]: parseFloat(adjustedTarget),
    };
    setAdjustedValues((prev) => ({ ...prev, ...newValue }));
    if (inlineView) {
      handleOnSaveAdjustIncomeTarget({ updatedValue: newValue });
    }
  };

  const handleOnSaveAdjustIncomeTarget = ({ updatedValue = {} }) => {
    CaseVisualState.update((s) => ({
      ...s,
      sensitivityAnalysis: {
        ...s.sensitivityAnalysis,
        config: {
          ...s.sensitivityAnalysis.config,
          ...adjustedValues,
          ...updatedValue,
        },
      },
    }));
    setShowAdjustIncomeModal(false);
  };

  const onChangeCalculationType = (value) => {
    setCalculationType(value);
  };

  const renderView = () => {
    if (layout === "horizontal") {
      const qtype = calculationType;
      return (
        <Space size={12} className="adjust-income-target-horizontal-wrapper">
          <div className="input-label" style={{ whiteSpace: "nowrap" }}>
            The income gap to be closed by:
          </div>
          <InputNumber
            style={{
              width: 100,
              borderRadius: 8,
              height: 32,
              display: "flex",
              alignItems: "center",
            }}
            addonAfter="%"
            {...InputNumberThousandFormatter}
            controls={false}
            onChange={(value) => onAdjustTarget(value, qtype)}
            value={
              adjustedValues?.[
                `${selectedSegment}_closing-gap-percentage_adjusted-target`
              ]
            }
            disabled={disabled}
          />
          <div className="new-target-text" style={{ whiteSpace: "nowrap" }}>
            New target:{" "}
            <b>
              {adjustedIncomeTarget.value} {currentCase?.currency || "LCU"}
            </b>
          </div>
        </Space>
      );
    }

    if (inlineView) {
      const qtype = calculationType;
      return (
        <div className="adjust-income-target-inline-wrapper">
          <div className="input-label" style={{ marginBottom: 8 }}>
            The income gap to be closed by:
          </div>
          <InputNumber
            style={{
              width: "100%",
              borderRadius: 8,
              height: 40,
              display: "flex",
              alignItems: "center",
            }}
            addonAfter="%"
            {...InputNumberThousandFormatter}
            controls={false}
            onChange={(value) => onAdjustTarget(value, qtype)}
            value={
              adjustedValues?.[
                `${selectedSegment}_closing-gap-percentage_adjusted-target`
              ]
            }
            disabled={disabled}
          />
          <div className="new-target-text">
            New target:{" "}
            <b>
              {adjustedIncomeTarget.value} {currentCase?.currency || "LCU"}
            </b>
          </div>
        </div>
      );
    }

    if (buttonView) {
      return (
        <Row gutter={[20, 20]} className="adjust-income-target-wrapper">
          <Col span={24} align="end">
            <Button
              className="button-ghost-white"
              onClick={() => setShowAdjustIncomeModal(true)}
              style={{ float: "right" }}
            >
              Adjust your income target
            </Button>
          </Col>
          <Col span={24} align="end">
            <span
              className="adjusted-income-target-value-wrapper"
              style={{ float: "right" }}
            >
              Adjusted income target: {adjustedIncomeTarget.value}{" "}
              {currentCase?.currency || ""} ({adjustedIncomeTarget.percent}%)
            </span>
          </Col>
        </Row>
      );
    }

    return (
      <Card className="card-section-wrapper adjust-income-target-wrapper">
        <Row gutter={[20, 14]} align="middle">
          <Col span={12}>
            <div className="title">Adjust your income target</div>
          </Col>
          <Col span={12} align="end">
            <Button
              className="button-ghost-white"
              onClick={() => setShowAdjustIncomeModal(true)}
              style={{ float: "right" }}
            >
              Adjust your income target
            </Button>
          </Col>
          <Col span={24}>
            <div className="description">
              The results in the sensitivity analysis depend significantly on
              the income target value set. When conducting the sensitivity
              analysis, adjusting the income target is recommended to observe
              how the results vary, providing better insight into the
              sensitivity of various income drivers in reaching the income
              target. If you do not adjust the target, we will use the current
              target value for the calculations.
            </div>
          </Col>
          <Col span={24}>
            <span className="adjusted-income-target-value-wrapper">
              Adjusted income target: {adjustedIncomeTarget.value}{" "}
              {currentCase?.currency || ""} ({adjustedIncomeTarget.percent}%)
            </span>
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div>
      {renderView()}
      <Modal
        title="Adjust your income target"
        open={showAdjustIncomeModal}
        onOk={handleOnSaveAdjustIncomeTarget}
        okButtonProps={{
          disabled: !enableEditCase || !enableAdvancedTools,
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
                  {!onlyClosingGap ? (
                    <Select
                      style={{ width: "100%" }}
                      options={[
                        {
                          label: "By Percentage Increase",
                          value: "percentage",
                        },
                        {
                          label: "By Absolute Value",
                          value: "absolute",
                        },
                        {
                          label: "By Closing the Gap %",
                          value: "closing_gap",
                        },
                      ]}
                      onChange={onChangeCalculationType}
                      value={calculationType}
                    />
                  ) : (
                    <b>Closing the Gap Calculation</b>
                  )}
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
                <Col span={6}>
                  <div className="input-label">Current Income</div>
                  <div className="current-target-wrapper">
                    {thousandFormatter(
                      currentIncome,
                      determineDecimalRound(currentIncome)
                    )}{" "}
                    <small>({currentCase?.currency})</small>
                  </div>
                </Col>
                <Col span={6}>
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
                <Col span={6}>
                  <div className="input-label">
                    {calculationType === "percentage"
                      ? "% Change"
                      : calculationType === "absolute"
                      ? "Adjusted Target"
                      : "Close the Gap %"}
                  </div>
                  {["absolute", "percentage", "closing_gap"].map((qtype) => (
                    <div
                      key={qtype}
                      style={{
                        display: qtype !== calculationType ? "none" : "",
                      }}
                    >
                      <InputNumber
                        style={{
                          width: "90%",
                        }}
                        addonAfter={
                          qtype === "percentage" || qtype === "closing_gap"
                            ? "%"
                            : ""
                        }
                        {...InputNumberThousandFormatter}
                        controls={false}
                        onChange={(value) => onAdjustTarget(value, qtype)}
                        disabled={disabled}
                        value={
                          qtype === "percentage"
                            ? adjustedValues?.[
                                `${selectedSegment}_percentage-increase_adjusted-target`
                              ]
                            : qtype === "absolute"
                            ? adjustedValues?.[
                                `${selectedSegment}_adjusted-target`
                              ]
                            : adjustedValues?.[
                                `${selectedSegment}_closing-gap-percentage_adjusted-target`
                              ]
                        }
                      />
                    </div>
                  ))}
                </Col>
                <Col span={6}>
                  <div className="input-label">
                    {calculationType === "absolute"
                      ? "% Change"
                      : "Adjusted Target"}
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
    </div>
  );
};

export default AdjustIncomeTarget;
