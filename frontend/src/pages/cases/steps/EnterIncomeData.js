import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { stepPath, CurrentCaseState } from "../store";
import { api, renderPercentageTag } from "../../../lib";
import { Row, Col, Space } from "antd";
import { EnterIncomeDataForm } from "../components";

const commodityOrder = ["focus", "secondary", "tertiary", "diversified"];

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
          if (cc.commodity_type === "focus") {
            dataTmp.push({
              groupName: "Primary Commodity",
              questionGroups: [tmp],
            });
          } else {
            diversifiedGroupTmp.push(tmp);
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
  }, [currentCase.id, currentCase.case_commodities]);

  return (
    <div id="enter-income-data">
      {/* Header */}
      <Row align="middle" gutter={[8, 8]}>
        <Col span={14} className="total-income-title-wrapper">
          Total Income
        </Col>
        <Col span={4} className="total-income-value-wrapper">
          <Space direction="vertical">
            <div className="level-text">Current level per year</div>
            <div className="value-text">123.00</div>
          </Space>
        </Col>
        <Col span={4} className="total-income-value-wrapper">
          <Space direction="vertical">
            <div className="level-text">Feasible level per year</div>
            <div className="value-text">457.00</div>
          </Space>
        </Col>
        <Col span={2} className="percentage-tag-wrapper">
          {renderPercentageTag("increase", 20)}
        </Col>
      </Row>

      {/* Questions */}
      <div className="income-questions-wrapper">
        {incomeDataDrivers.map((driver, driverIndex) => (
          <EnterIncomeDataForm
            key={driverIndex}
            driver={driver}
            driverIndex={driverIndex}
            segment={segment}
          />
        ))}
      </div>
    </div>
  );
};

export default EnterIncomeData;
