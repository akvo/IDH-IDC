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
import { CaseVisualState, CurrentCaseState } from "../store";
import { thousandFormatter } from "../../../components/chart/options/common";
import EquationVisualizer from "./EquationVisualizer";
import { calculateModellingDriver } from "../utils/incomeCalculations";
import { selectProps, flatten } from "../../../lib";
import SegmentSelector from "./SegmentSelector";
import { commodities } from "../../../store/static";
import PriceWhite from "../../../assets/icons/equaion-visualizer/price_white.svg";
import { isEqual } from "lodash";

const { Text, Title, Paragraph } = Typography;

const InputRow = ({
  label,
  field,
  locked,
  isCalculationTarget,
  isModel,
  displayValue,
  toggleLock,
  handleInputChange,
}) => {
  return (
    <Row align="middle" gutter={12} className="input-row-wrapper">
      <Col span={14}>
        <Space size={4} className="input-label-row">
          <Text>{label}</Text>
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

const AdvancedModellingTool = () => {
  const { dashboardData, incomeDataDrivers } = CaseVisualState.useState(
    (s) => s
  );
  const currentCase = CurrentCaseState.useState((s) => s);

  // Initialize state from global store if available
  const advancedModelingConfig = CaseVisualState.useState(
    (s) => s.scenarioModeling?.config?.advancedModeling
  );

  const [selectedSegmentId, setSelectedSegmentId] = useState(
    advancedModelingConfig?.selectedSegmentId || null
  );

  // Focus on selected segment
  const segment = useMemo(() => {
    if (!selectedSegmentId) {
      return dashboardData?.[0] || {};
    }
    return dashboardData?.find((d) => d.id === selectedSegmentId) || {};
  }, [dashboardData, selectedSegmentId]);

  const [selectedDriver, setSelectedDriver] = useState(
    advancedModelingConfig?.selectedDriver || "cop"
  );

  // Helper to get initial data for the current segment
  const getInitialSegmentData = () => {
    const defaultData = {
      activeScenario: "model",
      lockedFields: {
        price: true,
        volume: true,
        land: true,
        cop: true,
        odi: true,
        secondary: true,
        tertiary: true,
      },
      modelValues: {
        price: 0,
        volume: 0,
        cop: 0,
        land: 0,
        odi: 0,
        secondary: 0,
        tertiary: 0,
      },
      calculationResult: {
        value: 0,
        change: 0,
        cost: 0,
        profit: 0,
      },
    };

    if (
      selectedSegmentId &&
      advancedModelingConfig?.segmentData?.[selectedSegmentId]
    ) {
      return {
        ...defaultData,
        ...advancedModelingConfig.segmentData[selectedSegmentId],
      };
    }
    return defaultData;
  };

  const initialData = getInitialSegmentData();

  const [activeScenario, setActiveScenario] = useState(
    initialData.activeScenario
  );
  const [lockedFields, setLockedFields] = useState(initialData.lockedFields);
  const [calculationResult, setCalculationResult] = useState(
    initialData.calculationResult
  );
  const [modelValues, setModelValues] = useState(initialData.modelValues);

  // Sync state to global store (Local -> Global)
  useEffect(() => {
    const currentSegmentData = {
      activeScenario,
      lockedFields,
      modelValues,
      calculationResult,
    };

    CaseVisualState.update((s) => {
      const prevConfig = s.scenarioModeling?.config?.advancedModeling;
      const prevSegmentData =
        prevConfig?.segmentData?.[selectedSegmentId] || {};

      // Check if root config changed (driver/segment)
      const rootChanged =
        prevConfig?.selectedSegmentId !== selectedSegmentId ||
        prevConfig?.selectedDriver !== selectedDriver;

      // Check if segment data changed
      const segmentChanged = !isEqual(prevSegmentData, currentSegmentData);

      if (rootChanged || segmentChanged) {
        return {
          ...s,
          scenarioModeling: {
            ...s.scenarioModeling,
            config: {
              ...s.scenarioModeling.config,
              advancedModeling: {
                selectedSegmentId,
                selectedDriver,
                segmentData: {
                  ...prevConfig?.segmentData,
                  [selectedSegmentId]: currentSegmentData,
                },
              },
            },
          },
        };
      }
      return s;
    });
  }, [
    selectedSegmentId,
    selectedDriver,
    activeScenario,
    lockedFields,
    modelValues,
    calculationResult,
  ]);

  // Sync global store to local state (Global -> Local)
  useEffect(() => {
    if (advancedModelingConfig) {
      // 1. Check Root Config (Segment/Driver)
      if (
        advancedModelingConfig.selectedSegmentId &&
        advancedModelingConfig.selectedSegmentId !== selectedSegmentId
      ) {
        setSelectedSegmentId(advancedModelingConfig.selectedSegmentId);
        // Note: Changing selectedSegmentId will trigger the other effect, but we should probably load data here too?
        // Actually, if we change ID here, the next render will handle data loading if we wire it right.
        // But let's look up data now for atomicity.
        const segmentData =
          advancedModelingConfig.segmentData?.[
            advancedModelingConfig.selectedSegmentId
          ];
        if (segmentData) {
          setActiveScenario(segmentData.activeScenario || "model");
          setLockedFields(segmentData.lockedFields || {});
          setModelValues(segmentData.modelValues || {});
          setCalculationResult(segmentData.calculationResult || {});
        }
      }

      if (
        advancedModelingConfig.selectedDriver &&
        advancedModelingConfig.selectedDriver !== selectedDriver
      ) {
        setSelectedDriver(advancedModelingConfig.selectedDriver);
      }

      // 2. Check Segment Data (for current segment)
      if (selectedSegmentId) {
        const storedData =
          advancedModelingConfig.segmentData?.[selectedSegmentId];
        if (storedData) {
          if (
            storedData.activeScenario &&
            storedData.activeScenario !== activeScenario
          ) {
            setActiveScenario(storedData.activeScenario);
          }
          if (
            storedData.lockedFields &&
            !isEqual(storedData.lockedFields, lockedFields)
          ) {
            setLockedFields(storedData.lockedFields);
          }
          if (
            storedData.modelValues &&
            !isEqual(storedData.modelValues, modelValues)
          ) {
            setModelValues(storedData.modelValues);
          }
          if (
            storedData.calculationResult &&
            !isEqual(storedData.calculationResult, calculationResult)
          ) {
            setCalculationResult(storedData.calculationResult);
          }
        }
      }
    }
  }, [advancedModelingConfig]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Find primary commodity QIDs
  const focusCommodityGroup = useMemo(() => {
    const primaryGroup = incomeDataDrivers?.find((d) => d.type === "primary");
    return primaryGroup?.questionGroups?.[0] || {};
  }, [incomeDataDrivers]);

  const secondaryGroup = useMemo(() => {
    const diversified = incomeDataDrivers?.find(
      (d) => d.type === "diversified"
    );
    return diversified?.questionGroups?.find(
      (qg) => qg.commodity_type === "secondary"
    );
  }, [incomeDataDrivers]);

  const tertiaryGroup = useMemo(() => {
    const diversified = incomeDataDrivers?.find(
      (d) => d.type === "diversified"
    );
    return diversified?.questionGroups?.find(
      (qg) => qg.commodity_type === "tertiary"
    );
  }, [incomeDataDrivers]);

  const flattenedQuestions = useMemo(() => {
    if (!focusCommodityGroup?.questions) {
      return [];
    }
    return flatten(focusCommodityGroup.questions);
  }, [focusCommodityGroup]);

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

  const driverUnits = useMemo(() => {
    if (flattenedQuestions.length === 0) {
      return {};
    }

    return Object.entries(qidMap).reduce((acc, [key, id]) => {
      const q = flattenedQuestions.find((q) => q.id === id);
      if (q?.unit) {
        const unitName = q.unit
          .split("/")
          .map((u) => u.trim())
          .map((u) => {
            if (u === "crop") {
              return (
                commodities
                  .find((c) => c.id === focusCommodityGroup?.commodity_id)
                  ?.name?.toLowerCase() || ""
              );
            }
            return focusCommodityGroup?.[u] || u;
          })
          .join(" / ");
        acc[key] = unitName;
      } else {
        acc[key] = "";
      }
      return acc;
    }, {});
  }, [flattenedQuestions, focusCommodityGroup, qidMap]);

  const getSegmentAnswer = useCallback(
    (scenario, field, targetSegment = segment) => {
      const qidAggregator = 1;

      if (field === "secondary" || field === "tertiary") {
        const group = field === "secondary" ? secondaryGroup : tertiaryGroup;
        if (!group) {
          return 0;
        }
        if (Array.isArray(targetSegment?.answers)) {
          return (
            targetSegment.answers.find(
              (a) =>
                a.name === scenario &&
                a.caseCommodityId === group.id &&
                (a.questionId === qidAggregator ||
                  a.question?.question_type === "aggregator" ||
                  !a.question?.parent)
            )?.value || 0
          );
        }
        return 0;
      }

      if (field === "odi") {
        const totalDiversified =
          targetSegment?.[`total_${scenario}_diversified_income`] ||
          targetSegment?.[`total_${scenario}_other_income`] ||
          0;

        let secondaryVal = 0;
        if (secondaryGroup && Array.isArray(targetSegment?.answers)) {
          secondaryVal =
            targetSegment.answers.find(
              (a) =>
                a.name === scenario &&
                a.caseCommodityId === secondaryGroup.id &&
                (a.questionId === qidAggregator ||
                  a.question?.question_type === "aggregator" ||
                  !a.question?.parent)
            )?.value || 0;
        }

        let tertiaryVal = 0;
        if (tertiaryGroup && Array.isArray(targetSegment?.answers)) {
          tertiaryVal =
            targetSegment.answers.find(
              (a) =>
                a.name === scenario &&
                a.caseCommodityId === tertiaryGroup.id &&
                (a.questionId === qidAggregator ||
                  a.question?.question_type === "aggregator" ||
                  !a.question?.parent)
            )?.value || 0;
        }

        return totalDiversified - secondaryVal - tertiaryVal;
      }

      const qid = qidMap[field];
      if (Array.isArray(targetSegment?.answers)) {
        return (
          targetSegment.answers.find(
            (a) => a.name === scenario && a.questionId === qid
          )?.value || 0
        );
      }
      return 0;
    },
    [segment, qidMap, secondaryGroup, tertiaryGroup]
  );

  // Sync initial values from segment data
  useEffect(() => {
    // Only sync if modelValues are empty/zero (initial load) and we have segment data
    // OR if selectedSegment changes and we want to reset (but here we want persistence?)
    // Actually, if we are loading saved data, we might NOT want to overwrite with segment defaults immediately
    // unless the saved data is empty.

    // Let's rely on the fact that if savedConfig exists, we used that.
    // If not, modelValues is all 0s.
    // So if modelValues is all 0s, populate from feasible.
    const isModelValuesEmpty = Object.values(modelValues).every((v) => v === 0);

    if (segment && isModelValuesEmpty) {
      setModelValues({
        price: getSegmentAnswer("feasible", "price"),
        volume: getSegmentAnswer("feasible", "volume"),
        cop: getSegmentAnswer("feasible", "cop"),
        land: getSegmentAnswer("feasible", "land"),
        odi: getSegmentAnswer("feasible", "odi"),
        secondary: getSegmentAnswer("feasible", "secondary"),
        tertiary: getSegmentAnswer("feasible", "tertiary"),
      });
    }
  }, [segment, getSegmentAnswer]); // eslint-disable-next-line react-hooks/exhaustive-deps
  // Removed modelValues from dependency to avoid infinite loop or overwriting user changes?
  // Added isModelValuesEmpty check to prevent overwriting user input on re-renders if segment changes?
  // Actually, if segment changes, we might want to reload feasible values if the user hasn't started modeling for THAT segment?
  // For now, let's keep it simple: if all 0, load feasible.

  const toggleLock = (field) => {
    setLockedFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputChange = (field, value) => {
    setModelValues((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  // Reset calculation results when driver or segment changes
  useEffect(() => {
    setCalculationResult({
      value: 0,
      change: 0,
      cost: 0,
      profit: 0,
    });
  }, [selectedDriver]);

  const handleSegmentChange = (newSegmentId) => {
    // Check if we already have data for this segment in the store
    const storedData = advancedModelingConfig?.segmentData?.[newSegmentId];

    if (storedData) {
      // Just switch the segment ID in the store
      // Effect 2 will handle loading the data into local state
      CaseVisualState.update((s) => ({
        ...s,
        scenarioModeling: {
          ...s.scenarioModeling,
          config: {
            ...s.scenarioModeling.config,
            advancedModeling: {
              ...s.scenarioModeling.config.advancedModeling,
              selectedSegmentId: newSegmentId,
            },
          },
        },
      }));
    } else {
      // Generate defaults for the new segment
      const newSegment =
        dashboardData?.find((d) => d.id === newSegmentId) || {};

      const defaultModelValues = {
        price: getSegmentAnswer("feasible", "price", newSegment),
        volume: getSegmentAnswer("feasible", "volume", newSegment),
        cop: getSegmentAnswer("feasible", "cop", newSegment),
        land: getSegmentAnswer("feasible", "land", newSegment),
        odi: getSegmentAnswer("feasible", "odi", newSegment),
        secondary: getSegmentAnswer("feasible", "secondary", newSegment),
        tertiary: getSegmentAnswer("feasible", "tertiary", newSegment),
      };

      const defaultCalculationResult = {
        value: 0,
        change: 0,
        cost: 0,
        profit: 0,
      };

      const defaultLockedFields = {
        price: true,
        volume: true,
        land: true,
        cop: true,
        odi: true,
        secondary: true,
        tertiary: true,
      };

      const defaultActiveScenario = "model";

      // Update store with new ID AND new segment data
      CaseVisualState.update((s) => {
        const prevConfig = s.scenarioModeling?.config?.advancedModeling;
        return {
          ...s,
          scenarioModeling: {
            ...s.scenarioModeling,
            config: {
              ...s.scenarioModeling.config,
              advancedModeling: {
                ...prevConfig,
                selectedSegmentId: newSegmentId,
                segmentData: {
                  ...prevConfig?.segmentData,
                  [newSegmentId]: {
                    modelValues: defaultModelValues,
                    calculationResult: defaultCalculationResult,
                    lockedFields: defaultLockedFields,
                    activeScenario: defaultActiveScenario,
                  },
                },
              },
            },
          },
        };
      });
    }
  };

  const getTargetIncome = () => {
    // benchmark income for the segment
    const targetIncomeLevel = segment?.income_target_level || 0;

    let diversifiedEarnings = 0;
    let secondaryEarnings = 0;
    let tertiaryEarnings = 0;

    if (activeScenario === "model") {
      diversifiedEarnings = modelValues.odi || 0;
      secondaryEarnings = modelValues.secondary || 0;
      tertiaryEarnings = modelValues.tertiary || 0;
    } else {
      diversifiedEarnings = getSegmentAnswer(activeScenario, "odi");
      secondaryEarnings = getSegmentAnswer(activeScenario, "secondary");
      tertiaryEarnings = getSegmentAnswer(activeScenario, "tertiary");
    }

    return (
      targetIncomeLevel -
      diversifiedEarnings -
      secondaryEarnings -
      tertiaryEarnings
    );
  };

  const handleCalculate = () => {
    const targetPrimaryIncome = getTargetIncome();

    let drivers = {};
    if (activeScenario === "model") {
      drivers = {
        land: modelValues.land,
        volume: modelValues.volume,
        price: modelValues.price,
        cop: modelValues.cop,
      };
    } else {
      drivers = {
        land: getSegmentAnswer(activeScenario, "land"),
        volume: getSegmentAnswer(activeScenario, "volume"),
        price: getSegmentAnswer(activeScenario, "price"),
        cop: getSegmentAnswer(activeScenario, "cop"),
      };
    }

    const result = calculateModellingDriver(
      targetPrimaryIncome,
      drivers,
      selectedDriver,
      commodityCategory
    );

    // Calculate current scenario values for the breakdown
    const currentPrice = selectedDriver === "price" ? result : drivers.price;
    const currentVolume = selectedDriver === "volume" ? result : drivers.volume;
    const currentLand = drivers.land;
    const currentCop = selectedDriver === "cop" ? result : drivers.cop;

    let unitCost = 0;
    if (commodityCategory === "Aquaculture") {
      unitCost = currentCop;
    } else {
      unitCost =
        currentVolume !== 0 ? (currentCop * currentLand) / currentVolume : 0;
    }
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

  const driverLabels = useMemo(() => {
    if (flattenedQuestions.length === 0) {
      return {};
    }
    const fallbacks = {
      price: "Price",
      volume: "Volume",
      cop: "Cost of Production",
      land: "Land",
    };
    return Object.entries(qidMap).reduce((acc, [key, id]) => {
      const q = flattenedQuestions.find((q) => q.id === id);
      acc[key] = q ? q.text : fallbacks[key] || key;
      return acc;
    }, {});
  }, [flattenedQuestions, qidMap]);

  const selectOptions = useMemo(() => {
    if (flattenedQuestions.length === 0) {
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
      const q = flattenedQuestions.find((q) => q.id === id);
      const key = keys[index];
      return {
        value: key,
        label: q ? q.text : fallbacks[key] || key,
      };
    });
  }, [flattenedQuestions, qidMap]);

  const renderModellingInputs = (scenario) => {
    const isModel = scenario === "model";
    const getDisplayValue = (field) => {
      return isModel
        ? field === selectedDriver && calculationResult.value
          ? calculationResult.value
          : modelValues[field]
        : getSegmentAnswer(scenario, field);
    };

    return (
      <div className="modelling-inputs-content">
        <InputRow
          label={`${driverLabels.price || "Price"}`}
          field="price"
          locked={lockedFields.price}
          isCalculationTarget={selectedDriver === "price"}
          scenario={scenario}
          isModel={isModel}
          displayValue={getDisplayValue("price")}
          toggleLock={toggleLock}
          handleInputChange={handleInputChange}
        />
        <InputRow
          label={`${driverLabels.volume || "Volume"}`}
          field="volume"
          locked={lockedFields.volume}
          isCalculationTarget={selectedDriver === "volume"}
          scenario={scenario}
          isModel={isModel}
          displayValue={getDisplayValue("volume")}
          toggleLock={toggleLock}
          handleInputChange={handleInputChange}
        />
        <InputRow
          label={`${driverLabels.land || "Land"}`}
          field="land"
          locked={lockedFields.land}
          isCalculationTarget={selectedDriver === "land"}
          scenario={scenario}
          isModel={isModel}
          displayValue={getDisplayValue("land")}
          toggleLock={toggleLock}
          handleInputChange={handleInputChange}
        />
        <InputRow
          label={`${driverLabels.cop || "Cost of Production"}`}
          field="cop"
          locked={lockedFields.cop}
          isCalculationTarget={selectedDriver === "cop"}
          scenario={scenario}
          isModel={isModel}
          displayValue={getDisplayValue("cop")}
          toggleLock={toggleLock}
          handleInputChange={handleInputChange}
        />
        {secondaryGroup && (
          <InputRow
            label="Secondary Income"
            field="secondary"
            locked={lockedFields.secondary}
            scenario={scenario}
            isModel={isModel}
            displayValue={getDisplayValue("secondary")}
            toggleLock={toggleLock}
            handleInputChange={handleInputChange}
          />
        )}
        {tertiaryGroup && (
          <InputRow
            label="Tertiary Income"
            field="tertiary"
            locked={lockedFields.tertiary}
            scenario={scenario}
            isModel={isModel}
            displayValue={getDisplayValue("tertiary")}
            toggleLock={toggleLock}
            handleInputChange={handleInputChange}
          />
        )}
        <InputRow
          label="Other Diversified Income"
          field="odi"
          locked={lockedFields.odi}
          scenario={scenario}
          isModel={isModel}
          displayValue={getDisplayValue("odi")}
          toggleLock={toggleLock}
          handleInputChange={handleInputChange}
        />

        <Divider className="modelling-divider" />

        <Row gutter={12} className="modelling-result-row">
          <Col span={24}>
            <Text className="label-text">
              Required {driverLabels[selectedDriver] || selectedDriver} (
              {driverUnits[selectedDriver]})
            </Text>
            <div className="calculation-result-container">
              {activeScenario === scenario && calculationResult.value ? (
                (() => {
                  const feasibleValue = getSegmentAnswer(
                    "feasible",
                    selectedDriver
                  );
                  let isFeasible = false;
                  if (selectedDriver === "cop") {
                    isFeasible = calculationResult.value <= feasibleValue;
                  } else {
                    isFeasible = calculationResult.value >= feasibleValue;
                  }

                  return (
                    <div className="result-display-wrapper">
                      <div
                        className={`result-value-box ${
                          isFeasible ? "feasible" : "not-feasible"
                        }`}
                      >
                        <span className="value-text">
                          {thousandFormatter(calculationResult.value, 2)}
                        </span>
                      </div>
                      <div className="feasibility-status">
                        <span className="status-text">
                          {isFeasible
                            ? "falls within feasible levels"
                            : "outside feasible levels"}
                        </span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="empty-result-placeholder">
                  <Text type="secondary">Click Calculate to see results</Text>
                </div>
              )}
            </div>
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
                  cop: true,
                  odi: true,
                  secondary: true,
                  tertiary: true,
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
  };

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
        <Space direction="vertical" size="small">
          <Text>Select the segment for which you want to model.</Text>
          <SegmentSelector
            selectedSegment={selectedSegmentId}
            setSelectedSegment={handleSegmentChange}
          />
        </Space>
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
                  category={commodityCategory}
                  secondaryLabel={secondaryGroup?.commodity_name}
                  tertiaryLabel={tertiaryGroup?.commodity_name}
                />
              </Card>

              <Card bordered={false} className="breakdown-card">
                <div className="breakdown-header">
                  <Title level={3} className="breakdown-title">
                    Price breakdown
                  </Title>
                  <div className="breakdown-icon-wrapper">
                    <img
                      src={PriceWhite}
                      alt="Price"
                      className="breakdown-icon"
                    />
                  </div>
                </div>

                <div>
                  <Text className="breakdown-description">
                    The bar below breaks down the price for the selected
                    scenario. Orange shows how much of the price covers
                    production costs. Green shows how much profit farmers earn{" "}
                    {selectedDriver === "price" || selectedDriver === "cop"
                      ? `per ${
                          driverUnits.price?.split(" / ")[1] || "unit"
                        } of ${
                          commodities.find(
                            (c) => c.id === focusCommodityGroup?.commodity_id
                          )?.name || "commodity"
                        }`
                      : "for the selected driver"}
                    .
                  </Text>

                  <div className="breakdown-chart-wrapper">
                    <div className="price-total-display">
                      <Text strong>
                        Price:{" "}
                        {calculationResult.cost || calculationResult.profit
                          ? thousandFormatter(
                              calculationResult.cost + calculationResult.profit,
                              2
                            ) +
                            " " +
                            currentCase?.currency
                          : "-"}
                      </Text>
                    </div>

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
                              <span className="segment-value">
                                {thousandFormatter(calculationResult.cost, 2)}
                              </span>
                            </div>
                            <div
                              className="bar-segment profit"
                              style={{ width: `${profitPerc}%` }}
                            >
                              <span className="segment-value">
                                {thousandFormatter(calculationResult.profit, 2)}
                              </span>
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
