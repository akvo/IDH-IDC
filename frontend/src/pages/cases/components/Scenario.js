import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Card,
  Col,
  Row,
  Input,
  InputNumber,
  Divider,
  Button,
  Space,
  Form,
  Popover,
  Spin,
} from "antd";
import {
  EditTwoTone,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  DeleteTwoTone,
} from "@ant-design/icons";
import { InputNumberThousandFormatter, getFunctionDefaultValue } from "./";
import { ChartScenarioModeling } from "../visualizations";
import { isEmpty } from "lodash";
import { SaveAsImageButton } from "../../../components/utils";
import { thousandFormatter } from "../../../components/chart/options/common";

const Question = ({
  id,
  parent,
  question_type,
  text,
  commodity,
  childrens,
  segment,
  percentage,
  unit,
  form,
  enableEditCase,
}) => {
  const { commodity_name, commodity_type, case_commodity, currency } =
    commodity;

  const unitName = useMemo(() => {
    return unit
      .split("/")
      .map((u) => u.trim())
      .map((u) => commodity?.[u])
      .join(" / ");
  }, [unit, commodity]);

  const answer = useMemo(() => {
    return segment.answers.find(
      (s) =>
        s.question.id === id &&
        s.caseCommodityId === case_commodity &&
        s.name === "current"
    );
  }, [segment, id, case_commodity]);

  const currentIncrease = useMemo(() => {
    let value = 0;
    if (percentage) {
      value = form.getFieldValue(`absolute-${case_commodity}-${id}`) || "-";
    } else {
      value = form.getFieldValue(`percentage-${case_commodity}-${id}`) || "-";
    }
    return !isNaN(value) ? value : 0;
  }, [form, case_commodity, id, percentage]);

  const disableTotalIncomeFocusCommodityField = !enableEditCase
    ? true
    : !parent && question_type === "aggregator" && commodity_type === "focus";

  return (
    <>
      <Row
        gutter={[8, 8]}
        align="middle"
        justify="space-between"
        display={
          question_type === "aggregator" && commodity_type === "focus"
            ? "none"
            : ""
        }
      >
        <Col span={9}>
          {!parent && question_type === "aggregator" ? (
            <h4>
              Total Income from {commodity_name} <small>({currency})</small>
            </h4>
          ) : (
            <h4>
              {text} <small>({unitName})</small>
            </h4>
          )}
        </Col>
        <Col span={5}>
          {["absolute", "percentage"].map((qtype) => (
            <Form.Item
              key={`${qtype}-${case_commodity}-${id}`}
              name={`${qtype}-${case_commodity}-${id}`}
              className="scenario-field-item"
              style={{
                display:
                  qtype !== "percentage" && percentage
                    ? "none"
                    : qtype === "percentage" && !percentage
                    ? "none"
                    : "",
              }}
              // disabled={disableTotalIncomeFocusCommodityField}
            >
              <InputNumber
                style={{
                  width: "100%",
                }}
                addonAfter={qtype === "percentage" ? "%" : ""}
                disabled={disableTotalIncomeFocusCommodityField}
                {...InputNumberThousandFormatter}
              />
            </Form.Item>
          ))}
        </Col>
        <Col span={5} align="right">
          {thousandFormatter(answer?.value?.toFixed(2)) || ""}
        </Col>
        <Col span={5} align="right">
          {percentage
            ? thousandFormatter(currentIncrease)
            : `${currentIncrease} %`}
        </Col>
      </Row>
      {!parent && commodity_type === "focus"
        ? childrens.map((child) => (
            <Question
              key={`scenario-${segment.id}-${case_commodity}-${child.id}`}
              commodity={commodity}
              percentage={percentage}
              segment={segment}
              form={form}
              {...child}
              enableEditCase={enableEditCase}
            />
          ))
        : null}
    </>
  );
};

