import React, { useRef } from "react";
import { Row, Col, Card } from "antd";
import {
  ChartCurrentFeasible,
  ChartIncomeGap,
  ChartBigImpact,
  ChartMonetaryContribution,
  ChartExploreBreakdownDrivers,
  ChartIncomeLevelPerCommodities,
} from "../visualizations";
import { SaveAsImageButton } from "../../../components/utils";

const DashboardIncomeOverview = ({ dashboardData, currentCase }) => {
  const elCurrentFeasibleChart = useRef(null);
  const elIncomeGap = useRef(null);
  const elBigImpact = useRef(null);
  const elExploreBreakdownDrivers = useRef(null);
  const elMonetaryContribution = useRef(null);
  const elIncomeLevelPerCommodities = useRef(null);

  return (
    <Row id="income-overview-chart">
      <Col span={24}>
        <Card className="income-driver-dashboard">
          <Card.Grid
            style={{
              width: "100%",
            }}
            hoverable={false}
          >
            <Row className="income-driver-content" gutter={[16, 16]}>
              <Col
                span={12}
                ref={elCurrentFeasibleChart}
                className="income-overview-chart-wrapper"
              >
                <h2>
                  What are the current and feasible income levels for the
                  different segments?
                </h2>
                <p>
                  This graph shows you the actual household income components,
                  and the income target per segment
                </p>
                <SaveAsImageButton
                  elementRef={elCurrentFeasibleChart}
                  filename="What are the current and feasible income levels for the
                  different segments?"
                />
                <ChartCurrentFeasible
                  dashboardData={dashboardData}
                  currentCase={currentCase}
                />
              </Col>
              <Col
                span={12}
                ref={elIncomeGap}
                className="income-overview-chart-wrapper"
              >
                <h2>How big is the income gap?</h2>
                <p>
                  This graph shows you the actual household income components,
                  and the income target per segment
                </p>
                <SaveAsImageButton
                  elementRef={elIncomeGap}
                  filename="How big is the income gap?"
                />
                <ChartIncomeGap
                  dashboardData={dashboardData}
                  currentCase={currentCase}
                />
              </Col>
            </Row>
          </Card.Grid>
        </Card>
        <Card className="income-driver-dashboard">
          <Card.Grid
            style={{
              width: "100%",
            }}
            hoverable={false}
          >
            <Row className="income-driver-content" gutter={[16, 16]}>
              <Col
                span={12}
                ref={elBigImpact}
                className="income-overview-chart-wrapper"
              >
                <h2>Which drivers have the biggest impact on income?</h2>
                <p>
                  This ranking shows the elasticity of the driver and to which
                  the driver can influence income.
                </p>
                <SaveAsImageButton
                  elementRef={elBigImpact}
                  filename="Which drivers have the biggest impact on income?"
                  style={{ marginBottom: 12 }}
                />
                <ChartBigImpact dashboardData={dashboardData} />
              </Col>
              <Col
                span={12}
                ref={elExploreBreakdownDrivers}
                className="income-overview-chart-wrapper"
              >
                <h2>Explore the breakdown of drivers</h2>
                <p>
                  Select the driver for which you want to breakdown to be
                  visualised.
                </p>
                <SaveAsImageButton
                  elementRef={elExploreBreakdownDrivers}
                  filename="Explore the breakdown of drivers"
                  style={{ marginBottom: 12 }}
                />
                <ChartExploreBreakdownDrivers
                  dashboardData={dashboardData}
                  currentCase={currentCase}
                />
              </Col>
            </Row>
          </Card.Grid>
        </Card>
        <Card className="income-driver-dashboard">
          <Card.Grid
            style={{
              width: "100%",
            }}
            hoverable={false}
          >
            <Row className="income-driver-content">
              <Col
                span={24}
                ref={elMonetaryContribution}
                className="income-overview-chart-wrapper"
              >
                <h2>Monetary contribution of each driver to income.</h2>
                <SaveAsImageButton
                  elementRef={elMonetaryContribution}
                  filename="Monetary contribution of each driver to income"
                  style={{ marginBottom: 12 }}
                />
                <ChartMonetaryContribution
                  dashboardData={dashboardData}
                  currentCase={currentCase}
                />
              </Col>
            </Row>
          </Card.Grid>
        </Card>
        <Card className="income-driver-dashboard">
          <Card.Grid
            style={{
              width: "100%",
            }}
            hoverable={false}
          >
            <Row className="income-driver-content">
              <Col
                span={24}
                ref={elIncomeLevelPerCommodities}
                className="income-overview-chart-wrapper"
              >
                <h2>
                  <i>For landscape studies</i>
                </h2>
                <h2>
                  What are the income levels for the different commodities in
                  each segment?
                </h2>
                <p>
                  If you have data for different commodities, this graph
                  compares the income levels.
                </p>
                <SaveAsImageButton
                  elementRef={elIncomeLevelPerCommodities}
                  filename="What are the income levels for the different commodities in
                  each segment?"
                  style={{ marginBottom: 12 }}
                />
                <ChartIncomeLevelPerCommodities
                  dashboardData={dashboardData}
                  currentCase={currentCase}
                />
              </Col>
            </Row>
          </Card.Grid>
        </Card>
      </Col>
    </Row>
  );
};

export default DashboardIncomeOverview;
