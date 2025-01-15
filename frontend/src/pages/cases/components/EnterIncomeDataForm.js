import React, { useEffect, useMemo, useState } from "react";
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
import { isEmpty, orderBy } from "lodash";
import {
  DownOutlined,
  InfoCircleOutlined,
  LockOutlined,
  UpOutlined,
} from "@ant-design/icons";
import {
  renderPercentageTag,
  InputNumberThousandFormatter,
  flatten,
  getFunctionDefaultValue,
  determineDecimalRound,
  calculateIncomePercentage,
} from "../../../lib";
import { commodities } from "../../../store/static";
import { CurrentCaseState } from "../store";
import { thousandFormatter } from "../../../components/chart/options/common";

const indentSize = 32;
const commoditiesBreakdown = ["secondary", "tertiary"];

const EnterIncomeDataQuestions = ({
  form,
  group,
  question,
  rowColSpanSize,
}) => {
  const [collapsed, setCollapsed] = useState(
    question.question_type !== "aggregator"
  );

  // fieldKey format: [case_commodity]-[question_id]
  const fieldKey = `${group.id}-${question.id}`;
  const currentValue = Form.useWatch(`current-${fieldKey}`, form);
  const feasibleValue = Form.useWatch(`feasible-${fieldKey}`, form);

  const percentage = useMemo(() => {
    return calculateIncomePercentage({
      current: currentValue,
      feasible: feasibleValue,
    });
  }, [currentValue, feasibleValue]);

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
          {renderPercentageTag(percentage.type, percentage.value)}
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
  sectionTotalValues,
  setSectionTotalValues,
}) => {
  const [form] = Form.useForm();

  const sectionCurrentValue =
    sectionTotalValues?.[group.commodity_type]?.current || 0;
  const sectionFeasibleValue =
    sectionTotalValues?.[group.commodity_type]?.feasible || 0;

  const sectionPercentage = useMemo(() => {
    return calculateIncomePercentage({
      current: sectionCurrentValue,
      feasible: sectionFeasibleValue,
    });
  }, [sectionCurrentValue, sectionFeasibleValue]);

  const sectionTitle = useMemo(() => {
    if (group.commodity_type === "secondary") {
      return `Secondary Commodity (${group.commodity_name})`;
    }
    if (group.commodity_type === "tertiary") {
      return `Tertiary Commodity (${group.commodity_name})`;
    }
    return "Other Diversified Income";
  }, [group.commodity_type, group.commodity_name]);

  const flattenQuestionList = useMemo(
    () => (!group ? [] : flatten(group.questions)),
    [group]
  );

  const updateCurrentSegmentState = (updatedSegmentValue) => {
    CurrentCaseState.update((s) => {
      s.segments = s.segments.map((prev) => {
        if (prev.id === segment.id) {
          return {
            ...prev,
            ...updatedSegmentValue,
          };
        }
        return prev;
      });
    });
  };

  // Use reduce to accumulate answers grouped by question ID
  // TODO :: Transform to this type of value on post/put
  // const groupedAnswers = Object.keys(allValues).reduce((acc, key) => {
  //   const [fieldName, caseCommodityId, questionId] = key.split("-");
  //   const questionKey = `${caseCommodityId}-${questionId}`;

  //   if (!acc[questionKey]) {
  //     acc[questionKey] = {
  //       case_commodity: parseInt(caseCommodityId, 10),
  //       question: parseInt(questionId),
  //       segment: segment.id,
  //     };
  //   }

  //   if (fieldName === "current") {
  //     acc[questionKey].current_value = allValues[key] || null;
  //   } else if (fieldName === "feasible") {
  //     acc[questionKey].feasible_value = allValues[key] || null;
  //   }

  //   return acc;
  // }, {});
  // // Convert the grouped object into an array
  // const answers = Object.values(groupedAnswers);
  // eol TODO

  // Helper function to update section total values
  const updateSectionTotalValues = (fieldName, value) => {
    setSectionTotalValues((prev) => ({
      ...prev,
      [group.commodity_type]: {
        ...prev?.[group.commodity_type],
        [fieldName]: value,
      },
    }));
  };

  const onValuesChange = (changedValue, allValues) => {
    // Extract the key and parse its components
    const key = Object.keys(changedValue)[0];
    const [fieldName, caseCommodityId, questionId] = key.split("-");
    const fieldKey = `${fieldName}-${caseCommodityId}`;

    // Find the current question and its parent
    const question = flattenQuestionList.find(
      (q) => q.id === parseInt(questionId)
    );
    const parentQuestion = flattenQuestionList.find(
      (q) => q.id === question?.parent
    );

    // Handle aggregator questions
    if (!question?.parent && question?.question_type === "aggregator") {
      updateSectionTotalValues(fieldName, changedValue[key]);
      return;
    }

    // Handle diversified questions
    if (!question?.parent && question?.question_type === "diversified") {
      const diversifiedQuestions = flattenQuestionList.filter(
        (q) => q.question_type === "diversified"
      );
      const diversifiedQids = diversifiedQuestions.map(
        (q) => `${fieldKey}-${q.id}`
      );
      const sumAllDiversifiedValues = diversifiedQids.reduce((acc, id) => {
        const value = allValues?.[id];
        return value ? acc + value : acc;
      }, 0);
      updateSectionTotalValues(fieldName, sumAllDiversifiedValues);
      return;
    }

    // Gather all children question values
    const childrenQuestions = flattenQuestionList.filter(
      (q) => q.parent === question?.parent
    );
    const allChildrensIds = childrenQuestions.map((q) => `${fieldKey}-${q.id}`);
    const allChildrensValues = allChildrensIds.reduce((acc, id) => {
      const value = allValues?.[id];
      if (value) {
        acc.push({ id, value });
      }
      return acc;
    }, []);

    // Calculate sum of children's values
    const sumAllChildrensValues = parentQuestion?.default_value
      ? getFunctionDefaultValue(parentQuestion, fieldKey, allChildrensValues)
      : allChildrensValues.reduce((acc, { value }) => acc + value, 0);

    // Update the parent question value
    const parentQuestionField = `${fieldKey}-${question?.parent}`;
    if (parentQuestion) {
      form.setFieldValue(parentQuestionField, sumAllChildrensValues);
      updateSectionTotalValues(fieldName, sumAllChildrensValues);
    }

    // Recursively update the parent's parent if necessary
    if (parentQuestion?.parent) {
      onValuesChange(
        { [parentQuestionField]: sumAllChildrensValues },
        form.getFieldsValue()
      );
    }

    // Update the current segment state with all values
    updateCurrentSegmentState({ answers: allValues });
  };

  useEffect(() => {
    // recalculate totalValues onLoad initial data
    if (!isEmpty(segment.answers)) {
      setTimeout(() => {
        Object.keys(segment.answers).forEach((key) => {
          const value = segment.answers[key];
          onValuesChange({ [key]: value }, form.getFieldsValue());
        });
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              {thousandFormatter(
                sectionCurrentValue,
                determineDecimalRound(sectionCurrentValue)
              )}
            </Col>
            <Col span={rowColSpanSize.value} className="value-text">
              {thousandFormatter(
                sectionFeasibleValue,
                determineDecimalRound(sectionFeasibleValue)
              )}
            </Col>
            <Col
              span={rowColSpanSize.percentage}
              className="percentage-tag-wrapper"
            >
              {renderPercentageTag(
                sectionPercentage.type,
                sectionPercentage.value
              )}
            </Col>
          </Row>
        </Col>
      )}
      <Col span={24}>
        <Form
          name={`enter-income-data-${segment.id}-${group.id}`}
          layout="vertical"
          form={form}
          onValuesChange={onValuesChange}
          initialValues={segment?.answers ? segment.answers : {}}
        >
          {group?.questions
            ? orderBy(group.questions, ["id"]).map((question) => (
                <EnterIncomeDataQuestions
                  key={question.id}
                  form={form}
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
  sectionTotalValues,
  setSectionTotalValues,
}) => {
  const cardTitle = useMemo(() => {
    if (driverIndex === 0) {
      return `${driver.groupName} (${driver.questionGroups[0].commodity_name})`;
    }
    return driver.groupName;
  }, [driver.groupName, driver.questionGroups, driverIndex]);

  const commodityTypes = driver.questionGroups.map((qg) => qg.commodity_type);

  const totalValues = useMemo(() => {
    const current = commodityTypes
      .map((ct) => sectionTotalValues?.[ct]?.current || 0)
      .reduce((a, b) => a + b);
    const feasible = commodityTypes
      .map((ct) => sectionTotalValues?.[ct]?.feasible || 0)
      .reduce((a, b) => a + b);
    const percentage = calculateIncomePercentage({
      current,
      feasible,
    });
    return {
      current,
      feasible,
      percentage: {
        ...percentage,
      },
    };
  }, [sectionTotalValues, commodityTypes]);

  return (
    <Card
      title={
        // Card Header
        <Row align="middle" gutter={rowColSpanSize.gutter}>
          <Col span={rowColSpanSize.label} className="title-text">
            {cardTitle}
          </Col>
          <Col span={rowColSpanSize.value} className="value-text">
            {thousandFormatter(
              totalValues.current,
              determineDecimalRound(totalValues.current)
            )}
          </Col>
          <Col span={rowColSpanSize.value} className="value-text">
            {thousandFormatter(
              totalValues.feasible,
              determineDecimalRound(totalValues.feasible)
            )}
          </Col>
          <Col
            span={rowColSpanSize.percentage}
            className="percentage-tag-wrapper"
          >
            {renderPercentageTag(
              totalValues.percentage.type,
              totalValues.percentage.value
            )}
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
          sectionTotalValues={sectionTotalValues}
          setSectionTotalValues={setSectionTotalValues}
        />
      ))}
    </Card>
  );
};

export default EnterIncomeDataForm;
