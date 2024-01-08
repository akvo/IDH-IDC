import React, { useMemo, useState } from "react";
import { Row, Col, Card, Select, Tabs, Space } from "antd";
import { Scenario } from "./";
import { orderBy } from "lodash";
import { PlusCircleFilled } from "@ant-design/icons";

const addScenarioButton = {
  key: "add",
  name: (
    <span>
      <PlusCircleFilled /> Add Scenario
    </span>
  ),
  description: null,
  scenarioValues: [],
};

const DashboardScenarioModeling = ({
  dashboardData,
  commodityList,
  questionGroups,
  percentage,
  setPercentage,
  scenarioData,
  setScenarioData,
  enableEditCase,
}) => {
  const [activeKey, setActiveKey] = useState(1);

  const segmentTabs = useMemo(
    () =>
      dashboardData.map((segment) => ({
        key: segment.id,
        label: segment.name,
      })),
    [dashboardData]
  );

  const scenarioDataWithAddButton = useMemo(() => {
    if (enableEditCase) {
      return [...orderBy(scenarioData, "key"), addScenarioButton];
    }
    return orderBy(scenarioData, "key");
  }, [enableEditCase, scenarioData]);

  const commodityQuestions = useMemo(() => {
    // modify this to handle secondary and tertiary commoditiy also grouped as diversified
    // Focus
    const focusQuestion = commodityList
      .filter((c) => c.commodity_type === "focus")
      .map((c) => {
        const findQG = questionGroups.find(
          (qg) => qg.commodity_id === c.commodity
        );
        // add case_commodity to questions
        return {
          ...c,
          ...findQG,
          questions: findQG.questions.map((q) => ({
            ...q,
            case_commodity: c.case_commodity,
          })),
        };
      });
    // Group secondary & tertiary into diversified
    const additionalDiversifed = commodityList
      .filter(
        (c) =>
          c.commodity_type !== "focus" && c.commodity_type !== "diversified"
      )
      .flatMap((c) => {
        const findQG = questionGroups.find(
          (qg) => qg.commodity_id === c.commodity
        );
        return {
          ...c,
          ...findQG,
          questions: findQG.questions.map((q) => ({
            ...q,
            case_commodity: c.case_commodity,
          })),
        };
      });
    // Diversified
    const diversified = commodityList.find(
      (c) => c.commodity_type === "diversified"
    );
    const findDiversifiedQG = questionGroups.find(
      (qg) => qg.commodity_id === diversified.commodity
    );
    const groupedDiversifiedQuestion = [
      ...additionalDiversifed.flatMap((a) => a.questions),
      ...findDiversifiedQG.questions.map((q) => ({
        ...q,
        case_commodity: diversified.case_commodity,
      })),
    ];
    const diversifiedQuestion = {
      ...diversified,
      ...findDiversifiedQG,
      case_commodity: [
        diversified.case_commodity,
        ...additionalDiversifed.map((a) => a.case_commodity),
      ]?.join("_"),
      questions: [
        {
          ...findDiversifiedQG.questions[0],
          id: "diversified",
          default_value: groupedDiversifiedQuestion
            .map((x) => `#${x.id}`)
            .join(" + "),
          parent: null,
          question_type: "diversified",
          text: "Diversified Income",
          description: "Custom question",
          childrens: groupedDiversifiedQuestion,
        },
      ],
    };
    return [...focusQuestion, diversifiedQuestion];
  }, [commodityList, questionGroups]);

  const renameScenario = (index, newName, newDescription) => {
    const newScenarioData = [...scenarioData];
    newScenarioData[index].name = newName;
    newScenarioData[index].description = newDescription;
    setScenarioData(newScenarioData);
  };

  const onDelete = (index) => {
    const newScenarioData = [...scenarioData];
    newScenarioData.splice(index, 1);
    setScenarioData(newScenarioData);
  };

  const onChangePercentage = (value) => {
    if (value === "percentage") {
      setPercentage(true);
    } else {
      setPercentage(false);
    }
  };

  const onChangeTab = (key) => {
    if (key === "add") {
      setScenarioData((prev) => {
        return [
          ...prev,
          {
            key: prev.length + 1,
            name: `Scenario ${prev.length + 1}`,
            description: null,
            scenarioValues: [],
          },
        ];
      });
      setActiveKey(scenarioDataWithAddButton.length);
    } else {
      setActiveKey(key);
    }
  };

  return (
    <div id="scenario-modeling">
      <Col span={24}>
        <Card className="card-alert-box">
          <Row gutter={[16, 16]} align="middle">
            <Col span={18}>
              <Space direction="vertical">
                <div className="title">Choose approach</div>
                <div className="description">
                  Please choose whether you would like to express the changes in
                  current values using percentages or absolute values.
                </div>
              </Space>
            </Col>
            <Col span={6}>
              <Select
                style={{ width: "100%" }}
                options={[
                  { label: "Percentage", value: "percentage" },
                  { label: "Absolute", value: "absolute" },
                ]}
                onChange={onChangePercentage}
                value={percentage ? "percentage" : "absolute"}
              />
            </Col>
          </Row>
        </Card>
      </Col>

      <Col span={24}>
        <Tabs
          onChange={onChangeTab}
          activeKey={activeKey}
          type="card"
          className="scenario-tabs-container"
          items={scenarioDataWithAddButton.map((scenarioItem, index) => ({
            ...scenarioItem,
            label: scenarioItem.name,
            children:
              scenarioItem.key === "add" ? null : (
                <Scenario
                  key={index}
                  index={index}
                  scenarioItem={scenarioItem}
                  renameScenario={renameScenario}
                  onDelete={() => {
                    onDelete(index);
                    setActiveKey(1);
                  }}
                  hideDelete={scenarioData.length === 1 && index === 0}
                  dashboardData={dashboardData}
                  commodityQuestions={commodityQuestions}
                  segmentTabs={segmentTabs}
                  percentage={percentage}
                  scenarioData={orderBy(scenarioData, "key")}
                  setScenarioData={setScenarioData}
                  currentScenarioValues={
                    scenarioData.find((d) => d.key === scenarioItem.key)
                      ?.scenarioValues || {}
                  }
                  enableEditCase={enableEditCase}
                />
              ),
          }))}
        />
      </Col>
    </div>
  );
};

export default DashboardScenarioModeling;