const ScenarioInput = ({
  segment,
  commodityQuestions,
  percentage,
  setScenarioValues,
  scenarioValue,
  scenarioItem,
  setScenarioData,
  currencyUnitName,
  enableEditCase,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 300);
  }, []);

  const scenarioIncrease = useMemo(() => {
    if (scenarioValue?.value) {
      const { value: absoluteValue } = scenarioValue;
      const { total_current_income: totalIncome } = segment;
      return {
        totalPercentage: ((absoluteValue / totalIncome) * 100).toFixed(2),
        totalAbsolute: absoluteValue.toFixed(2),
      };
    }
    return {
      totalPercentage: 0,
      totalAbsolute: 0,
    };
  }, [scenarioValue, segment]);

  const onValuesChange = (changedValues, allValues) => {
    const objectId = Object.keys(changedValues)[0];
    const [, case_commodity, id] = objectId.split("-");
    const segmentAnswer = segment.answers.find(
      (s) =>
        s.questionId === parseInt(id) &&
        s.caseCommodityId === parseInt(case_commodity) &&
        s.name === "current"
    );

    const parentQuestion = segment.answers.find(
      (s) =>
        s.questionId === segmentAnswer?.question?.parent &&
        s.caseCommodityId === parseInt(case_commodity) &&
        s.name === "current"
    );

    const currentValue = segmentAnswer?.value || 0;
    const value = parseFloat(changedValues[objectId]);
    const newFieldsValue = {};

    let absoluteIncrease = 0;
    if (percentage) {
      const absoluteValue = (currentValue * value) / 100;
      absoluteIncrease = (absoluteValue + currentValue).toFixed(2);
      newFieldsValue[`absolute-${case_commodity}-${id}`] = absoluteIncrease;
    } else {
      absoluteIncrease = value;
      const percentageValue = (value - currentValue) / currentValue;
      const percentageIncrease = (percentageValue * 100).toFixed(2);
      newFieldsValue[`percentage-${case_commodity}-${id}`] = percentageIncrease;
    }

    if (parentQuestion) {
      const allObjectValues = Object.keys(allValues).reduce((acc, key) => {
        const [type, , id] = key.split("-");
        acc.push({
          id: `${type}-${id}`,
          value: allValues[key] || absoluteIncrease,
        });
        return acc;
      }, []);
      const newParentAnswerAbsoluteValue = getFunctionDefaultValue(
        parentQuestion.question,
        "absolute",
        allObjectValues
      );
      newFieldsValue[
        `absolute-${case_commodity}-${parentQuestion.question.id}`
      ] = newParentAnswerAbsoluteValue.toFixed(2);
      const newParentAnswerPercentageValue = parentQuestion?.value
        ? ((newParentAnswerAbsoluteValue - parentQuestion.value) /
            parentQuestion.value) *
          100
        : 0;
      newFieldsValue[
        `percentage-${case_commodity}-${parentQuestion.question.id}`
      ] = newParentAnswerPercentageValue.toFixed(2);
    }

    const allParentQuestions = segment.answers.filter(
      (s) => s.question.parent === null && s.name === "current"
    );
    const allNewValues = { ...allValues, ...newFieldsValue };

    const totalValues = allParentQuestions.reduce((acc, p) => {
      const questionId = `absolute-${p.caseCommodityId}-${p.question.id}`;
      const value = allNewValues[questionId];
      if (value) {
        acc += parseFloat(value);
      }
      return acc;
    }, 0);

    const newScenarioValue = {
      segmentId: segment.id,
      name: segment.name,
      value: !isNaN(totalValues) ? totalValues : 0,
    };
    setScenarioValues((prev) => {
      return [
        ...prev.filter((p) => p.segmentId !== segment.id),
        newScenarioValue,
      ];
    });
    // add scenarioValues into scenarioData
    setScenarioData((prev) => {
      const updated = prev.find((p) => p.key === scenarioItem.key);
      return [
        ...prev.filter((p) => p.key !== scenarioItem.key),
        {
          ...updated,
          scenarioValues: [
            ...updated.scenarioValues.filter((p) => p.segmentId !== segment.id),
            {
              ...newScenarioValue,
              allNewValues: allNewValues,
            },
          ],
        },
      ];
    });
    form.setFieldsValue(allNewValues);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin />
      </div>
    );
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={onValuesChange}
      initialValues={scenarioValue?.allNewValues || {}}
    >
      <Row gutter={[8, 8]} align="middle" justify="space-between">
        <Col span={9}>
          <h4>Commodity</h4>
        </Col>
        <Col span={5} align="center">
          <h4>New Value</h4>
        </Col>
        <Col span={5} align="right">
          <h4>Current</h4>
        </Col>
        <Col span={5} align="right">
          <h4>Increase</h4>
        </Col>
      </Row>
      <Row gutter={[8, 8]} align="middle" justify="space-between">
        <Col span={9}>
          <h4>
            Total Income <small>{currencyUnitName}</small>
          </h4>
        </Col>
        <Col span={5} align="center">
          <h4>
            {percentage
              ? `${scenarioIncrease.totalPercentage}%`
              : thousandFormatter(scenarioIncrease?.totalAbsolute)}
          </h4>
        </Col>
        <Col span={5} align="right">
          <h4>{thousandFormatter(segment.total_current_income?.toFixed(2))}</h4>
        </Col>
        <Col span={5} align="right">
          <h4>
            {percentage
              ? thousandFormatter(scenarioIncrease?.totalAbsolute)
              : `${scenarioIncrease.totalPercentage}%`}
          </h4>
        </Col>
      </Row>
      {commodityQuestions.map((c) => (
        <div key={c.commodity_id}>
          <Divider />
          {c.questions.map((question) => (
            <Question
              key={`scenario-${segment.id}-${c.case_commodity}-${question.id}`}
              form={form}
              segment={segment}
              commodity={c}
              percentage={percentage}
              {...question}
              enableEditCase={enableEditCase}
            />
          ))}
        </div>
      ))}
    </Form>
  );
};

