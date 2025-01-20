import React, { useMemo, useState } from "react";
import { Row, Col, Card, Select, Tabs, Space } from "antd";
import { Scenario, Step } from ".";
import { orderBy } from "lodash";
import { PlusCircleFilled } from "@ant-design/icons";

const addScenarioButton = {
  key: "add",
  name: (
    <Space align="center">
      <div>
        <PlusCircleFilled /> Add Scenario
      </div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "normal",
          fontFamily: "TabletGothic",
        }}
      >
        (maximum 3)
      </div>
    </Space>
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
    if (enableEditCase && scenarioData?.length < 3) {
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
    setScenarioData((prev) =>
      prev.map((d) => {
        if (d.key === index) {
          return {
            ...d,
            name: newName,
            description: newDescription,
          };
        }
        return d;
      })
    );
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
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Step
              number={null}
              title="Perform scenario modeling"
              titleStyle={{ fontSize: "24px" }}
              description="This page enables you to explore various scenarios by adjusting your income drivers in different ways across your segments. This allows you to understand the potential paths towards improving farmer household income"
            />
          </Col>
          <Col span={12}>
            <Card className="card-alert-box">
              <Row gutter={[16, 16]} align="middle">
                <Col span={24}>
                  <Space direction="vertical">
                    <div className="title">Choose approach</div>
                    <div className="description">
                      Please choose whether you would like to express the
                      changes in current values using percentages or absolute
                      values.
                    </div>
                    <Row>
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
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Col>

      <Col span={24}>
        {/* Step 1 */}
        <Step number={1} title="Fill in values for your scenarios" />
        <Tabs
          onChange={onChangeTab}
          activeKey={activeKey}
          type="card"
          className="scenario-tabs-container"
          destroyInactiveTabPane={true}
          items={scenarioDataWithAddButton.map((scenarioItem, index) => ({
            ...scenarioItem,
            label: scenarioItem.name,
            children:
              scenarioItem.key === "add" ? null : (
                <Scenario
                  key={index}
                  index={scenarioItem.key}
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
                  activeScenario={activeKey}
                />
              ),
          }))}
        />
      </Col>
    </div>
  );
};

export default DashboardScenarioModeling;
