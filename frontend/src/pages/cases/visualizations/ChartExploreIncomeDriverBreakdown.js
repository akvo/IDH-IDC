import React, { useState } from "react";
import { Card, Col, Row, Space } from "antd";
import { VisualCardWrapper } from "../components";
import { CaseVisualState, CurrentCaseState } from "../store";

const otherCommodities = ["secondary", "tertiary"];
const currentColors = [
  "#1b726f", // Dark Cyan
  "#81e4ab", // Pale Green
  "#fecb21", // Maximum Yellow Red
  "#4eb8ff", // Dodger Blue
  "#ff8f4e", // Atomic Tangerine
  "#725b1b", // Olive Brown
  "#ad1b72", // Rose Red
  "#214b72", // Prussian Blue
  "#724a1b", // Raw Sienna
  "#1b7272", // Skobeloff
  "#721b49", // Plum Purple
  "#1b724a", // Jungle Green
  "#721b1b", // Persian Red
  "#4a721b", // Olive Drab
  "#1b4a72", // Dark Slate Blue
  "#1b7261", // Tropical Rain Forest
];

const feasibleColors = [
  "#9cc2c1", // Silver Sand (Lighter Version of #1b726f)
  "#ddf8e9", // Honeydew (Lighter Version of #81e4ab)
  "#ffeeb8", // Moccasin (Lighter Version of #fecb21)
  "#d0ecff", // Lavender Blue (Lighter Version of #4eb8ff)
  "#ffe1d0", // Peach Yellow (Lighter Version of #ff8f4e)
  "#9e8a4d", // Shadow (Lighter Version of #725b1b)
  "#d44a94", // Blush (Lighter Version of #ad1b72)
  "#41799d", // Steel Blue (Lighter Version of #214b72)
  "#ad8a4d", // Café Au Lait (Lighter Version of #724a1b)
  "#4d9e9e", // Viridian Green (Lighter Version of #1b7272)
  "#94486e", // Mulberry (Lighter Version of #721b49)
  "#4d944a", // Turtle Green (Lighter Version of #1b724a)
  "#944848", // Chestnut Rose (Lighter Version of #721b1b)
  "#6e9448", // La Palma (Lighter Version of #4a721b)
  "#486e94", // Jelly Bean (Lighter Version of #1b4a72)
  "#487e6e", // Jaguar (Lighter Version of #1b7261)
];

const ChartExploreIncomeDriverBreakdown = () => {
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);
  const currentCase = CurrentCaseState.useState((s) => s);

  const [axisTitle, setAxisTitle] = useState(currentCase.currency);
  const [loading, setLoading] = useState(false);

  return (
    <Card className="card-visual-wrapper">
      <Row gutter={[20, 20]} align="middle">
        <Col span={16}>
          <VisualCardWrapper
            title="Explore income driver breakdown"
            showIncomeDriversDropdown={true}
            showSegmentSelector={true}
            bordered
          >
            Chart
          </VisualCardWrapper>
        </Col>
        <Col span={8}>
          <Space direction="vertical">
            <div className="section-title">Explore income driver breakdown</div>
            <div className="section-description">
              This graph lets you dive into a specific income driver and see how
              its sub-components contribute. Use it to identify the largest and
              smallest contributors and spot variations across segments
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ChartExploreIncomeDriverBreakdown;
