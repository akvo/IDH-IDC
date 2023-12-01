import React, { useState, useEffect, useMemo } from "react";
import { Row, Col, Space, Form, InputNumber } from "antd";
import {
  Questions,
  indentSize,
  getFunctionDefaultValue,
  InputNumberThousandFormatter,
} from "./";
import { flatten } from "../../../lib";
import isEmpty from "lodash/isEmpty";
import { CaretDownFilled, CaretUpFilled } from "@ant-design/icons";

const IncomeDriverForm = ({
  group,
  groupIndex,
  commodity,
  segmentFormValues,
  setSegmentFormValues,
  segmentItem,
  currentCaseId,
  totalDiversifiedIncome,
  enableEditCase,
}) => {
  const [form] = Form.useForm();
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    // set current feasible initial value
    if (currentCaseId) {
      const findValue = segmentFormValues.find(
        (fv) => fv.key === segmentItem.key
      );
      if (!findValue && isEmpty(findValue)) {
        return;
      }
      Object.keys(findValue.answers).forEach((key) => {
        const val = findValue.answers[key];
        form.setFieldsValue({
          [key]: val,
        });
      });
      // refresh percentage
      setRefresh(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCaseId]);

  const flattenQuestionList = useMemo(() => {
    return flatten(group.questions);
  }, [group]);

  const onValuesChange = (value, currentValues) => {
    // handle form values
    const defaultFormValue = {
      ...segmentItem,
      case_commodity: commodity.case_commodity,
      answers: {},
    };
    const filteredFormValues = segmentFormValues.filter(
      (x) => x.key !== segmentItem.key
    );
    let currentFormValue = segmentFormValues.find(
      (x) => x.key === segmentItem.key
    );
    currentFormValue = isEmpty(currentFormValue)
      ? defaultFormValue
      : currentFormValue;
    setSegmentFormValues([
      ...filteredFormValues,
      {
        ...currentFormValue,
        case_commodity: commodity.case_commodity,
        answers: {
          ...currentFormValue.answers,
          ...currentValues,
        },
      },
    ]);
    // eol form values
    const id = Object.keys(value)[0];
    const [fieldName, caseCommodityId, questionId] = id.split("-");
    const dataType = `${fieldName}-${caseCommodityId}`;
    const question = flattenQuestionList.find(
      (q) => q.id === parseInt(questionId)
    );
    if (!question.parent) {
      setRefresh(!refresh);
      return;
    }
    const parentQuestion = flattenQuestionList.find(
      (q) => q.id === question.parent
    );

    const allChildrens = flattenQuestionList.filter(
      (q) => q.parent === question.parent
    );
    const allChildrensIds = allChildrens.map((q) => `${dataType}-${q.id}`);
    const allChildrensValues = allChildrensIds.reduce((acc, id) => {
      const value = currentValues?.[id];
      if (value) {
        acc.push({ id: id, value: value });
      }
      return acc;
    }, []);

    let sumAllChildrensValues = 0;

    if (!parentQuestion?.default_value) {
      sumAllChildrensValues = allChildrensValues.reduce(
        (acc, { value }) => acc + value,
        0
      );
    } else {
      sumAllChildrensValues = getFunctionDefaultValue(
        parentQuestion,
        dataType,
        allChildrensValues
      );
    }

    const parentQuestionId = `${dataType}-${question.parent}`;
    if (parentQuestion) {
      // handle form values
      setSegmentFormValues([
        ...filteredFormValues,
        {
          ...currentFormValue,
          case_commodity: commodity.case_commodity,
          answers: {
            ...currentFormValue.answers,
            ...currentValues,
            [parentQuestionId]: sumAllChildrensValues,
          },
        },
      ]);
      // eol handle form values
      form.setFieldsValue({
        [parentQuestionId]: sumAllChildrensValues,
      });
    }
    if (parentQuestion.parent) {
      onValuesChange(
        { [parentQuestionId]: sumAllChildrensValues },
        form.getFieldsValue()
      );
    }
    setRefresh(!refresh);
  };

  return (
    <div
      style={{
        backgroundColor: groupIndex ? "#ececec" : "transparent",
        // marginLeft: groupIndex ? -12 : 0,
        // marginRight: groupIndex ? -12 : 0,
      }}
    >
      {groupIndex === 1 && (
        <Row
          gutter={[8, 8]}
          align="middle"
          className="total-diversified-income"
          // style={{ marginLeft: "-4px", marginRight: "-4px" }}
        >
          <Col span={13}>
            <h3 className="diversified-income-title">Diversified Income</h3>
          </Col>
          <Col span={4}>
            <InputNumber
              style={{ width: "100%" }}
              value={totalDiversifiedIncome.current}
              disabled
              {...InputNumberThousandFormatter}
            />
          </Col>
          <Col span={4}>
            <InputNumber
              value={totalDiversifiedIncome.feasible}
              style={{ width: "100%" }}
              disabled
              {...InputNumberThousandFormatter}
            />
          </Col>
          <Col span={3}>
            <Space className="percentage-wrapper">
              {totalDiversifiedIncome.percent ===
              0 ? null : totalDiversifiedIncome.percent > 0 ? (
                <CaretUpFilled className="ceret-up" />
              ) : (
                <CaretDownFilled className="ceret-down" />
              )}
              <div
                className={
                  totalDiversifiedIncome.percent === 0
                    ? ""
                    : totalDiversifiedIncome.percent > 0
                    ? "ceret-up"
                    : "ceret-down"
                }
              >
                {totalDiversifiedIncome.feasible <
                totalDiversifiedIncome.current
                  ? -totalDiversifiedIncome.percent.toFixed(2)
                  : totalDiversifiedIncome.percent.toFixed(2)}
                %
              </div>
            </Space>
          </Col>
        </Row>
      )}
      <h3
        style={{
          paddingLeft: !groupIndex ? 24 : 45,
          backgroundColor: groupIndex ? "#dddddd" : "",
        }}
      >
        {groupIndex === 0
          ? "Focus Commodity:"
          : group.commodity_id === null
          ? "Other "
          : ""}{" "}
        {group.commodity_name}
      </h3>
      <Form
        name={`drivers-income-${segmentItem.key}-${groupIndex}`}
        layout="vertical"
        form={form}
        onValuesChange={onValuesChange}
      >
        {group.questions.map((question, questionIndex) => (
          <Questions
            key={question.id}
            indent={!groupIndex ? 0 : indentSize}
            units={commodity}
            form={form}
            refresh={refresh}
            commodityName={group?.commodity_name}
            allQuestions={flattenQuestionList}
            totalIncome={
              !groupIndex &&
              questionIndex === 0 &&
              question.question_type === "aggregator"
            }
            {...question}
            enableEditCase={enableEditCase}
          />
        ))}
      </Form>
    </div>
  );
};

export default IncomeDriverForm;
