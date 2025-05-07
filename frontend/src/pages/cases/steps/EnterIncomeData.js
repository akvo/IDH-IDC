import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  stepPath,
  CurrentCaseState,
  PrevCaseState,
  CaseUIState,
  CaseVisualState,
} from "../store";
import {
  api,
  calculateIncomePercentage,
  determineDecimalRound,
  renderPercentageTag,
  removeUndefinedObjectValue,
} from "../../../lib";
import { Row, Col, Space, message } from "antd";
import { EnterIncomeDataForm } from "../components";
import { thousandFormatter } from "../../../components/chart/options/common";
import { isEmpty, isEqual } from "lodash";

const rowColSpanSize = {
  gutter: [8, 8],
  label: 11,
  value: 5,
  percentage: 3,
};

const generateSegmentAnswersPayload = ({
  id: segmentId,
  answers: answerValues,
}) => {
  // Use reduce to accumulate answers grouped by question ID
  const groupedAnswers = Object.keys(answerValues).reduce((acc, key) => {
    const [fieldName, caseCommodityId, questionId] = key.split("-");
    const questionKey = `${caseCommodityId}-${questionId}`;

    if (!acc[questionKey]) {
      acc[questionKey] = {
        case_commodity: parseInt(caseCommodityId),
        question: parseInt(questionId),
        segment: segmentId,
      };
    }

    if (fieldName === "current") {
      acc[questionKey].current_value = answerValues[key] || null;
    } else if (fieldName === "feasible") {
      acc[questionKey].feasible_value = answerValues[key] || null;
    }

    return acc;
  }, {});
  // Convert the grouped object into an array
  return Object.values(groupedAnswers);
};

/**
 * STEP 2
 */
