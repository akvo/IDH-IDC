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

const AdjustIncomeTarget = ({ selectedSegment }) => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const { sensitivityAnalysis } = CaseVisualState.useState((s) => s);
  const { enableEditCase } = CaseUIState.useState((s) => s.general);

  const [showAdjustIncomeModal, setShowAdjustIncomeModal] = useState(false);
  const [percentageSensitivity, setPercentageSensitivity] = useState(true);
  const [adjustedValues, setAdjustedValues] = useState({});

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

  const onChangePercentage = (value) => {
    if (value === "percentage") {
      setPercentageSensitivity(true);
    } else {
      setPercentageSensitivity(false);
    }
  };

  return (
    <div>
      <Card className="card-section-wrapper adjust-income-target-wrapper">
        <Row gutter={[20, 14]} align="middle">
          <Col span={12}>
            <div className="title">Adjust your income target</div>
          </Col>
          <Col span={12} align="end">
            <Button
              className="button-ghost-white"
              onClick={() => setShowAdjustIncomeModal(true)}
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
        </Row>
      </Card>

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
    </div>
  );
};

export default AdjustIncomeTarget;
