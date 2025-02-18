import React, { useMemo, useState, useRef } from "react";
import { Table, Select, Row, Col, Space } from "antd";
import { VisualCardWrapper } from "../components";
import { selectProps } from "../../../lib";
import { CaseVisualState, CurrentCaseState } from "../store";
import { flatten } from "../../../lib";
import { uniqBy, isEmpty, orderBy } from "lodash";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import { thousandFormatter } from "../../../components/chart/options/common";

const outcomeIndicator = [
  {
    key: "income_driver",
    name: "What income drivers have changed?",
  },
  {
    key: "income_gap",
    name: "How big is the income gap?",
  },
  {
    key: "income_target_reached",
    name: "Is the income target reached?",
  },
  {
    key: "income_increase",
    name: "What is the income increase?",
  },
  {
    key: "income_increase_percentage",
    name: "What is the % income increase?",
  },
];

const incomeTargetIcon = {
  reached: (
    <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 18 }} />
  ),
  not_reached: (
    <CloseCircleTwoTone twoToneColor="#eb2f96" style={{ fontSize: 18 }} />
  ),
};

const TableScenarioOutcomes = () => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const { scenarioModeling, questionGroups, dashboardData } =
    CaseVisualState.useState((s) => s);
  const scenarioData = scenarioModeling.config.scenarioData;

  const [selectedSegment, setSelectedSegment] = useState(null);
  const tableRef = useRef(null);

  const segmentOptions = useMemo(() => {
    return currentCase.segments.map((s) => ({
      label: s.name,
      value: s.id,
    }));
  }, [currentCase.segments]);

  const scenarioOutcomeColumns = useMemo(() => {
    const scenarioCol = scenarioData.map((x) => ({
      title: x.name,
      dataIndex: `scenario-${x.key}`,
      key: `scenario-${x.key}`,
    }));
    return [
      {
        title: null,
        dataIndex: "title",
        key: "title",
        width: "25%",
      },
      {
        title: "Current Value",
        dataIndex: "current",
        key: "current",
      },
      ...scenarioCol,
    ];
  }, [scenarioData]);

  const scenarioOutcomeDataSource = useMemo(() => {
    if (!selectedSegment) {
      return [];
    }
    const allQuestions = uniqBy(
      questionGroups.flatMap((qg) => flatten(qg.questions)),
      "id"
    );
    const currentDashboardData = dashboardData.find(
      (dd) => dd.id === selectedSegment
    );
    const data = outcomeIndicator.map((ind) => {
      let res = { id: ind.key, title: ind.name };
      if (ind.key === "income_driver") {
        res = {
          ...res,
          current: "-",
        };
        scenarioData.forEach((sd) => {
          const scenarioKey = `scenario-${sd.key}`;
          const scenarioSegment = sd.scenarioValues.find(
            (sv) => sv.segmentId === selectedSegment
          );
          const scenarioDriverValues = scenarioSegment?.selectedDrivers
            ?.map((driver) => {
              // scenario field
              const [, segmentId, index] = driver.field.split("-");
              const absoluteField = `absolute-${segmentId}-${index}`;
              const percentageField = `percentage-${segmentId}-${index}`;

              // question
              const [, questionId] = driver.value.split(["-"]);
              const findQuestion = allQuestions.find(
                (q) => q.id === parseInt(questionId)
              );

              // current
              const currentValue =
                scenarioSegment?.currentSegmentValue?.answers?.find(
                  (a) =>
                    a.name === "current" &&
                    a.questionId === parseInt(questionId)
                )?.value;

              return {
                questionId: findQuestion.id,
                questionText: findQuestion.text,
                questionType: findQuestion.question_type,
                absolute: scenarioSegment?.allNewValues?.[absoluteField] || 0,
                percentage:
                  scenarioSegment?.allNewValues?.[percentageField] || 0,
                currentValue: currentValue || 0,
              };
            })
            .map((sdv) => {
              if (sdv.absolute !== sdv.curretValue) {
                let percentChange = 0;
                if (sdv.percentage || sdv.percentage === 0) {
                  percentChange = `${parseFloat(sdv.percentage)?.toFixed(2)}%`;
                } else if (sdv.absolute !== 0) {
                  percentChange =
                    ((sdv.absolute - sdv.currentValue) / sdv.currentValue) *
                    100;
                  percentChange = `${percentChange?.toFixed(2)}%`;
                } else {
                  percentChange = "~";
                }
                const text =
                  sdv.questionType !== "diversified"
                    ? sdv.questionText
                    : "Diversified Income";
                return {
                  qid: sdv.questionId,
                  text: text,
                  percent: percentChange,
                };
              }
              return false;
            })
            .filter((x) => x);
          if (isEmpty(scenarioDriverValues)) {
            return {
              ...res,
              [scenarioKey]: "-",
            };
          }
          const values = (
            <Space direction="vertical">
              {orderBy(uniqBy(scenarioDriverValues, "qid"), "qid").map((x) => (
                <Space key={x.qid}>
                  <div>{x.text}</div>
                  <div>({x.percent})</div>
                </Space>
              ))}
            </Space>
          );
          res = {
            ...res,
            [scenarioKey]: values,
          };
        });
      }

      if (ind.key === "income_target_reached") {
        res = {
          ...res,
          current:
            currentDashboardData.target <=
            currentDashboardData.total_current_income
              ? incomeTargetIcon.reached
              : incomeTargetIcon.not_reached,
        };
        scenarioData.forEach((sd) => {
          const scenarioKey = `scenario-${sd.key}`;
          const scenarioSegment = sd.scenarioValues.find(
            (sv) => sv.segmentId === selectedSegment
          );
          const newTotalIncome = !scenarioSegment?.updatedSegmentScenarioValue
            ?.total_current_income
            ? currentDashboardData.total_current_income
            : scenarioSegment?.updatedSegmentScenarioValue
                ?.total_current_income;
          res = {
            ...res,
            [scenarioKey]:
              currentDashboardData.target <= newTotalIncome
                ? incomeTargetIcon.reached
                : incomeTargetIcon.not_reached,
          };
        });
      }

      if (ind.key === "income_gap") {
        const currentGap =
          currentDashboardData.target -
          currentDashboardData.total_current_income;
        res = {
          ...res,
          current: currentGap <= 0 ? "-" : currentGap?.toFixed(2),
        };
        scenarioData.forEach((sd) => {
          const scenarioKey = `scenario-${sd.key}`;
          const scenarioSegment =
            sd.scenarioValues.find((sv) => sv.segmentId === selectedSegment) ||
            {};
          const segmentValue = scenarioSegment?.updatedSegmentScenarioValue
            ?.total_current_income
            ? scenarioSegment?.updatedSegmentScenarioValue?.total_current_income
            : currentDashboardData.target;
          const segmentGap = currentDashboardData.target - segmentValue;
          res = {
            ...res,
            [scenarioKey]:
              segmentGap <= 0 ? "-" : thousandFormatter(segmentGap?.toFixed(2)),
          };
        });
      }

      if (ind.key === "income_increase") {
        res = {
          ...res,
          current: "-",
        };
        scenarioData.forEach((sd) => {
          const scenarioKey = `scenario-${sd.key}`;
          const scenarioSegment =
            sd.scenarioValues.find((sv) => sv.segmentId === selectedSegment) ||
            {};
          const segmentValue = scenarioSegment?.updatedSegmentScenarioValue
            ?.total_current_income
            ? scenarioSegment?.updatedSegmentScenarioValue?.total_current_income
            : currentDashboardData.total_current_income;
          const incomeIncrease =
            segmentValue - currentDashboardData.total_current_income;
          res = {
            ...res,
            [scenarioKey]:
              parseInt(incomeIncrease) === 0
                ? "-"
                : thousandFormatter(incomeIncrease?.toFixed(2)),
          };
        });
      }

      if (ind.key === "income_increase_percentage") {
        res = {
          ...res,
          current: "-",
        };
        scenarioData.forEach((sd) => {
          const scenarioKey = `scenario-${sd.key}`;
          const scenarioSegment =
            sd.scenarioValues.find((sv) => sv.segmentId === selectedSegment) ||
            {};
          const segmentValue = scenarioSegment?.updatedSegmentScenarioValue
            ?.total_current_income
            ? scenarioSegment?.updatedSegmentScenarioValue?.total_current_income
            : currentDashboardData.total_current_income;
          const incomeIncrease =
            segmentValue - currentDashboardData.total_current_income;
          let incomeIncreasePercent = "-";
          if (parseInt(incomeIncrease) !== 0) {
            incomeIncreasePercent = (
              (incomeIncrease / currentDashboardData.total_current_income) *
              100
            )?.toFixed(2);
            incomeIncreasePercent = `${incomeIncreasePercent}%`;
          }
          res = {
            ...res,
            [scenarioKey]: incomeIncreasePercent,
          };
        });
      }

      return res;
    });
    return data;
  }, [scenarioData, selectedSegment, questionGroups, dashboardData]);

  return (
    <VisualCardWrapper
      title="Scenario Outcomes"
      exportElementRef={tableRef}
      exportFilename="Scenario Outcomes"
    >
      <Row gutter={[20, 20]}>
        <Col span={24}>
          <Select
            {...selectProps}
            options={segmentOptions}
            placeholder="Select Segment"
            style={{ width: "25%" }}
            onChange={setSelectedSegment}
          />
        </Col>
        <Col span={24}>
          <Table
            rowKey="id"
            columns={scenarioOutcomeColumns}
            dataSource={scenarioOutcomeDataSource}
            pagination={false}
          />
        </Col>
      </Row>
    </VisualCardWrapper>
  );
};

export default TableScenarioOutcomes;
