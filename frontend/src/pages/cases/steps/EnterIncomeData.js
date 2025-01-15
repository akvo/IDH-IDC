import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { stepPath, CurrentCaseState } from "../store";
import { api, renderPercentageTag } from "../../../lib";
import { Row, Col, Space } from "antd";
import { EnterIncomeDataForm } from "../components";

const commodityOrder = ["focus", "secondary", "tertiary", "diversified"];
const rowColSpanSize = {
  gutter: [8, 8],
  label: 11,
  value: 5,
  percentage: 3,
};

const addLevelIntoQuestions = ({ questions, level = 0 }) => {
  return questions.map((q) => {
    if (q.childrens.length) {
      q["childrens"] = addLevelIntoQuestions({
        questions: q.childrens,
        level: level + 1,
      });
    }
    if (!q.parent) {
      return {
        ...q,
        level: 0,
      };
    }
    return {
      ...q,
      level: level,
    };
  });
};

/**
 * STEP 2
 */
const EnterIncomeData = ({ segment, setbackfunction, setnextfunction }) => {
  const navigate = useNavigate();
  const currentCase = CurrentCaseState.useState((s) => s);
  const [incomeDataDrivers, setIncomeDataDrivers] = useState([]);

  const backFunction = useCallback(() => {
    navigate(`/case/${currentCase.id}/${stepPath.step1.label}`);
  }, [navigate, currentCase.id]);

  const nextFunction = useCallback(() => {
    navigate(`/case/${currentCase.id}/${stepPath.step3.label}`);
  }, [navigate, currentCase.id]);

  useEffect(() => {
    if (setbackfunction) {
      setbackfunction(backFunction);
    }
    if (setnextfunction) {
      setnextfunction(nextFunction);
    }
  }, [setbackfunction, setnextfunction, backFunction, nextFunction]);

  // Fetch questions for income data entry
  useEffect(() => {
    if (currentCase?.id && currentCase?.case_commodities?.length) {
      const reorderedCaseCommodities = commodityOrder
        .map((co) => {
          const findCommodity = currentCase.case_commodities.find(
            (cc) => cc.commodity_type === co
          );
          return findCommodity;
        })
        .filter((x) => x);

      api.get(`/questions/${currentCase.id}`).then((res) => {
        const { data } = res;
        const dataTmp = [];
        const diversifiedGroupTmp = [];
        // regroup the questions to follow new design format
        reorderedCaseCommodities.forEach((cc) => {
          const tmp = data.find((d) => d.commodity_id === cc.commodity);
          tmp["currency"] = currentCase.currency;
          tmp["questions"] = addLevelIntoQuestions({
            questions: tmp.questions,
          });
          if (cc.commodity_type === "focus") {
            dataTmp.push({
              groupName: "Primary Commodity",
              questionGroups: [{ ...cc, ...tmp }],
            });
          } else {
            diversifiedGroupTmp.push({ ...cc, ...tmp });
          }
        });
        // add diversified group
        dataTmp.push({
          groupName: "Diversified Income",
          questionGroups: diversifiedGroupTmp,
        });
        setIncomeDataDrivers(dataTmp);
      });
    }
  }, [currentCase.id, currentCase.case_commodities, currentCase.currency]);

  return (
    <div id="enter-income-data">
      {/* Header */}
      <Row
        align="middle"
        gutter={rowColSpanSize.gutter}
        className="total-income-container"
      >
        <Col span={rowColSpanSize.label} className="total-income-title-wrapper">
          Total Income
        </Col>
        <Col span={rowColSpanSize.value} className="total-income-value-wrapper">
          <Space direction="vertical">
            <div className="level-text">Current level per year</div>
            <div className="value-text">123.00</div>
          </Space>
        </Col>
        <Col span={rowColSpanSize.value} className="total-income-value-wrapper">
          <Space direction="vertical">
            <div className="level-text">Feasible level per year</div>
            <div className="value-text">457.00</div>
          </Space>
        </Col>
        <Col
          span={rowColSpanSize.percentage}
          className="percentage-tag-wrapper"
        >
          {renderPercentageTag("increase", 20)}
        </Col>
      </Row>

      {/* Questions */}
      <Row className="income-questions-wrapper" gutter={[20, 20]}>
        {incomeDataDrivers.map((driver, driverIndex) => (
          <Col span={24} key={driverIndex}>
            <EnterIncomeDataForm
              driver={driver}
              driverIndex={driverIndex}
              segment={segment}
              rowColSpanSize={rowColSpanSize}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default EnterIncomeData;
