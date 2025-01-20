import React, { useMemo } from "react";
import { Card, Col, Row, Space, Table } from "antd";
import { CurrentCaseState, CaseVisualState } from "../store";
import { thousandFormatter } from "../../../components/chart/options/common";

const CompareIncomeGap = () => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);

  const columns = useMemo(() => {
    return [
      {
        title: "Segment",
        dataIndex: "name",
        key: "name",
        width: "30%",
      },
      {
        title: "Number of farmers",
        dataIndex: "number_of_farmers",
        key: "number_of_farmers",
        width: "20%",
      },
      {
        title: "Income gap at current level",
        dataIndex: "current_income_gap",
        key: "current_income_gap",
        render: (value) => `${value} ${currentCase.currency}`,
      },
      {
        title: "Income gap at feasible level",
        dataIndex: "feasible_income_gap",
        key: "feasible_income_gap",
        render: (value) => `${value} ${currentCase.currency}`,
      },
    ];
  }, [currentCase.currency]);

  const dataSource = useMemo(() => {
    const res = dashboardData.map((d) => {
      const currentIncomeGap =
        d.target - d.total_current_income < 0
          ? 0
          : d.target - d.total_current_income;
      const feasibleIncomeGap =
        d.target - d.total_feasible_income < 0
          ? 0
          : d.target - d.total_feasible_income;
      return {
        id: d.id,
        name: d.name,
        number_of_farmers: d.number_of_farmers || 0,
        current_income_gap: thousandFormatter(currentIncomeGap, 2),
        feasible_income_gap: thousandFormatter(feasibleIncomeGap, 2),
      };
    });
    return res;
  }, [dashboardData]);

  return (
    <Card className="card-visual-wrapper">
      <Row gutter={[20, 20]} align="middle">
        <Col span={8}>
          <Space direction="vertical">
            <div className="section-title">
              Compare the income gap per segment with the number of farmers each
              segment represents.
            </div>
            <div className="section-description">
              This table gives an overview of the number of farmers in each
              segment, and the income gap at current and feasible levels. Use it
              to determine focus segments.
            </div>
          </Space>
        </Col>
        <Col span={16}>
          <Table
            className="compare-income-gap-table-wrapper"
            rowKey={(record) => record.id}
            columns={columns}
            dataSource={dataSource}
            pagination={false}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default CompareIncomeGap;