const EnterIncomeData = ({
  segment,
  setbackfunction,
  setnextfunction,
  setsavefunction,
}) => {
  const navigate = useNavigate();
  const currentCase = CurrentCaseState.useState((s) => s);
  const prevCaseSegments = PrevCaseState.useState((s) => s.segments);
  const [sectionTotalValues, setSectionTotalValues] = useState({});
  const incomeDataDrivers = CaseVisualState.useState(
    (s) => s.incomeDataDrivers
  );
  const { enableEditCase } = CaseUIState.useState((s) => s.general);

  const [messageApi, contextHolder] = message.useMessage();

  const upateCaseButtonState = (value) => {
    CaseUIState.update((s) => ({
      ...s,
      caseButton: value,
    }));
  };

  const handleSaveIncomeData = useCallback(
    ({ allowNavigate = false }) => {
      if (!enableEditCase) {
        return;
      }

      const allAnswers = currentCase?.segments?.flatMap((s) => s.answers);
      if (!isEmpty(allAnswers)) {
        // detect is payload updated
        const isUpdated =
          prevCaseSegments
            .map((prev) => {
              prev = {
                ...prev,
                benchmark: null, // set to null
                answers: removeUndefinedObjectValue(prev?.answers || {}),
              };
              let findPayload = currentCase.segments.find(
                (curr) => curr.id === prev.id
              );
              if (!findPayload) {
                // handle deleted segment
                return true;
              }
              findPayload = {
                ...findPayload,
                benchmark: null, // set to null
                answers: removeUndefinedObjectValue(findPayload?.answers || {}),
              };
              const equal = isEqual(
                removeUndefinedObjectValue(prev),
                removeUndefinedObjectValue(findPayload)
              );
              return !equal;
            })
            .filter((x) => x)?.length > 0;

        const segmentPayloads = currentCase.segments.map((s) => {
          let answerPayload = [];
          if (!isEmpty(s?.answers)) {
            answerPayload = generateSegmentAnswersPayload({ ...s });
          }
          return {
            id: s.id,
            name: s.name,
            case: s.case,
            region: s.region,
            target: s.target,
            adult: s.adult,
            child: s.child,
            answers: answerPayload,
          };
        });

        upateCaseButtonState({ loading: true });
        api
          .put(`/segment?updated=${isUpdated}`, segmentPayloads)
          .then((res) => {
            const { data } = res;
            PrevCaseState.update((s) => ({
              ...s,
              segments: data,
            }));
            messageApi.open({
              type: "success",
              content: "Income data saved successfully.",
            });
            if (allowNavigate) {
              setTimeout(() => {
                navigate(`/case/${currentCase.id}/${stepPath.step3.label}`);
              }, 100);
            }
          })
          .catch((e) => {
            console.error(e);
            const { status, data } = e.response;
            let errorText = "Failed to save income data.";
            if (status === 403) {
              errorText = data.detail;
            }
            messageApi.open({
              type: "error",
              content: errorText,
            });
          })
          .finally(() => {
            upateCaseButtonState({ loading: false });
          });
      }
    },
    [
      currentCase.id,
      currentCase.segments,
      messageApi,
      navigate,
      prevCaseSegments,
      enableEditCase,
    ]
  );

  const backFunction = useCallback(() => {
    navigate(-1);
    // navigate(`/case/${currentCase.id}/${stepPath.step1.label}`);
  }, [navigate]);

  const nextFunction = useCallback(() => {
    handleSaveIncomeData({ allowNavigate: true });
  }, [handleSaveIncomeData]);

  const saveFunction = useCallback(() => {
    handleSaveIncomeData({ allowNavigate: false });
  }, [handleSaveIncomeData]);

  useEffect(() => {
    if (setbackfunction) {
      setbackfunction(backFunction);
    }
    if (setnextfunction) {
      setnextfunction(nextFunction);
    }
    if (setsavefunction) {
      setsavefunction(saveFunction);
    }
  }, [
    setbackfunction,
    setnextfunction,
    setsavefunction,
    backFunction,
    nextFunction,
    saveFunction,
  ]);

  const totalIncome = useMemo(() => {
    if (isEmpty(sectionTotalValues)) {
      return {
        current: 0,
        feasible: 0,
        percentage: {
          type: "default",
          value: 0,
        },
      };
    }
    const current = Object.keys(sectionTotalValues)
      .map((key) => {
        const value = sectionTotalValues?.[key]?.current || 0;
        return value;
      })
      .reduce((a, b) => a + b);
    const feasible = Object.keys(sectionTotalValues)
      .map((key) => {
        const value = sectionTotalValues?.[key]?.feasible || 0;
        return value;
      })
      .reduce((a, b) => a + b);
    const percentage = calculateIncomePercentage({ current, feasible });
    return {
      current,
      feasible,
      percentage: {
        ...percentage,
      },
    };
  }, [sectionTotalValues]);

  return (
    <div>
      {/* Header */}
      <Row
        align="middle"
        gutter={rowColSpanSize.gutter}
        className="total-income-container"
      >
        <Col span={rowColSpanSize.label} className="total-income-title-wrapper">
          Total Income <small>/ year</small>
        </Col>
        <Col span={rowColSpanSize.value} className="total-income-value-wrapper">
          <Space direction="vertical">
            <div className="level-text">Current</div>
            <div className="value-text">
              {thousandFormatter(
                totalIncome.current,
                determineDecimalRound(totalIncome.current)
              )}
            </div>
          </Space>
        </Col>
        <Col span={rowColSpanSize.value} className="total-income-value-wrapper">
          <Space direction="vertical">
            <div className="level-text">Feasible</div>
            <div className="value-text">
              {thousandFormatter(
                totalIncome.feasible,
                determineDecimalRound(totalIncome.feasible)
              )}
            </div>
          </Space>
        </Col>
        <Col
          span={rowColSpanSize.percentage}
          className="percentage-tag-wrapper"
        >
          {renderPercentageTag(
            totalIncome.percentage.type,
            totalIncome.percentage.value
          )}
        </Col>
      </Row>

      {/* Questions */}
      <Row className="income-questions-wrapper" gutter={[10, 10]}>
        {incomeDataDrivers.map((driver, driverIndex) => (
          <Col span={24} key={driverIndex}>
            <EnterIncomeDataForm
              driver={driver}
              driverIndex={driverIndex}
              segment={segment}
              rowColSpanSize={rowColSpanSize}
              sectionTotalValues={sectionTotalValues}
              setSectionTotalValues={setSectionTotalValues}
            />
          </Col>
        ))}
      </Row>

      {contextHolder}
    </div>
  );
};

export default EnterIncomeData;
