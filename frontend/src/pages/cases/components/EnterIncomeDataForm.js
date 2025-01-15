import React, { useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Space,
  Button,
  Form,
  InputNumber,
  Tooltip,
} from "antd";
import { orderBy } from "lodash";
import {
  DownOutlined,
  InfoCircleOutlined,
  LockOutlined,
  UpOutlined,
} from "@ant-design/icons";
import {
  renderPercentageTag,
  InputNumberThousandFormatter,
} from "../../../lib";
import { commodities } from "../../../store/static";

const indentSize = 32;
const commoditiesBreakdown = ["secondary", "tertiary"];

const EnterIncomeDataQuestions = ({ group, question, rowColSpanSize }) => {
  const [collapsed, setCollapsed] = useState(
    question.question_type !== "aggregator"
  );

  const fieldKey = `${group.id}-${question.id}`;

  const checkFocus = group.commodity_type === "focus";

  const checkBreakdownValue =
    commoditiesBreakdown.includes(group.commodity_type) && group.breakdown;

  const hidden =
    (question.question_type === "aggregator" && checkFocus) ||
    (question.question_type === "aggregator" && checkBreakdownValue);

  const isCollapsible =
    question.question_type === "question" && question.childrens.length > 0;

  const disableInput = isCollapsible && !collapsed;
  // const disableInput = !enableEditCase
  //   ? true
  //   : checkFocus
  //   ? disabled
  //   : checkBreakdownValue
  //   ? disabled
  //   : checkBreakdownValue;

  const unitName = useMemo(
    () =>
      question.unit
        .split("/")
        .map((u) => u.trim())
        .map((u) =>
          u === "crop"
            ? commodities
                .find((c) => c.id === group?.commodity_id)
                ?.name?.toLowerCase() || ""
            : group?.[u]
        )
        .join(" / "),
    [question.unit, group]
  );

  return (
    <>
      <Row
        align="middle"
        gutter={rowColSpanSize.gutter}
        style={{
          display: hidden && "none",
          padding: "10px 20px",
        }}
      >
        <Col
          span={rowColSpanSize.label}
          style={{
            paddingLeft:
              !isCollapsible && question.level === 1
                ? 10
                : indentSize * (question.level - 1),
          }}
        >
          <Row align="middle">
            <Col span={23}>
              <Space size="small" align="center">
                {isCollapsible && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setCollapsed(!collapsed)}
                    icon={
                      collapsed ? (
                        <DownOutlined style={{ fontSize: 12 }} />
                      ) : (
                        <UpOutlined style={{ fontSize: 12 }} />
                      )
                    }
                  />
                )}
                {!hidden ? (
                  <div>
                    {question.text} <small>({unitName})</small>
                  </div>
                ) : null}
                {question?.description && !hidden ? (
                  <Tooltip title={question.description} placement="right">
                    <InfoCircleOutlined style={{ fontSize: 14 }} />
                  </Tooltip>
                ) : null}
              </Space>
            </Col>
            {disableInput && (
              <Col span={1} align="end">
                <LockOutlined style={{ fontSize: 14 }} />
              </Col>
            )}
          </Row>
        </Col>
        <Col span={rowColSpanSize.value}>
          <Form.Item
            name={`current-${fieldKey}`}
            className="current-feasible-field"
          >
            <InputNumber
              style={{ width: "100%" }}
              controls={false}
              disabled={disableInput}
              {...InputNumberThousandFormatter}
            />
          </Form.Item>
        </Col>
        <Col span={rowColSpanSize.value}>
          <Form.Item
            name={`feasible-${fieldKey}`}
            className="current-feasible-field"
          >
            <InputNumber
              style={{ width: "100%" }}
              controls={false}
              disabled={disableInput}
              {...InputNumberThousandFormatter}
            />
          </Form.Item>
        </Col>
        <Col
          span={rowColSpanSize.percentage}
          className="percentage-tag-wrapper"
        >
          {renderPercentageTag("increase", 10)}
        </Col>
      </Row>
      {!collapsed && (checkFocus || checkBreakdownValue)
        ? orderBy(question.childrens, ["id"]).map((child) => (
            <EnterIncomeDataQuestions
              key={child.id}
              group={group}
              question={child}
              rowColSpanSize={rowColSpanSize}
            />
          ))
        : ""}
    </>
  );
};

const EnterIncomeDataDriver = ({
  segment,
  group,
  showSectionTitle,
  rowColSpanSize,
}) => {
  const [form] = Form.useForm();

  const sectionTitle = useMemo(() => {
    if (group.commodity_type === "secondary") {
      return `Secondary Commodity (${group.commodity_name})`;
    }
    if (group.commodity_type === "tertiary") {
      return `Tertiary Commodity (${group.commodity_name})`;
    }
    return "Other Diversified Income";
  }, [group.commodity_type, group.commodity_name]);

  return (
    <Row align="middle">
      {/* Section Title */}
      {showSectionTitle && (
        <Col span={24} className="section-title-wrapper">
          <Row align="middle" gutter={rowColSpanSize.gutter}>
            <Col span={rowColSpanSize.label} className="title-text">
              {sectionTitle}
            </Col>
            <Col span={rowColSpanSize.value} className="value-text">
              123.00
            </Col>
            <Col span={rowColSpanSize.value} className="value-text">
              457.99
            </Col>
            <Col
              span={rowColSpanSize.percentage}
              className="percentage-tag-wrapper"
            >
              {renderPercentageTag("default", 0)}
            </Col>
          </Row>
        </Col>
      )}
      <Col span={24}>
        <Form
          name={`enter-income-data-${segment.id}-${group.id}`}
          layout="vertical"
          form={form}
          // onValuesChange={onValuesChange}
        >
          {group?.questions
            ? orderBy(group.questions, ["id"]).map((question) => (
                <EnterIncomeDataQuestions
                  key={question.id}
                  group={group}
                  question={question}
                  rowColSpanSize={rowColSpanSize}
                />
              ))
            : ""}
        </Form>
      </Col>
    </Row>
  );
};

const EnterIncomeDataForm = ({
  segment,
  driverIndex,
  driver,
  rowColSpanSize,
}) => {
  const cardTitle = useMemo(() => {
    if (driverIndex === 0) {
      return `${driver.groupName} (${driver.questionGroups[0].commodity_name})`;
    }
    return driver.groupName;
  }, [driver.groupName, driver.questionGroups, driverIndex]);

  return (
    <Card
      title={
        // Card Header
        <Row align="middle" gutter={rowColSpanSize.gutter}>
          <Col span={rowColSpanSize.label} className="title-text">
            {cardTitle}
          </Col>
          <Col span={rowColSpanSize.value} className="value-text">
            123.00
          </Col>
          <Col span={rowColSpanSize.value} className="value-text">
            457.00
          </Col>
          <Col
            span={rowColSpanSize.percentage}
            className="percentage-tag-wrapper"
          >
            {renderPercentageTag("default", 0)}
          </Col>
        </Row>
      }
    >
      {driver.questionGroups.map((group, groupIndex) => (
        <EnterIncomeDataDriver
          key={`${driverIndex}-${groupIndex}`}
          segment={segment}
          group={group}
          showSectionTitle={driverIndex > 0}
          rowColSpanSize={rowColSpanSize}
        />
      ))}
    </Card>
  );
};

export default EnterIncomeDataForm;
