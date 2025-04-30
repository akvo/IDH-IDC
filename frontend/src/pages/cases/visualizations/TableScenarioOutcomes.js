import React, { useMemo, useState, useRef, useEffect } from "react";
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
    key: "number_of_farmers",
    name: "How many farmers are in this segment?",
  },
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
  {
    key: "monetary_value_income_gap",
    name: "What is the monetary value of the income gap?",
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

const TableScenarioOutcomes = ({
  // this params used when showing scenario outcomes from View Summary Button
  isSummary = false,
  summaryScenarioOutcomeDataSource = [],
}) => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const { scenarioModeling, questionGroups, dashboardData } =
    CaseVisualState.useState((s) => s);
  const { scenarioData, scenarioOutcomeDataSource } = scenarioModeling.config;

  const [selectedSegment, setSelectedSegment] = useState(null);
  const tableRef = useRef(null);

  const segmentOptions = useMemo(() => {
    const res = currentCase.segments.map((s) => ({
      label: s.name,
      value: s.id,
    }));
    return orderBy(res, ["value"]);
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

  // Generate for all scenario segments once
  // then save the scenarioOutcomeDataSource into DB
  useEffect(() => {
    const allQuestions = uniqBy(
      questionGroups.flatMap((qg) => flatten(qg.questions)),
      "id"
    );
    const allScenarioOutcomes = dashboardData.map((currentDashboardData) => {
      const data = outcomeIndicator.map((ind) => {
        let res = { id: ind.key, title: ind.name };
        if (ind.key === "number_of_farmers") {
          res = {
            ...res,
            current: currentDashboardData?.number_of_farmers || "-",
          };
          scenarioData.forEach((sd) => {
            const scenarioKey = `scenario-${sd.key}`;
            const scenarioSegment =
              sd.scenarioValues.find(
                (sv) => sv.segmentId === currentDashboardData.id
              ) || {};
            const numberOfFarmers =
              scenarioSegment?.updatedSegmentScenarioValue?.number_of_farmers;
            res = {
              ...res,
              [scenarioKey]: numberOfFarmers,
            };
          });
        }

        if (ind.key === "income_driver") {
          res = {
            ...res,
            current: "-",
          };
          scenarioData.forEach((sd) => {
            const scenarioKey = `scenario-${sd.key}`;
            const scenarioSegment = sd.scenarioValues.find(
              (sv) => sv.segmentId === currentDashboardData.id
            );
            const scenarioDriverValues = scenarioSegment?.selectedDrivers
              ?.filter((d) => d.value) // filter undefined/null value
              ?.map((driver) => {
                // scenario field
                const [, scenarioKey, segmentId, index] =
                  driver.field.split("-");
                const fieldKey = `${scenarioKey}-${segmentId}-${index}`;
                const absoluteField = `absolute-${fieldKey}`;
                const percentageField = `percentage-${fieldKey}`;

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
                    percentChange = `${parseFloat(sdv.percentage)?.toFixed(
                      2
                    )}%`;
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
            res = {
              ...res,
              [scenarioKey]: orderBy(uniqBy(scenarioDriverValues, "qid"), "qid")
                .map((x) => `${x.text}#(${x.percent})`)
                .join("|"),
            };
          });
        }

        if (ind.key === "income_target_reached") {
          res = {
            ...res,
            current:
              currentDashboardData.target <=
              currentDashboardData.total_current_income
                ? "reached"
                : "not_reached",
          };
          scenarioData.forEach((sd) => {
            const scenarioKey = `scenario-${sd.key}`;
            const scenarioSegment = sd.scenarioValues.find(
              (sv) => sv.segmentId === currentDashboardData.id
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
                  ? "reached"
                  : "not_reached",
            };
          });
        }

        if (ind.key === "income_gap") {
          const currentGap =
            currentDashboardData.target -
            currentDashboardData.total_current_income;
          res = {
            ...res,
            current:
              currentGap <= 0 ? "-" : thousandFormatter(currentGap?.toFixed(2)),
          };
          scenarioData.forEach((sd) => {
            const scenarioKey = `scenario-${sd.key}`;
            const scenarioSegment =
              sd.scenarioValues.find(
                (sv) => sv.segmentId === currentDashboardData.id
              ) || {};
            const segmentValue = scenarioSegment?.updatedSegmentScenarioValue
              ?.total_current_income
              ? scenarioSegment?.updatedSegmentScenarioValue
                  ?.total_current_income
              : currentDashboardData.target;
            const segmentGap = currentDashboardData.target - segmentValue;
            res = {
              ...res,
              [scenarioKey]:
                segmentGap <= 0
                  ? "-"
                  : thousandFormatter(segmentGap?.toFixed(2)),
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
              sd.scenarioValues.find(
                (sv) => sv.segmentId === currentDashboardData.id
              ) || {};
            const segmentValue = scenarioSegment?.updatedSegmentScenarioValue
              ?.total_current_income
              ? scenarioSegment?.updatedSegmentScenarioValue
                  ?.total_current_income
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
              sd.scenarioValues.find(
                (sv) => sv.segmentId === currentDashboardData.id
              ) || {};
            const segmentValue = scenarioSegment?.updatedSegmentScenarioValue
              ?.total_current_income
              ? scenarioSegment?.updatedSegmentScenarioValue
                  ?.total_current_income
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

        if (ind.key === "monetary_value_income_gap") {
          const currentGap =
            currentDashboardData.target -
            currentDashboardData.total_current_income;
          const numberOfFarmers = currentDashboardData?.number_of_farmers || 0;
          const currentMonetary = currentGap * numberOfFarmers;
          res = {
            ...res,
            current: currentMonetary
              ? thousandFormatter(currentMonetary?.toFixed(2))
              : "-",
          };
          scenarioData.forEach((sd) => {
            const scenarioKey = `scenario-${sd.key}`;
            const scenarioSegment =
              sd.scenarioValues.find(
                (sv) => sv.segmentId === currentDashboardData.id
              ) || {};
            const segmentValue = scenarioSegment?.updatedSegmentScenarioValue
              ?.total_current_income
              ? scenarioSegment?.updatedSegmentScenarioValue
                  ?.total_current_income
              : currentDashboardData.target;
            const segmentGap = currentDashboardData.target - segmentValue;
            const segmentNumberOfFarmers =
              scenarioSegment?.updatedSegmentScenarioValue?.number_of_farmers ||
              0;
            const segmentMonetary = segmentGap * segmentNumberOfFarmers;
            res = {
              ...res,
              [scenarioKey]:
                segmentMonetary <= 0
                  ? "-"
                  : thousandFormatter(segmentMonetary?.toFixed(2)),
            };
          });
        }

        return res;
      });
      return {
        segmentId: currentDashboardData.id,
        segmentName: currentDashboardData.name,
        scenarioOutcome: data,
      };
    });
    // update the scenario modeling global state
    CaseVisualState.update((s) => ({
      ...s,
      scenarioModeling: {
        ...s.scenarioModeling,
        config: {
          ...s.scenarioModeling.config,
          scenarioOutcomeDataSource: allScenarioOutcomes,
        },
      },
    }));
  }, [scenarioData, questionGroups, dashboardData]);

  // Generate scenario outcome for table data source by selected segment
  const selectedScenarioOutcomeDataSource = useMemo(() => {
    if (!selectedSegment) {
      return [];
    }
    const res =
      scenarioOutcomeDataSource.find((so) => so.segmentId === selectedSegment)
        ?.scenarioOutcome || [];
    return res.map((r) => {
      if (r.id === "income_driver") {
        // render value
        Object.entries(r).map(([key, value]) => {
          if (key !== "title") {
            const splitted = value.split("|");
            const values = (
              <Space direction="vertical">
                {splitted.map((x, xi) => {
                  const [text, percent] = x.split("#");
                  return (
                    <Space key={`${xi}-${x}`}>
                      <div>{text}</div>
                      <div>{percent}</div>
                    </Space>
                  );
                })}
              </Space>
            );
            r = {
              ...r,
              [key]: values,
            };
          }
        });
      }
      if (r.id === "income_target_reached") {
        Object.entries(r).map(([key, value]) => {
          if (key !== "title") {
            let icon = "";
            if (value === "reached") {
              icon = incomeTargetIcon.reached;
            } else {
              icon = incomeTargetIcon.not_reached;
            }
            r = {
              ...r,
              [key]: icon,
            };
          }
        });
      }
      return r;
    });
  }, [selectedSegment, scenarioOutcomeDataSource]);

  if (isSummary) {
    return (
      <Table
        rowKey="id"
        columns={scenarioOutcomeColumns}
        dataSource={summaryScenarioOutcomeDataSource}
        pagination={false}
      />
    );
  }

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
            dataSource={selectedScenarioOutcomeDataSource}
            pagination={false}
            size="small"
          />
        </Col>
      </Row>
    </VisualCardWrapper>
  );
};

export default TableScenarioOutcomes;
