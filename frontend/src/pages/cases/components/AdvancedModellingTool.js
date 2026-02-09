import React, { useState, useEffect, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Space,
  Select,
  Radio,
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

const { Text, Title, Paragraph } = Typography;

const AdvancedModellingTool = () => {
  const { dashboardData, incomeDataDrivers } = CaseVisualState.useState(
    (s) => s
  );

  // For this tool, we focus on the first segment for now
  const segment = useMemo(() => dashboardData?.[0] || {}, [dashboardData]);

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

  const driverKeys = useMemo(
    () => ({
      price: `${ccid}-${qidMap.price}`,
      volume: `${ccid}-${qidMap.volume}`,
      cop: `${ccid}-${qidMap.cop}`,
      land: `${ccid}-${qidMap.land}`,
    }),
    [ccid, qidMap]
  );

  const [modelValues, setModelValues] = useState({
    price: 0,
    volume: 0,
    cop: 0,
    land: 0,
  });

  // Sync initial values from segment data
  useEffect(() => {
    if (segment?.answers) {
      setModelValues({
        price: segment.answers[`feasible-${driverKeys.price}`] || 0,
        volume: segment.answers[`feasible-${driverKeys.volume}`] || 0,
        cop: segment.answers[`feasible-${driverKeys.cop}`] || 0,
        land: segment.answers[`feasible-${driverKeys.land}`] || 0,
      });
    }
  }, [segment, driverKeys]);

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

    const feasibleValue =
      segment?.answers?.[`feasible-${driverKeys[selectedDriver]}`] || 0;
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

  const InputRow = ({ label, field, locked, isCalculationTarget }) => {
    const isModel = activeScenario === "model";
    const displayValue = isModel
      ? field === selectedDriver && calculationResult.value
        ? calculationResult.value
        : modelValues[field]
      : segment?.answers?.[`${activeScenario}-${driverKeys[field]}`] || 0;

    return (
      <Row align="middle" gutter={12} style={{ marginBottom: 16 }}>
        <Col span={14}>
          <Space size={4}>
            <Text strong>{label}</Text>
            <QuestionCircleOutlined
              style={{ color: "#bfbfbf", fontSize: 12 }}
            />
          </Space>
        </Col>
        <Col span={2} align="center">
          {isModel && (
            <Button
              type="text"
              icon={
                locked ? (
                  <LockOutlined style={{ color: "#bfbfbf" }} />
                ) : (
                  <UnlockOutlined style={{ color: "#1890ff" }} />
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
            style={{
              textAlign: "right",
              background:
                !isModel || locked || isCalculationTarget ? "#f5f5f5" : "#fff",
              borderRadius: "8px",
            }}
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

  return (
    <div
      className="advanced-modelling-tool-container"
      style={{ width: "100%" }}
    >
      {/* Header Section */}
      <div
        style={{
          background: "#005a5b",
          padding: "16px 24px",
          borderRadius: "12px",
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "#5a88e5",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          S
        </div>
        <Title level={4} style={{ color: "#fff", margin: 0, fontSize: "20px" }}>
          Fill in values for your scenarios
        </Title>
      </div>

      <Paragraph style={{ marginBottom: 24, fontSize: "14px", color: "#666" }}>
        The model below allows you to calculate the required price, cost of
        production, or volume needed to close the income gap, based on all other
        income drivers set at current, feasible, or manually defined levels. You
        can use the model to explore different scenarios and see how changes
        affect each of the three key drivers.
      </Paragraph>

      <Row gutter={[32, 32]}>
        {/* Left Panel */}
        <Col span={9}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
              <Text
                type="secondary"
                style={{ display: "block", marginBottom: 8 }}
              >
                Select the driver you want to model:
              </Text>
              <Select
                value={selectedDriver}
                onChange={setSelectedDriver}
                style={{ width: "100%" }}
                options={selectOptions}
              />
            </div>

            <Radio.Group
              value={activeScenario}
              onChange={(e) => setActiveScenario(e.target.value)}
              buttonStyle="solid"
              className="scenario-selector-group"
              style={{ width: "100%", display: "flex", gap: "10px" }}
            >
              {["current", "feasible", "model"].map((s) => (
                <Radio.Button
                  key={s}
                  value={s}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    borderRadius: "8px",
                    border: "1px solid #d9d9d9",
                    height: "40px",
                    lineHeight: "38px",
                    fontWeight: "bold",
                    textTransform: "capitalize",
                  }}
                >
                  {s}
                </Radio.Button>
              ))}
            </Radio.Group>

            <Card
              className="modelling-inputs-card"
              style={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}
              bodyStyle={{ padding: "16px" }}
            >
              <InputRow
                label={driverLabels.price || "Price"}
                field="price"
                locked={lockedFields.price}
                isCalculationTarget={selectedDriver === "price"}
              />
              <InputRow
                label={driverLabels.volume || "Volume"}
                field="volume"
                locked={lockedFields.volume}
                isCalculationTarget={selectedDriver === "volume"}
              />
              <InputRow
                label={driverLabels.land || "Land"}
                field="land"
                locked={lockedFields.land}
                isCalculationTarget={selectedDriver === "land"}
              />
              <InputRow
                label="Diversified Income"
                field="odi"
                locked={lockedFields.odi}
              />

              <Divider style={{ margin: "16px 0" }} />

              <Row gutter={12}>
                <Col span={14}>
                  <Text
                    type="secondary"
                    size="small"
                    style={{ fontSize: "12px" }}
                  >
                    Required {driverLabels[selectedDriver] || selectedDriver}
                  </Text>
                  <Input
                    value={thousandFormatter(calculationResult.value, 2)}
                    readOnly
                    suffix={
                      calculationResult.change ? (
                        <div
                          style={{
                            background:
                              calculationResult.change < 0
                                ? "#f6ffed"
                                : "#fff1f0",
                            color:
                              calculationResult.change < 0
                                ? "#52c41a"
                                : "#f5222d",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            border: `1px solid ${
                              calculationResult.change < 0
                                ? "#b7eb8f"
                                : "#ffa39e"
                            }`,
                          }}
                        >
                          {calculationResult.change > 0 ? "+" : ""}
                          {calculationResult.change.toFixed(0)}%
                        </div>
                      ) : null
                    }
                    style={{
                      borderRadius: "8px",
                      marginTop: 4,
                      background: "#f5f5f5",
                    }}
                  />
                </Col>
                <Col span={10}>
                  <Text
                    type="secondary"
                    size="small"
                    style={{ fontSize: "12px" }}
                  >
                    Feasible value
                  </Text>
                  <Input
                    value={thousandFormatter(
                      segment?.answers?.[
                        `feasible-${driverKeys[selectedDriver]}`
                      ] || 0,
                      2
                    )}
                    style={{
                      borderRadius: "8px",
                      marginTop: 4,
                      background: "#f5f5f5",
                    }}
                    disabled
                  />
                </Col>
              </Row>

              <Row gutter={12} style={{ marginTop: 24 }}>
                <Col span={10}>
                  <Button
                    block
                    shape="round"
                    style={{ fontWeight: "bold" }}
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
                    style={{
                      background: "#005a5b",
                      borderColor: "#005a5b",
                      fontWeight: "bold",
                    }}
                  >
                    Calculate
                  </Button>
                </Col>
              </Row>
            </Card>
          </Space>
        </Col>

        {/* Right Panel */}
        <Col span={15}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Card
              bordered={false}
              style={{
                borderRadius: "12px",
                border: "1px solid #f0f0f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
              bodyStyle={{
                minHeight: 350,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fff",
                borderRadius: "12px",
                padding: "12px 20px",
              }}
            >
              <EquationVisualizer
                selectedDriver={selectedDriver}
                labels={driverLabels}
              />
            </Card>

            <Card
              bordered={false}
              style={{
                borderRadius: "12px",
                border: "1px solid #f0f0f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
              bodyStyle={{ padding: "10px 24px 20px 24px" }}
            >
              <div style={{ padding: "0" }}>
                <Title level={3} style={{ color: "#005a5b", marginBottom: 8 }}>
                  {driverLabels[selectedDriver] || selectedDriver} breakdown
                </Title>
                <Text style={{ color: "#666" }}>
                  The bar below breaks down the{" "}
                  {driverLabels[selectedDriver] || selectedDriver} for the
                  selected scenario. Orange shows how much of the{" "}
                  {driverLabels[selectedDriver] || selectedDriver} covers
                  production costs. Green shows how much profit farmers earn per
                  unit.
                </Text>

                <div style={{ marginTop: 32, position: "relative" }}>
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
                        <Row
                          style={{
                            height: 48,
                            borderRadius: "8px",
                            overflow: "hidden",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                          }}
                        >
                          <Col
                            style={{
                              width: `${costPerc}%`,
                              background: "#fa8c16",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "width 0.5s ease",
                            }}
                          >
                            <Text
                              strong
                              style={{ color: "#fff", fontSize: "16px" }}
                            >
                              {thousandFormatter(calculationResult.cost, 0)}
                            </Text>
                          </Col>
                          <Col
                            style={{
                              width: `${profitPerc}%`,
                              background: "#005a5b",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "width 0.5s ease",
                            }}
                          >
                            <Text
                              strong
                              style={{ color: "#fff", fontSize: "16px" }}
                            >
                              {thousandFormatter(calculationResult.profit, 0)}
                            </Text>
                          </Col>
                        </Row>
                      );
                    })()
                  ) : (
                    <div
                      style={{
                        height: 48,
                        background: "#f5f5f5",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text type="secondary">
                        Click Calculate to see the breakdown
                      </Text>
                    </div>
                  )}
                  <Row justify="space-between" style={{ marginTop: 8 }}>
                    <Text strong type="secondary">
                      Cost
                    </Text>
                    <Text strong type="secondary">
                      Profit
                    </Text>
                  </Row>
                </div>
              </div>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default AdvancedModellingTool;
