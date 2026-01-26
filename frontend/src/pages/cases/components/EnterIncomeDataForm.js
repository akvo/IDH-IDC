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
  roundToDecimal,
} from "../../../lib";
import { commodities } from "../../../store/static";
import { CaseUIState, CurrentCaseState } from "../store";
import { thousandFormatter } from "../../../components/chart/options/common";
import { handleQuestionType } from "../utils";

const indentSize = 32;
const commoditiesBreakdown = ["secondary", "tertiary"];

const EnterIncomeDataQuestions = ({
  form,
  group,
  question,
  rowColSpanSize,
}) => {
  const { enableEditCase } = CaseUIState.useState((s) => s.general);
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

  const disableInput = !enableEditCase ? true : isCollapsible && !collapsed;

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
          padding: "6px 12px",
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
                        <DownOutlined style={{ fontSize: 10 }} />
                      ) : (
                        <UpOutlined style={{ fontSize: 10 }} />
                      )
                    }
                  />
                )}
                {!hidden ? (
                  <div style={{ fontSize: 14 }}>
                    {question.text}{" "}
                    <small style={{ fontSize: 12 }}>({unitName})</small>
                  </div>
                ) : null}
                {question?.description && !hidden ? (
                  <Tooltip title={question.description} placement="right">
                    <InfoCircleOutlined style={{ fontSize: 12 }} />
                  </Tooltip>
                ) : null}
              </Space>
            </Col>
            {disableInput && (
              <Col span={1} align="end">
                <LockOutlined style={{ fontSize: 12 }} />
              </Col>
            )}
          </Row>
        </Col>
        <Col span={rowColSpanSize.value}>
          <Form.Item
            name={`current-${fieldKey}`}
            className="current-feasible-field"
            getValueProps={(value) => ({
              value: value ? parseFloat(value?.toFixed(2)) : value,
            })}
          >
            <InputNumber
              style={{ width: "100%" }}
              controls={false}
              disabled={disableInput}
              size="small"
              {...InputNumberThousandFormatter}
            />
          </Form.Item>
        </Col>
        <Col span={rowColSpanSize.value}>
          <Form.Item
            name={`feasible-${fieldKey}`}
            className="current-feasible-field"
            getValueProps={(value) => ({
              value: value ? parseFloat(value?.toFixed(2)) : value,
            })}
          >
            <InputNumber
              style={{ width: "100%" }}
              controls={false}
              disabled={disableInput}
              size="small"
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
  const currentCase = CurrentCaseState.useState((s) => s);

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

  const flattenQuestionList = useMemo(() => {
    const questions = !group ? [] : flatten(group.questions);
    return questions;
  }, [group]);

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

  // Helper function to update section total values
  const updateSectionTotalValues = (commodity_type, fieldName, value) => {
    setSectionTotalValues((prev) => ({
      ...prev,
      [commodity_type]: {
        ...prev?.[commodity_type],
        [fieldName]: value,
      },
    }));
  };

  const initialDriverValues = useMemo(() => {
    if (!isEmpty(segment?.answers)) {
      return segment.answers;
    }
    return {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateChildrenValues = (question, fieldKey, values) => {
    const childrenQuestions = flattenQuestionList.filter(
      (q) => q.parent === question?.parent
    );
    const allChildrensIds = childrenQuestions.map((q) => `${fieldKey}-${q.id}`);
    return allChildrensIds.reduce((acc, id) => {
      const value = values?.[id];
      if (value) {
        acc.push({ id, value });
      }
      return acc;
    }, []);
  };

  const onValuesChange = (changedValue, allValues) => {
    const key = Object.keys(changedValue)[0];
    const [fieldName, caseCommodityId, questionId] = key.split("-");
    const fieldKey = `${fieldName}-${caseCommodityId}`;

    const commodity = currentCase.case_commodities.find(
      (cc) => cc.id === parseInt(caseCommodityId)
    );

    const question = flattenQuestionList.find(
      (q) => q.id === parseInt(questionId)
    );
    const parentQuestion = flattenQuestionList.find(
      (q) => q.id === question?.parent
    );

    handleQuestionType(
      question,
      commodity,
      fieldName,
      allValues,
      fieldKey,
      flattenQuestionList,
      updateSectionTotalValues
    );

    const allChildrensValues = calculateChildrenValues(
      question,
      fieldKey,
      allValues
    );
    const sumAllChildrensValues = parentQuestion?.default_value
      ? getFunctionDefaultValue(parentQuestion, fieldKey, allChildrensValues)
      : allChildrensValues.reduce((acc, { value }) => acc + value, 0);

    const parentQuestionField = `${fieldKey}-${question?.parent}`;
    if (parentQuestion) {
      form.setFieldValue(
        parentQuestionField,
        roundToDecimal(sumAllChildrensValues)
      );
      updateSectionTotalValues(
        commodity.commodity_type,
        fieldName,
        roundToDecimal(sumAllChildrensValues)
      );
    }

    if (parentQuestion?.parent) {
      onValuesChange(
        { [parentQuestionField]: sumAllChildrensValues },
        form.getFieldsValue()
      );
    }

    updateCurrentSegmentState({
      answers: { ...segment?.answers, ...form.getFieldsValue() },
    });
  };

  useEffect(() => {
    if (!isEmpty(initialDriverValues)) {
      const onLoad = ({ key }) => {
        const [fieldName, caseCommodityId, questionId] = key.split("-");
        const fieldKey = `${fieldName}-${caseCommodityId}`;

        const commodity = currentCase.case_commodities.find(
          (cc) => cc.id === parseInt(caseCommodityId)
        );

        const question = flattenQuestionList.find(
          (q) => q.id === parseInt(questionId)
        );
        const parentQuestion = flattenQuestionList.find(
          (q) => q.id === question?.parent
        );

        handleQuestionType(
          question,
          commodity,
          fieldName,
          initialDriverValues,
          fieldKey,
          flattenQuestionList,
          updateSectionTotalValues
        );

        const parentQuestionField = `${fieldKey}-${question?.parent}`;

        // TODO :: remove this code to fix issue total income/section total (DONT REMOVE)
        /**
         * e.g. primary section total should be 1400
         * but if this part of code active the section total become 1600
         * ONLY RUN THIS IF PARENT QUESTION VALUE === 0 TO RE-EVALUATE THE TOTAL INCOME
         */
        const parentQuestionValue =
          initialDriverValues?.[parentQuestionField] || 0;

        if (
          parentQuestion?.question_type === "aggregator" &&
          !parentQuestionValue &&
          currentCase?.import_id
        ) {
          const allChildrensValues = calculateChildrenValues(
            question,
            fieldKey,
            initialDriverValues
          );

          const sumAllChildrensValues = parentQuestion?.default_value
            ? getFunctionDefaultValue(
                parentQuestion,
                fieldKey,
                allChildrensValues
              )
            : allChildrensValues.reduce((acc, { value }) => acc + value, 0);
          if (parentQuestion) {
            // use parent value if they already have value
            const formValue = parentQuestionValue
              ? roundToDecimal(parentQuestionValue)
              : roundToDecimal(sumAllChildrensValues);
            // EOL use parent value if they already have value
            form.setFieldValue(parentQuestionField, formValue);
            // trigger on change
            onValuesChange(
              { [parentQuestionField]: formValue },
              form.getFieldsValue()
            );
            // eol trigger on change
            updateSectionTotalValues(
              commodity.commodity_type,
              fieldName,
              sumAllChildrensValues
            );
          }
        }
        // EOL RECALCULATE TOTAL INCOME
        // EOL remove this code to fix issue total income/section total

        if (parentQuestion?.parent) {
          onLoad({ key: parentQuestionField });
        }
      };

      setTimeout(() => {
        Object.keys(initialDriverValues).forEach((key) => {
          onLoad({ key });
        });
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDriverValues, currentCase?.import_id]);

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
          form={form}
          name={`enter-income-data-${segment.id}-${group.id}`}
          layout="vertical"
          onValuesChange={onValuesChange}
          initialValues={initialDriverValues}
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
