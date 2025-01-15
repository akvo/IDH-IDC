import React, { useMemo, useState } from "react";
import { Card, Row, Col, Space, Button } from "antd";
import { renderPercentageTag } from "../../../lib";
import { orderBy } from "lodash";
import { RightOutlined, DownOutlined } from "@ant-design/icons";

export const indentSize = 32;

const EnterIncomeDataQuestions = ({ question, rowColSpanSize }) => {
  const [collapsed, setCollapsed] = useState(
    question.question_type !== "aggregator"
  );

  const isCollapsible = useMemo(() => {
    return (
      question.question_type === "question" && question.childrens.length > 0
    );
  }, [question.question_type, question.childrens]);

  const hidden = useMemo(() => {
    if (question.question_type === "diversified") {
      return false;
    }
    if (question.question_type === "aggregator") {
      return true;
    }
    return false;
  }, [question.question_type]);

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
            paddingLeft: isCollapsible ? indentSize * (question.level - 1) : 10,
          }}
        >
          <Space size="small" align="center">
            {isCollapsible && (
              <Button
                type="link"
                size="small"
                onClick={() => setCollapsed(!collapsed)}
                icon={
                  collapsed ? (
                    <RightOutlined style={{ fontSize: 12 }} />
                  ) : (
                    <DownOutlined style={{ fontSize: 12 }} />
                  )
                }
              />
            )}
            {!hidden ? (
              <div>
                {question.text}
                {/* <small>({unitName})</small> */}
              </div>
            ) : null}
            {/* {infoText.length && !hidden ? (
              <Tooltip title={infoText}>
                <InfoCircleTwoTone
                  twoToneColor="#1677ff"
                  style={{ marginBottom: "6px" }}
                />
              </Tooltip>
            ) : null} */}
          </Space>
        </Col>
        <Col span={rowColSpanSize.value}></Col>
        <Col span={rowColSpanSize.value}></Col>
        <Col span={rowColSpanSize.percentage}></Col>
      </Row>
      {!collapsed
        ? orderBy(question.childrens, ["id"]).map((child) => (
            <EnterIncomeDataQuestions
              key={child.id}
              question={child}
              rowColSpanSize={rowColSpanSize}
            />
          ))
        : ""}
    </>
  );
};

const EnterIncomeDataDriver = ({ group, showSectionTitle, rowColSpanSize }) => {
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
        {group?.questions
          ? orderBy(group.questions, ["id"]).map((question) => (
              <EnterIncomeDataQuestions
                key={question.id}
                question={question}
                rowColSpanSize={rowColSpanSize}
              />
            ))
          : ""}
      </Col>
    </Row>
  );
};

const EnterIncomeDataForm = ({ driverIndex, driver, rowColSpanSize }) => {
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
          group={group}
          showSectionTitle={driverIndex > 0}
          rowColSpanSize={rowColSpanSize}
        />
      ))}
    </Card>
  );
};

export default EnterIncomeDataForm;
