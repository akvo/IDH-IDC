import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { stepPath, CurrentCaseState } from "../store";
import { api } from "../../../lib";
import { Row, Col, Space, Tag } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

const commodityOrder = ["focus", "secondary", "tertiary", "diversified"];

const renderPercentageTag = (type = "default", value = 0) => {
  value = value.toFixed();
  value = `${value}%`;

  switch (type) {
    case "increase":
      return (
        <Tag color="success" icon={<ArrowUpOutlined />}>
          {value}
        </Tag>
      );
    case "decrease":
      return (
        <Tag color="error" icon={<ArrowDownOutlined />}>
          {value}
        </Tag>
      );

    default:
      return <Tag color="default">{value}</Tag>;
  }
};

/**
 * STEP 2
 */
const EnterIncomeData = ({ segment, setbackfunction, setnextfunction }) => {
  const navigate = useNavigate();
  const currentCase = CurrentCaseState.useState((s) => s);
  const [questionGroups, setQuestionGroups] = useState([]);

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
        const dataTmp = reorderedCaseCommodities
          .map((cc) => data.find((d) => d.commodity_id === cc.commodity))
          .filter((x) => x);
        setQuestionGroups(dataTmp);
      });
    }
  }, [currentCase.id, currentCase.case_commodities]);
  console.log(questionGroups);

  return (
    <div id="enter-income-data">
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
        <Col span={2}>{renderPercentageTag("increase", 20)}</Col>
      </Row>
    </div>
  );
};

export default EnterIncomeData;