const Scenario = ({
  index,
  scenarioItem,
  renameScenario,
  onDelete,
  hideDelete,
  dashboardData,
  commodityQuestions,
  segmentTabs,
  percentage,
  setScenarioData,
  currentScenarioValues = {},
  enableEditCase,
}) => {
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(dashboardData[0].id);
  const [newName, setNewName] = useState(scenarioItem.name);
  const [newDescription, setNewDescription] = useState(
    scenarioItem.description
  );
  const [confirmationModal, setConfimationModal] = useState(false);
  const [scenarioValues, setScenarioValues] = useState([]);
  const elScenarioModeling = useRef(null);

  const finishEditing = () => {
    renameScenario(index, newName, newDescription);
    setEditing(false);
  };

  const cancelEditing = () => {
    setNewName(scenarioItem.name);
    setNewDescription(scenarioItem.description);
    setEditing(false);
  };

  const currencyUnitName = useMemo(() => {
    const currency = commodityQuestions[0]?.currency;
    return currency ? `(${currency})` : "";
  }, [commodityQuestions]);

  useEffect(() => {
    if (dashboardData.length > 0) {
      let scenarioInitialData = [];
      if (isEmpty(currentScenarioValues)) {
        scenarioInitialData = dashboardData.map((segment) => ({
          segmentId: segment.id,
          name: segment.name,
        }));
      }
      // load scenario values
      if (!isEmpty(currentScenarioValues)) {
        scenarioInitialData = currentScenarioValues;
      }
      setScenarioValues(scenarioInitialData);
      // add scenarioValues into scenarioData
      setScenarioData((prev) => {
        const updated = prev.find((p) => p.key === scenarioItem.key);
        return [
          ...prev.filter((p) => p.key !== scenarioItem.key),
          {
            ...updated,
            scenarioValues: scenarioInitialData,
          },
        ];
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardData]);

  const chartData = useMemo(() => {
    const data = dashboardData.map((segment) => {
      const scenarioIncome =
        scenarioValues.find((s) => s.segmentId === segment.id)?.value || 0;
      const increaseIncome = scenarioIncome
        ? scenarioIncome - segment.total_current_income
        : scenarioIncome;
      const gapValue = scenarioIncome
        ? scenarioIncome >= segment.target
          ? 0
          : segment.target - scenarioIncome
        : segment.target - segment.total_current_income;
      return {
        name: segment.name,
        title: segment.name,
        stack: [
          {
            name: "Current Income",
            title: "Current Income",
            order: 1,
            total: segment.total_current_income,
            value: segment.total_current_income,
            color: "#00625F",
          },
          {
            name: "Income Increase",
            title: "Income Increase",
            order: 2,
            total: increaseIncome,
            value: increaseIncome,
            color: "#47D985",
          },
          {
            name: "Gap",
            title: "Gap",
            order: 3,
            total: gapValue > 0 ? gapValue : 0,
            value: gapValue > 0 ? gapValue : 0,
            color: "#F1C5B2",
          },
        ],
      };
    });
    return data;
  }, [dashboardData, scenarioValues]);

  const targetChartData = useMemo(() => {
    return [
      {
        name: "Benchmark",
        type: "line",
        symbol: "diamond",
        symbolSize: 15,
        color: "#FF5D00",
        lineStyle: {
          width: 0,
        },
        data: dashboardData.map((d) => ({
          name: "Benchmark",
          value: d?.target ? d.target.toFixed(2) : 0,
        })),
      },
    ];
  }, [dashboardData]);

  const ButtonEdit = () => (
    <Button
      size="small"
      shape="circle"
      type="secondary"
      icon={
        editing ? (
          <CheckCircleTwoTone twoToneColor="#52c41a" />
        ) : (
          <EditTwoTone twoToneColor="" />
        )
      }
      onClick={editing ? finishEditing : () => setEditing(true)}
    />
  );

  const ButtonCancelEdit = () => (
    <Button
      size="small"
      shape="circle"
      type="secondary"
      icon={<CloseCircleTwoTone twoToneColor="#eb2f96" />}
      onClick={cancelEditing}
    />
  );

  const ButtonDelete = () => (
    <Popover
      content={
        <Space align="end">
          <Button type="primary" onClick={() => setConfimationModal(false)}>
            Close
          </Button>
          <Button onClick={onDelete} danger>
            Delete
          </Button>
        </Space>
      }
      title="Are you sure want to delete this segment?"
      trigger="click"
      open={confirmationModal}
      onOpenChange={(e) => setConfimationModal(e)}
    >
      <Button
        size="small"
        shape="circle"
        type="secondary"
        icon={<DeleteTwoTone twoToneColor="#eb2f96" />}
      />
    </Popover>
  );

  const extra = !hideDelete ? (
    <Space>
      <ButtonEdit />
      {editing && <ButtonCancelEdit />}
      {!editing && <ButtonDelete />}
    </Space>
  ) : (
    <Space>
      <ButtonEdit />
      {editing && <ButtonCancelEdit />}
    </Space>
  );

  const renderScenarioCardHeader = () => {
    if (editing) {
      return (
        <Space direction="vertical" className="scenario-header-wrapper">
          <Input
            key={`scenario-name-${scenarioItem.key}`}
            placeholder="Scenario Name"
            defaultValue={scenarioItem.name}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input.TextArea
            key={`scenario-description-${scenarioItem.key}`}
            rows={4}
            placeholder="Scenario Description"
            defaultValue={scenarioItem.description}
            onChange={(e) => setNewDescription(e.target.value)}
          />
        </Space>
      );
    }
    return (
      <div className="scenario-header-wrapper">
        <h3>{scenarioItem.name}</h3>
        {scenarioItem?.description ? (
          <p>{scenarioItem.description}</p>
        ) : (
          <p>Scenario Description</p>
        )}
      </div>
    );
  };

  return (
    <Col span={24} ref={elScenarioModeling}>
      <Card
        className="income-driver-dashboard"
        title={renderScenarioCardHeader()}
        extra={
          <Space className="card-extra-wrapper">
            {enableEditCase ? extra : null}
            <SaveAsImageButton
              elementRef={elScenarioModeling}
              filename={scenarioItem.name}
            />
          </Space>
        }
        tabList={segmentTabs}
        activeTabKey={activeTab}
        onTabChange={(key) => setActiveTab(key)}
      >
        <Card.Grid
          style={{
            width: "100%",
          }}
          hoverable={false}
        >
          <Row
            className="income-driver-content"
            align="middle"
            justify="space-evenly"
            gutter={[8, 8]}
          >
            {dashboardData.map((segment) => (
              <Col
                key={segment.id}
                span={12}
                style={{
                  display: activeTab === segment.id ? "" : "none",
                  borderRight: "1px solid #f0f0f0",
                }}
              >
                <ScenarioInput
                  segment={segment}
                  commodityQuestions={commodityQuestions}
                  percentage={percentage}
                  setScenarioValues={setScenarioValues}
                  scenarioValue={scenarioValues.find(
                    (s) => s.segmentId === segment.id
                  )}
                  scenarioItem={scenarioItem}
                  setScenarioData={setScenarioData}
                  currencyUnitName={currencyUnitName}
                  enableEditCase={enableEditCase}
                />
              </Col>
            ))}
            <Col span={12}>
              <ChartScenarioModeling
                data={chartData || []}
                targetChartData={targetChartData}
                currencyUnitName={currencyUnitName}
              />
            </Col>
          </Row>
        </Card.Grid>
      </Card>
    </Col>
  );
};

export default Scenario;
