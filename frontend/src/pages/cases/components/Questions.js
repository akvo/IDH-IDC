import React, { useEffect, useState } from "react";
import {
  Button,
  Row,
  Col,
  Form,
  InputNumber,
  Space,
  Switch,
  Popover,
} from "antd";
import {
  CaretDownFilled,
  CaretDownOutlined,
  CaretRightOutlined,
  CaretUpFilled,
  InfoCircleTwoTone,
} from "@ant-design/icons";
import { InputNumberThousandFormatter, indentSize, regexQuestionId } from "./";

const commoditiesBreakdown = ["secondary", "tertiary"];

const getQuestionFunctionInfo = (allQuestions, fnString) => {
  const fn = fnString.split(" ");
  const fnName = fn.reduce((acc, f) => {
    const id = f.match(regexQuestionId);
    const question = allQuestions.find((q) => q.id.toString() === id?.[1]);
    if (question) {
      acc.push(question.text);
      return acc;
    }
    if (id) {
      return acc;
    }
    if (f === "*") {
      acc.push("x");
      return acc;
    }
    acc.push(f);
    return acc;
  }, []);
  // remove if last element is *+-
  if (["*", "+", "-"].includes(fnName[fnName.length - 1])) {
    fnName.pop();
  }
  return fnName.join(" ");
};

const Questions = ({
  id,
  question_type,
  default_value,
  commodityName,
  allQuestions,
  text,
  unit,
  units,
  form,
  refresh,
  childrens,
  indent = 0,
}) => {
  const [infoText, setInfoText] = useState("");
  const [currentValue, setCurrentValue] = useState(0);
  const [feasibleValue, setFeasibleValue] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [collapsed, setCollapsed] = useState(question_type !== "aggregator");
  const [disabled, setDisabled] = useState(childrens.length > 0);

  const fieldKey = `${units.case_commodity}-${id}`;

  const checkFocus = units.commodity_type === "focus";

  const checkBreakdownValue =
    commoditiesBreakdown.includes(units.commodity_type) && units.breakdown;

  const hidden =
    (question_type === "aggregator" && checkFocus) ||
    (question_type === "aggregator" && checkBreakdownValue);

  const disableInput = checkFocus
    ? disabled
    : checkBreakdownValue
    ? disabled
    : checkBreakdownValue;

  const unitName = unit
    .split("/")
    .map((u) => u.trim())
    .map((u) => units?.[u])
    .join(" / ");

  useEffect(() => {
    if (default_value) {
      const fnText = getQuestionFunctionInfo(allQuestions, default_value);
      setInfoText(fnText);
    }
  }, [default_value, allQuestions]);

  useEffect(() => {
    if (currentValue && feasibleValue) {
      const percent = (feasibleValue / currentValue - 1) * 100;
      setPercentage(percent);
    }
  }, [currentValue, feasibleValue, setPercentage]);

  useEffect(() => {
    const current = form.getFieldValue(`current-${fieldKey}`);
    const feasible = form.getFieldValue(`feasible-${fieldKey}`);
    if (current && feasible) {
      setCurrentValue(current);
      setFeasibleValue(feasible);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, refresh]);

  return (
    <>
      <Row
        gutter={[8, 8]}
        style={{ borderBottom: "1px solid #f0f0f0", display: hidden && "none" }}
        align="middle"
      >
        <Col
          span={11}
          style={{
            paddingLeft: indent
              ? childrens.length > 0 && question_type !== "aggregator"
                ? indent - 40
                : question_type === "diversified"
                ? 54
                : indent
              : 10,
          }}
        >
          <Space size="small">
            {childrens.length > 0 && question_type !== "aggregator" && (
              <Button
                type="link"
                onClick={() => setCollapsed(!collapsed)}
                icon={
                  collapsed ? (
                    <CaretRightOutlined color="black" />
                  ) : (
                    <CaretDownOutlined color="black" />
                  )
                }
              />
            )}
            {!hidden ? (
              <h4>
                {text} <small>({unitName})</small>
              </h4>
            ) : null}
            {infoText.length && !hidden ? (
              <Popover content={<div className="fn-info">{infoText}</div>}>
                <InfoCircleTwoTone twoToneColor="#1677ff" />
              </Popover>
            ) : null}
          </Space>
        </Col>
        <Col span={2}>
          {(childrens.length > 0 && !hidden && checkFocus) ||
          (!hidden && checkBreakdownValue) ? (
            <Switch size="small" onChange={() => setDisabled(!disabled)} />
          ) : null}
        </Col>
        <Col span={4}>
          <Form.Item
            name={`current-${fieldKey}`}
            className="current-feasible-field"
          >
            <InputNumber
              style={{ width: "100%" }}
              disabled={disableInput}
              {...InputNumberThousandFormatter}
            />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item
            name={`feasible-${fieldKey}`}
            className="current-feasible-field"
          >
            <InputNumber
              style={{ width: "100%" }}
              disabled={disableInput}
              {...InputNumberThousandFormatter}
            />
          </Form.Item>
        </Col>
        <Col span={3}>
          <Space className="percentage-wrapper">
            {percentage === 0 ? null : percentage > 0 ? (
              <CaretUpFilled className="ceret-up" />
            ) : (
              <CaretDownFilled className="ceret-down" />
            )}
            <div
              className={
                percentage === 0
                  ? ""
                  : percentage > 0
                  ? "ceret-up"
                  : "ceret-down"
              }
            >
              {feasibleValue < currentValue
                ? -percentage.toFixed(2)
                : percentage.toFixed(2)}
              %
            </div>
          </Space>
        </Col>
      </Row>
      {!collapsed && (checkFocus || checkBreakdownValue)
        ? childrens.map((child) => (
            <Questions
              key={child.id}
              units={units}
              form={form}
              commodityName={commodityName}
              refresh={refresh}
              allQuestions={allQuestions}
              {...child}
              indent={indent + indentSize}
            />
          ))
        : null}
    </>
  );
};

export default Questions;
