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
  summaryScenarioData = [],
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
    let scenarioCol = [];
    if (isSummary) {
      scenarioCol = summaryScenarioData.map((x) => ({
        title: x.name,
        dataIndex: `scenario-${x.key}`,
        key: `scenario-${x.key}`,
      }));
    } else {
      scenarioCol = scenarioData.map((x) => ({
        title: x.name,
        dataIndex: `scenario-${x.key}`,
        key: `scenario-${x.key}`,
      }));
    }
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
  }, [scenarioData, summaryScenarioData, isSummary]);

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
