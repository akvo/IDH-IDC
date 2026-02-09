import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Space,
  Select,
  Tabs,
  Typography,
  Input,
  Button,
  Divider,
} from "antd";
import {
  LockOutlined,
  UnlockOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { CaseVisualState } from "../store";
import { thousandFormatter } from "../../../components/chart/options/common";
import EquationVisualizer from "./EquationVisualizer";
import { calculateBreakdownDriver } from "../utils/incomeCalculations";
import { selectProps } from "../../../lib";
import SegmentSelector from "./SegmentSelector";

const { Text, Title, Paragraph } = Typography;

const AdvancedModellingTool = () => {
  const { dashboardData, incomeDataDrivers } = CaseVisualState.useState(
    (s) => s
  );

  const [selectedSegmentId, setSelectedSegmentId] = useState(null);

  // Focus on selected segment
  const segment = useMemo(() => {
    if (!selectedSegmentId) {
      return dashboardData?.[0] || {};
    }
    return dashboardData?.find((d) => d.id === selectedSegmentId) || {};
  }, [dashboardData, selectedSegmentId]);

  const [selectedDriver, setSelectedDriver] = useState("cop");
  const [activeScenario, setActiveScenario] = useState("model");
  const [lockedFields, setLockedFields] = useState({
    price: true,
    volume: true,
    land: true,
    earnings: true,
    odi: true,
  });

  const [calculationResult, setCalculationResult] = useState({
    value: 0,
    change: 0,
    cost: 0,
    profit: 0,
  });

  // Find primary commodity QIDs
  const focusCommodityGroup = useMemo(() => {
    const primaryGroup = incomeDataDrivers?.find((d) => d.type === "primary");
    return primaryGroup?.questionGroups?.[0] || {};
  }, [incomeDataDrivers]);

  const ccid = focusCommodityGroup?.id;
  const commodityCategory = focusCommodityGroup?.commodity_category;

  // Determine QIDs based on category from question.csv and docs/INCOME_CALCULATION.md
  const qidMap = useMemo(() => {
    if (commodityCategory === "Livestock") {
      return { price: 42, volume: 41, cop: 43, land: 40 };
    }
    if (commodityCategory === "Aquaculture") {
      return { price: 4, volume: 3, cop: 26, land: 2 };
    }
    // Default for Crop, Timber
    return { price: 4, volume: 3, cop: 5, land: 2 };
  }, [commodityCategory]);

  const [modelValues, setModelValues] = useState({
    price: 0,
    volume: 0,
    cop: 0,
    land: 0,
    odi: 0,
  });

  const getSegmentAnswer = useCallback(
    (scenario, field) => {
      if (field === "odi") {
        return (
          segment?.[`total_${scenario}_diversified_income`] ||
          segment?.[`total_${scenario}_other_income`] ||
          0
        );
      }

      const qid = qidMap[field];
      if (Array.isArray(segment?.answers)) {
        return (
          segment.answers.find(
            (a) => a.name === scenario && a.questionId === qid
          )?.value || 0
        );
      }
      return 0;
    },
    [segment, qidMap]
  );

  // Sync initial values from segment data
  useEffect(() => {
    if (segment) {
      setModelValues({
        price: getSegmentAnswer("feasible", "price"),
        volume: getSegmentAnswer("feasible", "volume"),
        cop: getSegmentAnswer("feasible", "cop"),
        land: getSegmentAnswer("feasible", "land"),
        odi: getSegmentAnswer("feasible", "odi"),
      });
    }
  }, [segment, getSegmentAnswer]);

  const toggleLock = (field) => {
    setLockedFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputChange = (field, value) => {
    setModelValues((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const getTargetIncome = () => {
    // benchmark income for the segment
    const targetIncomeLevel = segment?.income_target_level || 0;

    let diversifiedEarnings = 0;
    if (activeScenario === "model") {
      diversifiedEarnings = modelValues.odi || 0;
    } else {
      diversifiedEarnings = segment?.total_feasible_diversified_income || 0;
    }

    return targetIncomeLevel - diversifiedEarnings;
  };

  const handleCalculate = () => {
    const targetPrimaryIncome = getTargetIncome();
    const drivers = {
      d2: modelValues.land,
      d3: modelValues.volume,
      d4: modelValues.price,
      d5: modelValues.cop,
    };

    const qid = qidMap[selectedDriver];

    const result = calculateBreakdownDriver(targetPrimaryIncome, drivers, qid);

    // Calculate breakdown
    const currentPrice =
      selectedDriver === "price" ? result : modelValues.price;
    const currentVolume =
      selectedDriver === "volume" ? result : modelValues.volume;
    const currentLand = selectedDriver === "land" ? result : modelValues.land;
    const currentCop = selectedDriver === "cop" ? result : modelValues.cop;

    const unitCost =
      currentVolume !== 0 ? (currentCop * currentLand) / currentVolume : 0;
    const profit = currentPrice - unitCost;

    const feasibleValue = getSegmentAnswer("feasible", selectedDriver);
    const change =
      feasibleValue !== 0
        ? ((result - feasibleValue) / feasibleValue) * 100
        : 0;

    setCalculationResult({
      value: result,
      change: change,
      cost: unitCost,
      profit: profit,
    });
  };

  const InputRow = ({
    label,
    field,
    locked,
    isCalculationTarget,
    scenario,
  }) => {
    const isModel = scenario === "model";
    const displayValue = isModel
      ? field === selectedDriver && calculationResult.value
        ? calculationResult.value
        : modelValues[field]
      : getSegmentAnswer(scenario, field);

    return (
      <Row align="middle" gutter={12} className="input-row-wrapper">
        <Col span={14}>
          <Space size={4} className="input-label-row">
            <Text strong>{label}</Text>
            <QuestionCircleOutlined className="input-info-icon" />
          </Space>
        </Col>
        <Col span={2} align="center">
          {isModel && (
            <Button
              type="text"
              icon={
                locked ? (
                  <LockOutlined className="lock-icon" />
                ) : (
                  <UnlockOutlined className="unlock-icon" />
                )
              }
              onClick={() => toggleLock(field)}
            />
          )}
        </Col>
        <Col span={8}>
          <Input
            value={thousandFormatter(displayValue, 2)}
            onChange={(e) => {
              const val = e.target.value.replace(/,/g, "");
              handleInputChange(field, val);
            }}
            disabled={!isModel || locked || isCalculationTarget}
            className="modelling-input"
          />
        </Col>
      </Row>
    );
  };

  const driverLabels = useMemo(() => {
    if (!focusCommodityGroup?.questions) {
      return {};
    }
    const fallbacks = {
      price: "Price",
      volume: "Volume",
      cop: "Cost of Production",
      land: "Land",
    };
    return Object.entries(qidMap).reduce((acc, [key, id]) => {
      const q = focusCommodityGroup.questions.find((q) => q.id === id);
      acc[key] = q ? q.text : fallbacks[key] || key;
      return acc;
    }, {});
  }, [focusCommodityGroup, qidMap]);

  const selectOptions = useMemo(() => {
    if (!focusCommodityGroup?.questions) {
      return [];
    }

    const targetQids = [qidMap.price, qidMap.volume, qidMap.cop];
    const keys = ["price", "volume", "cop"];
    const fallbacks = {
      price: "Price",
      volume: "Volume",
      cop: "Cost of Production",
    };

    return targetQids.map((id, index) => {
      const q = focusCommodityGroup.questions.find((q) => q.id === id);
      const key = keys[index];
      return {
        value: key,
        label: q ? q.text : fallbacks[key] || key,
      };
    });
  }, [focusCommodityGroup, qidMap]);

  const renderModellingInputs = (scenario) => (
    <div className="modelling-inputs-content">
      <InputRow
        label={driverLabels.price || "Price"}
        field="price"
        locked={lockedFields.price}
        isCalculationTarget={selectedDriver === "price"}
        scenario={scenario}
      />
      <InputRow
        label={driverLabels.volume || "Volume"}
        field="volume"
        locked={lockedFields.volume}
        isCalculationTarget={selectedDriver === "volume"}
        scenario={scenario}
      />
      <InputRow
        label={driverLabels.land || "Land"}
        field="land"
        locked={lockedFields.land}
        isCalculationTarget={selectedDriver === "land"}
        scenario={scenario}
      />
      <InputRow
        label="Diversified Income"
        field="odi"
        locked={lockedFields.odi}
        scenario={scenario}
      />

      <Divider className="modelling-divider" />

      <Row gutter={12}>
        <Col span={14} className="required-driver-wrapper">
          <Text className="label-text">
            Required {driverLabels[selectedDriver] || selectedDriver}
          </Text>
          <Input
            value={thousandFormatter(
              activeScenario === scenario ? calculationResult.value : 0,
              2
            )}
            readOnly
            suffix={
              activeScenario === scenario && calculationResult.change ? (
                <div
                  className={`calc-change-tag ${
                    calculationResult.change < 0 ? "success" : "error"
                  }`}
                >
                  {calculationResult.change > 0 ? "+" : ""}
                  {calculationResult.change.toFixed(0)}%
                </div>
              ) : null
            }
            className="result-input"
          />
        </Col>
        <Col span={10} className="feasible-value-wrapper">
          <Text className="label-text">Feasible value</Text>
          <Input
            value={thousandFormatter(
              getSegmentAnswer("feasible", selectedDriver),
              2
            )}
            className="feasible-input"
            disabled
          />
        </Col>
      </Row>

      <Row gutter={12} className="footer-button-row">
        <Col span={10}>
          <Button
            block
            shape="round"
            className="button-clear"
            onClick={() => {
              setCalculationResult({
                value: 0,
                change: 0,
                cost: 0,
                profit: 0,
              });
              setLockedFields({
                price: true,
                volume: true,
                land: true,
                earnings: true,
                odi: true,
              });
            }}
          >
            Clear
          </Button>
        </Col>
        <Col span={14}>
          <Button
            block
            type="primary"
            shape="round"
            onClick={handleCalculate}
            className="button-calculate"
          >
            Calculate
          </Button>
        </Col>
      </Row>
    </div>
  );

  return (
    <Row className="advanced-modelling-tool-container" gutter={[24, 24]}>
      {/* Header Section */}
      <Col span={24}>
        <Card className="card-section-wrapper">
          Fill in values for your scenarios
        </Card>
      </Col>

      <Col span={24}>
        <Paragraph className="tool-description">
          The model below allows you to calculate the required price, cost of
          production, or volume needed to close the income gap, based on all
          other income drivers set at current, feasible, or manually defined
          levels. You can use the model to explore different scenarios and see
          how changes affect each of the three key drivers.
        </Paragraph>
      </Col>

      {/* Segment Selector */}
      <Col span={24}>
        <SegmentSelector
          selectedSegment={selectedSegmentId}
          setSelectedSegment={setSelectedSegmentId}
        />
      </Col>

      <Col span={24}>
        <Row gutter={[24, 24]}>
          {/* Left Panel */}
          <Col span={10}>
            <Space direction="vertical" size="large" className="panel-space">
              <div>
                <Text className="driver-select-label">
                  Select the driver you want to model:
                </Text>
                <Select
                  value={selectedDriver}
                  onChange={setSelectedDriver}
                  options={selectOptions}
                  {...selectProps}
                />
              </div>

              <Tabs
                activeKey={activeScenario}
                onChange={setActiveScenario}
                type="card"
                centered
                className="scenario-tabs-custom"
                items={["current", "feasible", "model"].map((key) => ({
                  key,
                  label: key.charAt(0).toUpperCase() + key.slice(1),
                  children: renderModellingInputs(key),
                }))}
              />
            </Space>
          </Col>

          {/* Right Panel */}
          <Col span={14}>
            <Space direction="vertical" size="middle" className="panel-space">
              <Card bordered={false} className="visualizer-card">
                <EquationVisualizer
                  selectedDriver={selectedDriver}
                  labels={driverLabels}
                />
              </Card>

              <Card bordered={false} className="breakdown-card">
                <div>
                  <Title level={3} className="breakdown-title">
                    {driverLabels[selectedDriver] || selectedDriver} breakdown
                  </Title>
                  <Text className="breakdown-description">
                    The bar below breaks down the{" "}
                    {driverLabels[selectedDriver] || selectedDriver} for the
                    selected scenario. Orange shows how much of the{" "}
                    {driverLabels[selectedDriver] || selectedDriver} covers
                    production costs. Green shows how much profit farmers earn
                    per unit.
                  </Text>

                  <div className="breakdown-chart-wrapper">
                    {/* Real Bar Chart Logic */}
                    {calculationResult.cost || calculationResult.profit ? (
                      (() => {
                        const total =
                          calculationResult.cost + calculationResult.profit;
                        const costPerc =
                          total !== 0
                            ? (calculationResult.cost / total) * 100
                            : 0;
                        const profitPerc = 100 - costPerc;
                        return (
                          <div className="bar-row">
                            <div
                              className="bar-segment cost"
                              style={{ width: `${costPerc}%` }}
                            >
                              <Text className="segment-value">
                                {thousandFormatter(calculationResult.cost, 0)}
                              </Text>
                            </div>
                            <div
                              className="bar-segment profit"
                              style={{ width: `${profitPerc}%` }}
                            >
                              <Text className="segment-value">
                                {thousandFormatter(calculationResult.profit, 0)}
                              </Text>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="empty-bar-placeholder">
                        <Text type="secondary">
                          Click Calculate to see the breakdown
                        </Text>
                      </div>
                    )}
                    <div className="bar-labels-row">
                      <Text className="label-text">Cost</Text>
                      <Text className="label-text">Profit</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Space>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default AdvancedModellingTool;
