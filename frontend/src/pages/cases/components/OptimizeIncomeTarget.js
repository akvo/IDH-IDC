import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  Button,
  Card,
  Col,
  InputNumber,
  Row,
  Space,
  Modal,
  Tooltip,
  message,
  Alert,
  Popconfirm,
  Table,
} from "antd";
import {
  ArrowRightOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import AllDriverTreeSelector from "./AllDriverTreeSelector";
import { CaseVisualState, CurrentCaseState } from "../store";
import { thousandFormatter } from "../../../components/chart/options/common";
import { api, flatten } from "../../../lib";
import VisualCardWrapper from "./VisualCardWrapper";
import Chart from "../../../components/chart";
import { commodities } from "../../../store/static";
import { isEmpty, orderBy, uniqBy } from "lodash";
import { QuestionCircleOutline } from "../../../lib/icon";
import SegmentSelector from "./SegmentSelector";
import { CustomEvent } from "@piwikpro/react-piwik-pro";

// TODO :: Optimize value not saved into DB if we doesn't fill sensitivity analysis line chart form
// should we add new visualization config type?
const SHOW_OPTIMIZE_RESULT_AS = "TABLE"; // change to "CHART" or "TABLE"

const colors = [
  "#05615e", // green,
  "#fecb21", // yellow,
  "#fecb21", // blue,
  "#ffcea4", // pink
];

const unitName = ({ currentCase, question, group }) => {
  if (!question?.unit) {
    return "";
  }
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

const OptimizeIncomeTarget = () => {
  const currentCaseState = CurrentCaseState.useState((s) => s);
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
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [refresh, setRefresh] = useState(true);

  const buttonRunModelRef = useRef(null);
  const chartRef = useRef(null);
  const [messageApi, messageContextHolder] = message.useMessage();

  /*
    increaseValues example
    {
      "{selectedSegment}_percentage-increase-1": null,
      "{selectedSegment}_absolute-increase-1": 0,
      "{selectedSegment}_percentage-increase-2": null,
      "{selectedSegment}_absolute-increase-2": 0,
      "{selectedSegment}_percentage-increase-3": null,
      "{selectedSegment}_absolute-increase-3": 0,
    }
  */
  const percentageFieldPreffix = `${selectedSegment}_percentage-increase`;
  const absoluteKeyPreffix = `${selectedSegment}_absolute-increase`;
  const selectedDriversFieldPreffix = `${selectedSegment}_selected-drivers`;
  const optimizedPreffix = "_optimized";
  const optimizationResultPreffix = `${selectedSegment}${optimizedPreffix}`;

  const currency = currentCaseState?.currency || "";

  const updateOptimizationModelState = (updatedValue) => {
    CaseVisualState.update((s) => ({
      ...s,
      sensitivityAnalysis: {
        ...s.sensitivityAnalysis,
        case: s.sensitivityAnalysis.case || currentCaseState.id,
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

  const disableRunModelByIfSelectedIncreaseValuesNA = useMemo(() => {
    if (!isEmpty(increaseValues) && selectedSegment) {
      const increaseValueAvailable = Object.entries(increaseValues)
        .map(([key, value]) => {
          if (key.includes(selectedSegment) && value) {
            return key;
          }
          return null;
        })
        .filter((x) => x);
      return increaseValueAvailable?.length <= 0;
    }
    return true;
  }, [selectedSegment, increaseValues]);

  const currentSegment = useMemo(() => {
    return currentCaseState?.segments?.find((s) => s.id === selectedSegment);
  }, [selectedSegment, currentCaseState]);

  const currentDashboardData = useMemo(() => {
    return dashboardData.find((d) => d.id === selectedSegment);
  }, [selectedSegment, dashboardData]);

  const handleChangeSelectedDrivers = (val) => {
    updateOptimizationModelState({
      selectedDrivers: {
        ...selectedDrivers,
        [selectedDriversFieldPreffix]: val,
      },
    });
  };

  const handleChangeIncreaseValues = ({ index, percentage }) => {
    const percentageField = `${percentageFieldPreffix}-${index}`;
    const absoluteKey = `${absoluteKeyPreffix}-${index}`;

    const currentIncome = currentDashboardData?.total_current_income || 0;
    const feasibleIncome = currentDashboardData?.total_feasible_income || 0;
    let absoluteIncreaseValue = 0;
    if (percentage) {
      absoluteIncreaseValue =
        currentIncome + (feasibleIncome - currentIncome) * (percentage / 100);
    }
    updateOptimizationModelState({
      increaseValues: {
        ...increaseValues,
        [percentageField]: percentage,
        [absoluteKey]: absoluteIncreaseValue,
      },
    });
  };

  useEffect(() => {
    // handle automated recalculation if total income updated
    if (
      refresh &&
      !isEmpty(increaseValues) &&
      currentDashboardData?.total_current_income !==
        optimizationResult?.[optimizationResultPreffix]?.current_income
    ) {
      let updatedIncreaseValues = {};
      Object.entries(increaseValues).map(([key, value]) => {
        if (key.includes(percentageFieldPreffix) && value) {
          const [, preffix] = key.split("_");
          const [, , index] = preffix.split("-");
          const percentage = value;
          const absoluteKey = `${absoluteKeyPreffix}-${index}`;
          const currentIncome = currentDashboardData?.total_current_income || 0;
          const feasibleIncome =
            currentDashboardData?.total_feasible_income || 0;
          let absoluteIncreaseValue = 0;
          if (percentage) {
            absoluteIncreaseValue =
              currentIncome +
              (feasibleIncome - currentIncome) * (percentage / 100);
          }
          updatedIncreaseValues = {
            ...updatedIncreaseValues,
            [absoluteKey]: absoluteIncreaseValue,
          };
        }
      });
      updateOptimizationModelState({
        increaseValues: {
          ...increaseValues,
          ...updatedIncreaseValues,
        },
      });
      if (buttonRunModelRef?.current) {
        buttonRunModelRef.current.click();
      }
      setRefresh(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentDashboardData?.total_current_income,
    currentDashboardData?.total_feasible_income,
    optimizationResult,
    increaseValues,
  ]);

  const handleRunModel = () => {
    const percentages = Object.entries(increaseValues)
      .map(([key, value]) => {
        if (key.includes(percentageFieldPreffix) && value) {
          return value / 100;
        }
        return null;
      })
      .filter((x) => x);

    const editable_indices =
      selectedDrivers?.[selectedDriversFieldPreffix] || [];

    if (!percentages?.length || !editable_indices?.length) {
      // return notification
      messageApi.open({
        type: "warning",
        content:
          "Please double-check the model input values (drivers and percentage increase), then re-run the model.",
      });
      return;
    }

    // track event - Optimize income target - selected drivers pair
    const driverPair = editable_indices
      .map((key) => {
        const [caseCommodityId, qId] = key.split("-");
        const commodity = questionGroups.find(
          (qg) =>
            qg?.id === parseInt(caseCommodityId) ||
            qg?.case_commodity_id === parseInt(caseCommodityId)
        );
        const question = flattenedQuestionGroups.find(
          (q) => q?.id === parseInt(qId)
        );
        if (commodity?.commodity_name && question?.text) {
          return `${question?.text} (${commodity?.commodity_name})`;
        }
        return null;
      })
      .filter((x) => x)
      .join(" - ");
    if (driverPair) {
      CustomEvent.trackEvent(
        "Optimization model - Select the drivers you can influence",
        "on run optimization model",
        "Selected Drivers Pair",
        1, // Event Value
        {
          dimension11: driverPair, // Custom Dimension: Track combination of x-y-bin
        }
      );
      console.info(
        "track event",
        "Optimization model - Select the drivers you can influence",
        "on run optimization model",
        "Selected Drivers Pair",
        1,
        {
          dimension11: driverPair,
        }
      );
    }
    // EOL track event - Optimize income target - selected drivers pair

    // run the model
    const payload = {
      percentages,
      editable_indices,
    };
    api
      .post(
        `optimize/run-model/${currentCaseState.id}/${selectedSegment}`,
        payload
      )
      .then((res) => {
        const { data } = res;
        // clear optimization result from prev config
        let cleanedOptimizationResult = optimizationResult;
        if (!isEmpty(optimizationResult)) {
          cleanedOptimizationResult = Object.keys(optimizationResult)
            .filter((key) => key.includes(optimizedPreffix))
            .reduce((obj, key) => {
              obj[key] = optimizationResult[key];
              return obj;
            }, {});
        }
        updateOptimizationModelState({
          optimizationResult: {
            ...cleanedOptimizationResult,
            [optimizationResultPreffix]: data,
          },
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

  const renderIncreaseError = useMemo(() => {
    if (!isEmpty(optimizationResult?.[optimizationResultPreffix])) {
      const { optimization_result } =
        optimizationResult[optimizationResultPreffix];
      const optimizedValues = orderBy(optimization_result, "key");
      const errors = optimizedValues?.filter((v) => v.increase_error);
      const errorText =
        "This income increase is not possible with adjustments only to the selected income drivers. Maximum possible % increase with this driver selection is: ";
      const alerts = errors.map(({ key, max_percentage }) => {
        const maxPercent = max_percentage * 100;
        return (
          <Alert
            key={`increase-error-${key}`}
            message={`Increase ${key} - ${errorText}${maxPercent?.toFixed(2)}%`}
            type="error"
            showIcon
            style={{ fontFamily: "TabletGothic" }}
          />
        );
      });
      return (
        <Col span={24}>
          <Space direction="vertical">{alerts}</Space>
        </Col>
      );
    }
    return null;
  }, [optimizationResult, optimizationResultPreffix]);

  const chartData = useMemo(() => {
    if (
      !isEmpty(optimizationResult?.[optimizationResultPreffix]) &&
      SHOW_OPTIMIZE_RESULT_AS === "CHART"
    ) {
      const { optimization_result } =
        optimizationResult[optimizationResultPreffix];
      const optimizedValues = orderBy(optimization_result, "key")?.filter(
        (v) => !v.increase_error
      );
      const drivers =
        optimizedValues?.flatMap((v) => v?.value?.optimization)?.[0] || {};

      const labels = {};
      Object.keys(drivers).forEach((key) => {
        const [caseCommodityId, qid] = key.split("-");
        const question = flattenedQuestionGroups.find(
          (q) => q.id === parseInt(qid)
        );
        const caseCommodity = currentCaseState?.case_commodities?.find(
          (c) => c.id === parseInt(caseCommodityId)
        );
        const commodity = commodities.find(
          (c) => c.id === caseCommodity?.commodity
        );
        const driver =
          question?.id === 1 && commodity?.name
            ? commodity?.name
            : question.text;
        const unit = unitName({
          currentCase: currentCaseState,
          question: question,
          group: caseCommodity,
        });
        labels[key] = `${driver}${unit && unit !== "" ? ` (${unit})` : ""}`;
      });

      const data = Object.entries(labels).map(([key, label]) => {
        const currentValues = [];
        const increasedValues = optimizedValues.map((val) => {
          const valueTmp = val?.value?.optimization?.[key] || [];
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
  }, [
    refreshChart,
    currentCaseState,
    currentDashboardData?.total_current_income,
  ]);

  const tableData = useMemo(() => {
    if (
      !isEmpty(optimizationResult?.[optimizationResultPreffix]) &&
      SHOW_OPTIMIZE_RESULT_AS === "TABLE"
    ) {
      const { optimization_result } =
        optimizationResult[optimizationResultPreffix];
      const optimizedValues = orderBy(optimization_result, "key")?.filter(
        (v) => !v.increase_error
      );

      // generate columns
      const increaseColumns = optimizedValues.map((opt) => ({
        title: `Adjustment ${opt.key}`,
        dataIndex: `increase_${opt.key}`,
        name: `increase_${opt.key}`,
        align: "left",
        width: "20%",
        render: (text, row) => {
          if (row.key === "total_income") {
            return <b>{text}</b>;
          }
          return text;
        },
      }));
      const columns = [
        {
          title: "Income driver",
          dataIndex: "driver",
          key: "driver",
          width: "20%",
        },
        {
          title: "Current value",
          dataIndex: "current",
          key: "current",
          align: "left",
          width: "20%",
          render: (text, row) => {
            if (row.key === "total_income") {
              return <b>{text}</b>;
            }
            return text;
          },
        },
        ...increaseColumns,
      ];
      // EOL generate columns

      // generate dataSource
      const drivers =
        optimizedValues?.flatMap((v) => v?.value?.optimization)?.[0] || {};

      const labels = {};
      Object.keys(drivers).forEach((key) => {
        const [caseCommodityId, qid] = key.split("-");
        const question = flattenedQuestionGroups.find(
          (q) => q.id === parseInt(qid)
        );
        const caseCommodity = currentCaseState?.case_commodities?.find(
          (c) => c.id === parseInt(caseCommodityId)
        );
        const commodity = commodities.find(
          (c) => c.id === caseCommodity?.commodity
        );
        const driver =
          question?.id === 1 && commodity?.name
            ? commodity?.name
            : question.text;
        const unit = unitName({
          currentCase: currentCaseState,
          question: question,
          group: caseCommodity,
        });
        const driverName = (
          <Space direction="vertical">
            <div>{driver}</div>
            <div>{unit && unit !== "" ? ` (${unit})` : ""}</div>
          </Space>
        );
        labels[key] = driverName;
      });
      // add total labels
      if (!isEmpty(labels)) {
        const totalIncomeLabel = (
          <Space align="middle">
            <div>
              <b>Total income ({currentCaseState.currency})</b>
            </div>
            <Tooltip
              title={
                <>
                  The income figures shown below each adjustment (e.g.
                  Adjustment 1, 2, 3) in the green box above may differ slightly
                  from the <i>Total income</i> values displayed here. This is
                  because the table shows rounded driver values, and the total
                  income in this row is calculated using those rounded values.
                </>
              }
            >
              <span>
                <InfoCircleOutlined style={{ fontSize: 13 }} />
              </span>
            </Tooltip>
          </Space>
        );
        labels["total_income"] = totalIncomeLabel;
      }

      const dataSource = [];
      Object.entries(labels).forEach(([key, label]) => {
        const data = {
          key,
          driver: label,
        };
        if (key === "total_income") {
          optimizedValues.forEach((val) => {
            const achievedIncome = val?.value?.achieved_income || 0; // optimization income result
            data["current"] = thousandFormatter(
              currentDashboardData?.total_current_income || 0,
              2
            );
            data[`increase_${val.key}`] = thousandFormatter(achievedIncome, 2);
          });
        } else {
          optimizedValues.forEach((val) => {
            const valueTmp = val?.value?.optimization?.[key] || [];
            const currentValue =
              valueTmp.find((v) => v.name === "current")?.value || 0;

            const optimizedValue =
              valueTmp.find((v) => v.name === "optimized")?.value || 0;
            const optimizedPercentage = currentValue
              ? ((optimizedValue - currentValue) / currentValue) * 100
              : 0;
            const absoluteIncreaseValue = thousandFormatter(optimizedValue, 2);
            const percentageIncreaseValue = thousandFormatter(
              optimizedPercentage,
              2
            );

            data["current"] = thousandFormatter(currentValue, 2);
            data[
              `increase_${val.key}`
            ] = `${absoluteIncreaseValue} (${percentageIncreaseValue}%)`;
          });
        }
        dataSource.push(data);
      });
      // EOL generate dataSource
      return {
        columns: columns,
        dataSource: dataSource,
      };
    }
    return {
      columns: [],
      dataSource: [],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    refreshChart,
    currentCaseState,
    currentDashboardData?.total_current_income,
  ]);

  const handleClearResult = () => {
    // reset increase values
    const filteredIncreaseValues = Object.fromEntries(
      Object.entries(increaseValues).filter(
        ([key]) =>
          !key.startsWith(absoluteKeyPreffix) &&
          !key.startsWith(percentageFieldPreffix) &&
          key.includes("_") // keep only keys with prefix
      )
    );

    updateOptimizationModelState({
      // reset selected drivers
      selectedDrivers: {
        ...selectedDrivers,
        [selectedDriversFieldPreffix]: [],
      },
      // reset increase values
      increaseValues: filteredIncreaseValues,
      // reset optimization result
      optimizationResult: {
        ...optimizationResult,
        [optimizationResultPreffix]: {},
      },
    });
    setRefreshChart(true);
  };

  return (
    <Row gutter={[24, 24]}>
      <Col span={24}>
        <Card className="card-section-wrapper optimize-income-target-wrapper">
          <Row gutter={[20, 10]}>
            <Col span={24}>
              <SegmentSelector
                selectedSegment={selectedSegment}
                setSelectedSegment={setSelectedSegment}
              />
            </Col>
            <Col span={24}>
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
                  Select the drivers you can influence{" "}
                  <Tooltip title="These are the drivers you have control over and can realistically adjust">
                    <span>
                      <QuestionCircleOutline />
                    </span>
                  </Tooltip>
                </div>
              </Space>
              <div className="description">You can select up to 5 drivers</div>
              <div>
                <AllDriverTreeSelector
                  multiple={true}
                  maxCount={5}
                  style={{ width: "45%" }}
                  dropdownStyle={{ width: "60%" }}
                  onChange={handleChangeSelectedDrivers}
                  value={selectedDrivers?.[selectedDriversFieldPreffix] || []}
                  segment={currentSegment}
                />
              </div>
            </Col>
            <Col span={24} className="optimize-income-target-step-wrapper">
              <Space className="step-wrapper" align="center">
                <div className="number">2.</div>
                <div className="label">
                  Specify income adjustments to explore different outcomes{" "}
                  <Tooltip
                    title={
                      <>
                        The adjusted income level is calculated by increasing
                        your current income by a percentage of the feasible
                        income gap (feasible income - current income). For
                        example, if your current income is $1,000 and your
                        feasible income is $2,000, the gap is $1,000. A 10%
                        increase means adding $100, resulting in a new income of
                        $1,100.
                      </>
                    }
                  >
                    <span>
                      <QuestionCircleOutline />
                    </span>
                  </Tooltip>
                </div>
              </Space>
              <div className="description">
                Enter percentages to change your current income based on the gap
                with your feasible income.
              </div>
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
                  <label>Adjustment 1 (%)</label>
                  <InputNumber
                    controls={false}
                    addonAfter="%"
                    onChange={(value) =>
                      handleChangeIncreaseValues({
                        index: 1,
                        percentage: value,
                      })
                    }
                    value={
                      increaseValues?.[`${percentageFieldPreffix}-1`] || null
                    }
                  />
                  {increaseValues?.[`${percentageFieldPreffix}-1`] && (
                    <span>
                      {thousandFormatter(
                        increaseValues?.[`${absoluteKeyPreffix}-1`],
                        2
                      )}{" "}
                      {currency}
                    </span>
                  )}
                </div>
                <div>
                  <label>Adjustment 2 (%)</label>
                  <InputNumber
                    controls={false}
                    addonAfter="%"
                    onChange={(value) =>
                      handleChangeIncreaseValues({
                        index: 2,
                        percentage: value,
                      })
                    }
                    value={
                      increaseValues?.[`${percentageFieldPreffix}-2`] || null
                    }
                  />
                  {increaseValues?.[`${percentageFieldPreffix}-2`] && (
                    <span>
                      {thousandFormatter(
                        increaseValues?.[`${absoluteKeyPreffix}-2`],
                        2
                      )}{" "}
                      {currency}
                    </span>
                  )}
                </div>
                <div>
                  <label>Adjustment 3 (%)</label>
                  <InputNumber
                    controls={false}
                    addonAfter="%"
                    onChange={(value) =>
                      handleChangeIncreaseValues({
                        index: 3,
                        percentage: value,
                      })
                    }
                    value={
                      increaseValues?.[`${percentageFieldPreffix}-3`] || null
                    }
                  />
                  {increaseValues?.[`${percentageFieldPreffix}-3`] && (
                    <span>
                      {thousandFormatter(
                        increaseValues?.[`${absoluteKeyPreffix}-3`],
                        2
                      )}{" "}
                      {currency}
                    </span>
                  )}
                </div>
              </div>
            </Col>
            <Col span={24} className="optimize-button-wrapper">
              <Button
                className="button-clear-optimize-result"
                onClick={handleClearResult}
              >
                Clear results
              </Button>
              {!selectedDrivers?.[selectedDriversFieldPreffix]?.length ||
              disableRunModelByIfSelectedIncreaseValuesNA ? (
                <Popconfirm
                  placement="bottom"
                  description="Please complete step 1 and step 2 before run the model."
                  color="#fff"
                  trigger="hover"
                  showCancel={false}
                  okButtonProps={{
                    style: {
                      display: "none",
                    },
                  }}
                  icon={null}
                >
                  <Button
                    className="button-run-the-model"
                    onClick={handleRunModel}
                    disabled={
                      !selectedDrivers?.[selectedDriversFieldPreffix]?.length ||
                      disableRunModelByIfSelectedIncreaseValuesNA
                    }
                  >
                    Run the model <ArrowRightOutlined />
                  </Button>
                </Popconfirm>
              ) : (
                <Button
                  className="button-run-the-model"
                  onClick={handleRunModel}
                  disabled={
                    !selectedDrivers?.[selectedDriversFieldPreffix]?.length ||
                    disableRunModelByIfSelectedIncreaseValuesNA
                  }
                  ref={buttonRunModelRef}
                >
                  Run the model <ArrowRightOutlined />
                </Button>
              )}
            </Col>
          </Row>
        </Card>
      </Col>
      {/* INCREASE ERROR */}
      {renderIncreaseError}
      {/* EOL INCREASE ERROR */}
      <Col
        span={24}
        style={{
          display:
            chartData?.length || tableData?.dataSource?.length ? "" : "none",
        }}
      >
        <Card className="card-visual-wrapper no-padding">
          <Row gutter={[20, 20]} align="start">
            <Col span={18}>
              {SHOW_OPTIMIZE_RESULT_AS === "CHART" ? (
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
              ) : (
                ""
              )}

              {SHOW_OPTIMIZE_RESULT_AS === "TABLE" ? (
                <div>
                  <div className="optimize-table-wrapper">
                    <Table
                      pagination={false}
                      columns={tableData.columns}
                      loading={tableData.dataSource?.length}
                      dataSource={tableData.dataSource?.filter(
                        (d) => d.key !== "total_income"
                      )} // exclude total_income from main table
                      bordered
                    />
                  </div>
                  <div className="total-income-table-wrapper">
                    <Table
                      pagination={false}
                      columns={tableData.columns}
                      loading={tableData.dataSource?.length}
                      dataSource={tableData.dataSource?.filter(
                        (d) => d.key === "total_income"
                      )} // show only total_income
                      showHeader={false}
                      style={{ border: "none" }}
                    />
                  </div>
                </div>
              ) : (
                ""
              )}
            </Col>
            <Col span={6}>
              {SHOW_OPTIMIZE_RESULT_AS === "CHART" ? (
                <Space direction="vertical">
                  <div className="section-title">
                    What is the optimal and feasible change in selected drivers
                    to reach your adjusted income target?
                  </div>
                  <div className="section-description">
                    This graph compares your current income driver values with
                    optimised scenarios, showing how different adjustments
                    influence income. It helps identify which changes lead to
                    the most efficient income increase while staying within
                    feasible ranges.
                    <br />
                    <br />
                    For more details about this optimisation model,{" "}
                    <a onClick={() => setShowModelDetail(true)}>click here</a>.
                  </div>
                </Space>
              ) : (
                ""
              )}

              {SHOW_OPTIMIZE_RESULT_AS === "TABLE" ? (
                <Space direction="vertical">
                  <div className="section-title">
                    What is the optimal and feasible change in selected drivers
                    to reach your adjusted income target?
                  </div>
                  <div className="section-description">
                    This table shows how your current income driver values would
                    need to change to meet your adjusted income target. It
                    reflects the smallest possible changes across the selected
                    drivers, while staying within feasible limits. Use it to
                    understand which adjustments are possible and which drivers
                    contribute most toward reaching your goal.
                    <br />
                    <br />
                    For more details about this optimisation model,{" "}
                    <a onClick={() => setShowModelDetail(true)}>click here</a>.
                  </div>
                </Space>
              ) : (
                ""
              )}
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
            This analysis compares current and optimised values of key income
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
              that the income using the optimised income drivers equals the
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
      {/* message context holder */}
      {messageContextHolder}
    </Row>
  );
};

export default OptimizeIncomeTarget;
