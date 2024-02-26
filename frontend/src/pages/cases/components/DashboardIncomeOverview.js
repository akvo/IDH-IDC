import React, { useRef, useState } from "react";
import { Row, Col, Card, Space, Tooltip } from "antd";
import {
  ChartCurrentFeasible,
  ChartIncomeGap,
  ChartBigImpact,
  ChartMonetaryContribution,
  ChartExploreBreakdownDrivers,
  ChartIncomeLevelPerCommodities,
} from "../visualizations";
import { SaveAsImageButton, ShowLabelButton } from "../../../components/utils";
import { InfoCircleOutlined } from "@ant-design/icons";

const DashboardIncomeOverview = ({ dashboardData, currentCase }) => {
  const elCurrentFeasibleChart = useRef(null);
  const elIncomeGap = useRef(null);
  const elBigImpact = useRef(null);
  const elExploreBreakdownDrivers = useRef(null);
  const elMonetaryContribution = useRef(null);
  const elIncomeLevelPerCommodities = useRef(null);

  const [showLabelChartCurrentFeasible, setShowLabelChartCurrentFeasible] =
    useState(false);
  const [showLabelChartIncomeGap, setShowLabelChartIncomeGap] = useState(false);
  const [showLabelChartBigImpact, setShowLabelChartBigImpact] = useState(false);
  const [
    showLabelChartExploreBreakdownDrivers,
    setShowLabelChartExploreBreakdownDrivers,
  ] = useState(false);
  const [
    showLabelChartMonetaryContribution,
    setShowLabelChartMonetaryContribution,
  ] = useState(false);
  const [
    showLabelChartIncomeLevelPerCommodities,
    setShowLabelChartIncomeLevelPerCommodities,
  ] = useState(false);

  return (
    <Row
      id="income-overview-chart"
      gutter={[24, 64]}
      className="income-driver-dashboard"
    >
      <Col span={24}>
        <Row
          className="income-driver-content"
          gutter={[24, 24]}
          ref={elCurrentFeasibleChart}
        >
          <Col span={24} className="income-overview-chart-wrapper">
            <h2>
              What are the current and feasible income levels for the different
              segments?
            </h2>
            <p>
              This graph shows you the various components of actual household
              income.
              <br />
              <br />
              Insights: this graph helps reveal the composition of income,
              changes in key elements (primary crop revenue, diversified income,
              and cost of production for the primary crop) based on either the
              current or feasible income drivers. It also shows variations
              between segments.
            </p>
          </Col>
          <Col span={24}>
            <Card
              className="chart-card-wrapper"
              title={
                <Space align="center">
                  <div>Current and feasible income</div>
                  <Tooltip
                    className="info-tooltip"
                    title="The total household income is calculated by adding net-income from the focus commodity and diversified income. The net-income from the focus commodity is calculated by subtracting cost of production from the revenues from focus commodity."
                  >
                    <InfoCircleOutlined style={{ color: "#fff" }} />
                  </Tooltip>
                </Space>
              }
              extra={
                <Space align="center">
                  <ShowLabelButton
                    showLabel={showLabelChartCurrentFeasible}
                    setShowLabel={setShowLabelChartCurrentFeasible}
                    type="ghost-white"
                  />
                  <SaveAsImageButton
                    elementRef={elCurrentFeasibleChart}
                    filename="What are the current and feasible income levels for the different segments?"
                    type="ghost-white"
                  />
                </Space>
              }
            >
              <ChartCurrentFeasible
                dashboardData={dashboardData}
                currentCase={currentCase}
                showLabel={showLabelChartCurrentFeasible}
              />
            </Card>
          </Col>
        </Row>
      </Col>

      <Col span={24}>
        <Row
          className="income-driver-content"
          gutter={[24, 24]}
          ref={elIncomeGap}
        >
          <Col span={24} className="income-overview-chart-wrapper">
            <h2>What is the size of the income gap?</h2>
            <p>
              This graph shows the gap between the household income levels and
              the income target for the current scenario. It also shows the gap
              between &apos;feasible&apos; household income and the income
              target, i.e. household income if all income drivers are set to
              their feasible levels. It also highlights variations within
              segments.
              <br />
              <br />
              Insights: Often income gaps can vary across different segments and
              hence each segment may need it&apos;s own custom strategy. One
              size may not fit all.
              <br />
              <br />
              TIP! By clicking on an item in the legend you can make it appear
              or dissapear.
            </p>
          </Col>
          <Col span={24}>
            <Card
              className="chart-card-wrapper"
              title={
                <Space align="center">
                  <div>Income Gap</div>
                  <Tooltip
                    className="info-tooltip"
                    title="The income gap is the difference between the total household income of the farmers and the income target you have set. The current household income is calculated as the sum of net-income from the primary commodity and diversified income. It is calculated using the current values for the income drivers. The feasible household income has a similar composition, but now the feasible values for the income drivers are used to calculate net-income from the primary commodity and diversified income."
                  >
                    <InfoCircleOutlined style={{ color: "#fff" }} />
                  </Tooltip>
                </Space>
              }
              extra={
                <Space align="center">
                  <ShowLabelButton
                    showLabel={showLabelChartIncomeGap}
                    setShowLabel={setShowLabelChartIncomeGap}
                    type="ghost-white"
                  />
                  <SaveAsImageButton
                    elementRef={elIncomeGap}
                    filename="What is the size of the income gap?"
                    type="ghost-white"
                  />
                </Space>
              }
            >
              <ChartIncomeGap
                dashboardData={dashboardData}
                currentCase={currentCase}
                showLabel={showLabelChartIncomeGap}
              />
            </Card>
          </Col>
        </Row>
      </Col>

      <Col span={24}>
        <Row
          className="income-driver-content"
          gutter={[24, 24]}
          ref={elBigImpact}
        >
          <Col span={16}>
            <Card
              className="chart-card-wrapper has-segments-button"
              title={
                <Space align="center">
                  <div>Biggest Impact on Income</div>
                  <Tooltip
                    className="info-tooltip"
                    title="This graph % changes shown in the grapg represent it's 'contribution' to household income and not the change it creates in household income."
                  >
                    <InfoCircleOutlined style={{ color: "#fff" }} />
                  </Tooltip>
                </Space>
              }
              extra={
                <Space align="center">
                  <ShowLabelButton
                    showLabel={showLabelChartBigImpact}
                    setShowLabel={setShowLabelChartBigImpact}
                    type="ghost-white"
                  />
                  <SaveAsImageButton
                    elementRef={elBigImpact}
                    filename="How does adjusting income drivers from current to feasible levels affect income?"
                    type="ghost-white"
                  />
                </Space>
              }
            >
              <ChartBigImpact
                dashboardData={dashboardData}
                showLabel={showLabelChartBigImpact}
              />
            </Card>
          </Col>
          <Col span={8} className="income-overview-chart-wrapper">
            <h2>
              How does adjusting income drivers from current to feasible levels
              affect income?
            </h2>
            <p>
              This graph helps users compare the contribution of each income
              driver on household income in two scenarios: In Scenario 1 (light
              green), we set an income driver to its feasible when all other
              drivers values remain at current level.
              <br />
              <br />
              Insights: First, comparing the contribution of each income driver
              to the household income in either the current or feasible
              scenario, can help idenitfy the most impactful drivers with
              regards to the impact they can have on household income. Second,
              it&apos;s important to note that the contributions of any driver
              are influenced by the values of other income drivers, so caution
              is advised when interpreting the impact of a single income driver
              in isolation.
              <br />
              <br />
              The value represented in the graph are a contribution (%) of the
              particular income driver to the household income for the
              particular scenario. The absolute value of the household income
              are different in the 2 scenarios.
              <br />
              <br />
              TIP! By clicking on an item in the legend you can make it appear
              or dissapear. Doing this could help you isolate the various
              analysis the graph can offer you.
            </p>
          </Col>
        </Row>
      </Col>

      <Col span={24}>
        <Row
          className="income-driver-content"
          gutter={[24, 24]}
          ref={elExploreBreakdownDrivers}
        >
          <Col span={8} className="income-overview-chart-wrapper">
            <h2>Explore the breakdown of drivers</h2>
            <p>
              This graph allows you to select a specific income driver and
              explore the contributions of it&apos;s various sub-components
              <br />
              <br />
              Insight: It helps you to understand the composition of an income
              driver. It also highlights the largest and smallest subcomponents
              and how these vary across different segments.
            </p>
          </Col>
          <Col span={16}>
            <Card
              className="chart-card-wrapper has-segments-button"
              title="The breakdown of drivers"
              extra={
                <Space align="center">
                  <ShowLabelButton
                    showLabel={showLabelChartExploreBreakdownDrivers}
                    setShowLabel={setShowLabelChartExploreBreakdownDrivers}
                    type="ghost-white"
                  />
                  <SaveAsImageButton
                    elementRef={elExploreBreakdownDrivers}
                    filename="Explore the breakdown of drivers"
                    type="ghost-white"
                  />
                </Space>
              }
            >
              <ChartExploreBreakdownDrivers
                dashboardData={dashboardData}
                currentCase={currentCase}
                showLabel={showLabelChartExploreBreakdownDrivers}
              />
            </Card>
          </Col>
        </Row>
      </Col>

      <Col span={24}>
        <Row
          className="income-driver-content"
          gutter={[24, 24]}
          ref={elMonetaryContribution}
        >
          <Col span={16}>
            <Card
              className="chart-card-wrapper has-segments-button"
              title="Monetary impact of each driver to income"
              extra={
                <Space align="center">
                  <ShowLabelButton
                    showLabel={showLabelChartMonetaryContribution}
                    setShowLabel={setShowLabelChartMonetaryContribution}
                    type="ghost-white"
                  />
                  <SaveAsImageButton
                    elementRef={elMonetaryContribution}
                    filename="What is the monetary impact of each income driver as we move income drivers from their current to feasible levels?"
                    type="ghost-white"
                  />
                </Space>
              }
            >
              <ChartMonetaryContribution
                dashboardData={dashboardData}
                currentCase={currentCase}
                showLabel={showLabelChartMonetaryContribution}
              />
            </Card>
          </Col>
          <Col span={8} className="income-overview-chart-wrapper">
            <h2>
              What is the monetary impact of each income driver as we move
              income drivers from their current to feasible levels?
            </h2>
            <p>
              This waterfall chart visually illustrates how adjustments in
              income drivers influence the transition from the current income
              level to a feasible income level. Each element represents how
              income changes resulting from changing an income driver from its
              current to its feasible level, keeping the other income drivers at
              their current levels.
              <br />
              <br />
              Insights: The graph serves to clarify which income drivers have
              the most significant impact on increasing household income levels.
              The values do not add up to the feasible income level because some
              income drivers are interconnected and in this graph we only assess
              the change in income caused by changing one income driver to its
              feasible levels, while the others remain at their current levels.
            </p>
          </Col>
        </Row>
      </Col>

      <Col span={24}>
        <Row
          className="income-driver-content"
          gutter={[24, 24]}
          ref={elIncomeLevelPerCommodities}
        >
          <Col span={8} className="income-overview-chart-wrapper">
            <h2>
              What are the current and feasible income levels for the different
              commodities in each segment?
            </h2>
            <p>
              This graph presents current and feasible net income levels for the
              focus commodity, as well as any secondary and tertiary
              commodities, within various segments.
              <br />
              <br />
              Insights: This graph will help you compare the net-income from the
              different commodities you included in the different segements
            </p>
          </Col>
          <Col span={16}>
            <Card
              className="chart-card-wrapper has-segments-button"
              title="Income levels for different commodities"
              extra={
                <Space align="center">
                  <ShowLabelButton
                    showLabel={showLabelChartIncomeLevelPerCommodities}
                    setShowLabel={setShowLabelChartIncomeLevelPerCommodities}
                    type="ghost-white"
                  />
                  <SaveAsImageButton
                    elementRef={elIncomeLevelPerCommodities}
                    filename="What are the current and feasible income levels for the different commodities in each segment?"
                    type="ghost-white"
                  />
                </Space>
              }
            >
              <ChartIncomeLevelPerCommodities
                dashboardData={dashboardData}
                currentCase={currentCase}
                showLabel={showLabelChartIncomeLevelPerCommodities}
              />
            </Card>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default DashboardIncomeOverview;
