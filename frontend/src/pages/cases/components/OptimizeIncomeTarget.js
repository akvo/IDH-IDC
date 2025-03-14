import React, { useMemo, useState, useRef } from "react";
import { Button, Card, Col, InputNumber, Row, Space, Modal } from "antd";
import { ArrowRightOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import AllDriverTreeSelector from "./AllDriverTreeSelector";
import { CaseVisualState, CurrentCaseState } from "../store";
import { thousandFormatter } from "../../../components/chart/options/common";
import { api, flatten } from "../../../lib";
import VisualCardWrapper from "./VisualCardWrapper";
import Chart from "../../../components/chart";
import { commodities } from "../../../store/static";
import { orderBy, uniqBy } from "lodash";

const colors = [
  "#05615e", // green,
  "#fecb21", // yellow,
  "#fecb21", // blue,
  "#ffcea4", // pink
];

const unitName = ({ currentCase, question, group }) => {
  return question.unit
    .split("/")
    .map((u) => u.trim())
    .map((u) => {
      if (u === "currency") {
        return currentCase?.currency || "";
      }
      return u === "crop"
        ? commodities
            .find(
              (c) => c.id === group?.commodity_id || c.id === group?.commodity
            )
            ?.name?.toLowerCase() || ""
        : group?.[u];
    })
    .join("/");
};

const OptimizeIncomeTarget = ({ selectedSegment }) => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const questionGroups = CaseVisualState.useState((s) => s.questionGroups);
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);
  const sensitivityAnalysis = CaseVisualState.useState(
    (s) => s.sensitivityAnalysis
  );
  const optimizationModelState =
    sensitivityAnalysis?.config?.optimizationModel || {};
  const { selectedDrivers, increaseValues, optimizationResult } =
    optimizationModelState;

  const [showModelDetail, setShowModelDetail] = useState(false);
  const [refreshChart, setRefreshChart] = useState(true);
  const [showLabel, setShowLabel] = useState(false);
  const chartRef = useRef(null);

  /*
    increaseValues example
    {
      "percentage-increase-1": null,
      "absolute-increase-1": 0,
      "percentage-increase-2": null,
      "absolute-increase-2": 0,
      "percentage-increase-3": null,
      "absolute-increase-3": 0,
    }
  */

  const currency = currentCase?.currency || "";

  const updateOptimizationModelState = (updatedValue) => {
    CaseVisualState.update((s) => ({
      ...s,
      sensitivityAnalysis: {
        ...s.sensitivityAnalysis,
        config: {
          ...s.sensitivityAnalysis.config,
          optimizationModel: {
            ...s.sensitivityAnalysis.config.optimizationModel,
            ...updatedValue,
          },
        },
      },
    }));
  };

  const currentDashboardData = useMemo(() => {
    return dashboardData.find((d) => d.id === selectedSegment);
  }, [selectedSegment, dashboardData]);

  const handleChangeSelectedDrivers = (val) => {
    updateOptimizationModelState({ selectedDrivers: val });
  };

  const handleChangeIncreaseValues = ({ index, percentage }) => {
    const percentageField = `percentage-increase-${index}`;
    const absoluteKey = `absolute-increase-${index}`;

    const currentIncome = currentDashboardData?.total_current_income || 0;
    let absoluteIncreaseValue = currentIncome;
    if (percentage) {
      absoluteIncreaseValue = currentIncome * (1 + percentage / 100);
    }
    updateOptimizationModelState({
      increaseValues: {
        ...increaseValues,
        [percentageField]: percentage,
        [absoluteKey]: absoluteIncreaseValue,
      },
    });
  };

  const handleRunModel = () => {
    const percentages = Object.entries(increaseValues)
      .map(([key, value]) => {
        if (key.includes("percentage-") && value) {
          return value / 100;
        }
        return null;
      })
      .filter((x) => x);
    const payload = {
      percentages,
      editable_indices: selectedDrivers,
    };
    api
      .post(`optimize/run-model/${currentCase.id}/${selectedSegment}`, payload)
      .then((res) => {
        const { data } = res;
        updateOptimizationModelState({
          optimizationResult: data,
        });
        setRefreshChart(true);
      });
  };

  const flattenedQuestionGroups = questionGroups.flatMap((group) => {
    const questions = group ? flatten(group.questions) : [];
    return questions.map((q) => ({
      ...q,
      commodity_id: group.commodity_id,
    }));
  });

  const chartData = useMemo(() => {
    if (optimizationResult) {
      const { optimization_result } = optimizationResult;
      const optimizedValues = orderBy(optimization_result, "key");
      const drivers = optimizedValues?.flatMap(
        (v) => v?.value?.optimization
      )?.[0];

      const labels = {};
      Object.keys(drivers).forEach((key) => {
        const [caseCommodityId, qid] = key.split("-");
        const question = flattenedQuestionGroups.find(
          (q) => q.id === parseInt(qid)
        );
        const caseCommodity = currentCase?.case_commodities?.find(
          (c) => c.id === parseInt(caseCommodityId)
        );
        const unit = unitName({
          currentCase,
          question: question,
          group: caseCommodity,
        });
        labels[key] = `${question.text}${
          unit && unit !== "" ? ` (${unit})` : ""
        }`;
      });

      const data = Object.entries(labels).map(([key, label]) => {
        const currentValues = [];
        const increasedValues = optimizedValues.map((val) => {
          const valueTmp = val.value.optimization[key];
          const currentValue =
            valueTmp.find((v) => v.name === "current")?.value || 0;

          const optimizedValue =
            valueTmp.find((v) => v.name === "optimized")?.value || 0;
          const optimizedPercentage = currentValue
            ? (optimizedValue / currentValue) * 100
            : currentValue;

          currentValues.push({
            key,
            name: "Current",
            absolute: thousandFormatter(currentValue, 2),
            value: currentValue ? "100" : 0,
            color: colors[0],
          });

          return {
            key,
            name: `Increase ${val.key}`,
            absolute: thousandFormatter(optimizedValue, 2),
            value: thousandFormatter(optimizedPercentage, 2),
            color: colors[val.key],
          };
        });
        return {
          key,
          name: label,
          data: [...uniqBy(currentValues, key), ...increasedValues],
        };
      });
      setRefreshChart(false);
      return data;
    }
    setRefreshChart(false);
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshChart, currentCase]);

  return (
    <Row gutter={[24, 24]}>
      <Col span={24}>
        <Card className="card-section-wrapper optimize-income-target-wrapper">
          <Row gutter={[20, 20]}>
            <Col span={24}>
              <div className="title">
                What is the best way to increase income within feasible ranges?
              </div>
              <div className="description">
                Below we provide an optimisation model that helps you determine
                the most effective way to increase income by adjusting key
                income drivers while keeping changes within feasible limits.
              </div>
            </Col>
            <Col span={24} className="optimize-income-target-step-wrapper">
              <Space className="step-wrapper" align="center">
                <div className="number">1.</div>
                <div className="label">
                  Select the drivers you can influence
                </div>
              </Space>
              <div className="description">
                You can enter up to 3 scenario’s.
              </div>
              <div>
                <AllDriverTreeSelector
                  multiple={true}
                  maxLength={3}
                  style={{ width: "45%" }}
                  dropdownStyle={{ width: "60%" }}
                  onChange={handleChangeSelectedDrivers}
                  value={selectedDrivers}
                />
              </div>
            </Col>
            <Col span={24} className="optimize-income-target-step-wrapper">
              <Space className="step-wrapper" align="center">
                <div className="number">2.</div>
                <div className="label">
                  Set your improved income by choosing a percentage increase in
                  current income to close the feasible income gap
                </div>
              </Space>
              <div className="income-inputs-wrapper">
                <div>
                  <label>Current income</label>
                  <InputNumber
                    controls={false}
                    value={thousandFormatter(
                      currentDashboardData?.total_current_income || 0,
                      2
                    )}
                    addonAfter={currency}
                    readOnly={true}
                  />
                </div>
                <div>
                  <label>Feasible income</label>
                  <InputNumber
                    controls={false}
                    value={thousandFormatter(
                      currentDashboardData?.total_feasible_income || 0,
                      2
                    )}
                    addonAfter={currency}
                    readOnly={true}
                  />
                </div>
                <div>
                  <label>Increase 1</label>
                  <InputNumber
                    controls={false}
                    addonAfter="%"
                    onChange={(value) =>
                      handleChangeIncreaseValues({
                        index: 1,
                        percentage: value,
                      })
                    }
                    value={increaseValues?.["percentage-increase-1"] || null}
                  />
                  {increaseValues?.["percentage-increase-1"] && (
                    <span>
                      {thousandFormatter(
                        increaseValues?.["absolute-increase-1"],
                        2
                      )}{" "}
                      {currency}
                    </span>
                  )}
                </div>
                <div>
                  <label>Increase 2</label>
                  <InputNumber
                    controls={false}
                    addonAfter="%"
                    onChange={(value) =>
                      handleChangeIncreaseValues({
                        index: 2,
                        percentage: value,
                      })
                    }
                    value={increaseValues?.["percentage-increase-2"] || null}
                  />
                  {increaseValues?.["percentage-increase-2"] && (
                    <span>
                      {thousandFormatter(
                        increaseValues?.["absolute-increase-2"],
                        2
                      )}{" "}
                      {currency}
                    </span>
                  )}
                </div>
                <div>
                  <label>Increase 3</label>
                  <InputNumber
                    controls={false}
                    addonAfter="%"
                    onChange={(value) =>
                      handleChangeIncreaseValues({
                        index: 3,
                        percentage: value,
                      })
                    }
                    value={increaseValues?.["percentage-increase-3"] || null}
                  />
                  {increaseValues?.["percentage-increase-3"] && (
                    <span>
                      {thousandFormatter(
                        increaseValues?.["absolute-increase-3"],
                        2
                      )}{" "}
                      {currency}
                    </span>
                  )}
                </div>
              </div>
            </Col>
            <Col span={24} className="optimize-button-wrapper">
              <Button className="button-clear-optimize-result">
                Clear results
              </Button>
              <Button
                className="button-run-the-model"
                onClick={handleRunModel}
                disabled={!selectedDrivers?.length}
              >
                Run the model <ArrowRightOutlined />
              </Button>
            </Col>
          </Row>
        </Card>
      </Col>
      <Col span={24} style={{ display: chartData?.length ? "" : "none" }}>
        <Card className="card-visual-wrapper">
          <Row gutter={[20, 20]} align="middle">
            <Col span={18}>
              <VisualCardWrapper
                bordered={true}
                title="Optimal driver values to react your target"
                showLabel={showLabel}
                setShowLabel={setShowLabel}
                exportElementRef={chartRef}
                exportFilename="Optimal driver values to react your target"
              >
                <Chart
                  wrapper={false}
                  type="COLUMN-BAR"
                  data={chartData}
                  loading={!chartData?.length}
                  height={window.innerHeight * 0.4}
                  extra={{
                    axisTitle: { y: "Percentage Value" },
                    xAxisLabel: {
                      margin: 20,
                      align: "center",
                    },
                  }}
                  grid={{ bottom: 60, right: 5, left: 70 }}
                  showLabel={showLabel}
                  percentage={true}
                />
              </VisualCardWrapper>
            </Col>
            <Col span={6}>
              <Space direction="vertical">
                <div className="section-title">
                  What is the optimal change in income drivers to maximize
                  income within feasible limits?
                </div>
                <div className="section-description">
                  This graph compares your current income driver values with
                  optimized scenarios, showing how different adjustments
                  influence income. It helps identify which changes lead to the
                  most efficient income increase while staying within feasible
                  ranges.
                  <br />
                  <br />
                  For more details about the model,{" "}
                  <a onClick={() => setShowModelDetail(true)}>click here</a>.
                </div>
              </Space>
            </Col>
          </Row>
        </Card>
      </Col>

      <Modal
        title="About the model"
        open={showModelDetail}
        centered
        width={650}
        onCancel={() => setShowModelDetail(false)}
        className="about-model-modal-container"
        footer={() => (
          <Button
            ghost
            type="primary"
            onClick={() => setShowModelDetail(false)}
          >
            <ArrowLeftOutlined /> Back
          </Button>
        )}
      >
        <>
          <p>
            This analysis compares current and optimized values of key income
            drivers using an optimization model. The model applies a
            mathematical approach to maximize income by adjusting selected
            driver values while ensuring changes stay within feasible ranges.
          </p>
          <p>
            <b>Key considerations</b>
          </p>
          <ul>
            <li>
              Constraints: Each driver has defined boundaries (current and
              feasible levels inserted on the input page). The model ensures
              that the income using the optimized income drivers equals the
              desired income level.
            </li>
            <li>
              Editable Drivers: Only selected income drivers are changed during
              optimization. The remaining income drivers remain at their current
              levels.
            </li>
            <li>
              Penalty Factor: The model includes a penalty system to avoid
              extreme deviations from the current values, ensuring the changes
              are realistic and practical.
            </li>
          </ul>
          <p>
            Please note that optimization is a guide, not a certainty: This
            optimization serves as a tool to explore income improvement
            strategies, but it does not provide a definitive solution. When
            making decisions, consider external factors and external influences
            that the model cannot capture.
          </p>
        </>
      </Modal>
    </Row>
  );
};

export default OptimizeIncomeTarget;
