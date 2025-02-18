import React, { useMemo } from "react";
import { Card, Row, Col, Space, Select } from "antd";
import { VisualCardWrapper } from "../components";
import { selectProps } from "../../../lib";
import { CaseVisualState, CurrentCaseState } from "../store";
import { orderBy } from "lodash";

const ChartIncomeGapAcrossScenario = () => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const { scenarioModeling } = CaseVisualState.useState((s) => s);
  const scenarioData = scenarioModeling.config.scenarioData;

  const scenarioSegmentOptions = useMemo(() => {
    let i = 1;
    const res = orderBy(scenarioData, "key").flatMap((sc) => {
      const concat = currentCase.segments.map((st) => {
        const opt = {
          order: i,
          label: `${sc.name} - ${st.name}`,
          value: `${sc.key}-${st.id}`,
        };
        i += 1;
        return opt;
      });
      return concat;
    });
    return res;
  }, [scenarioData, currentCase.segments]);

  return (
    <Card className="card-visual-wrapper">
      <Row gutter={[20, 20]} align="top">
        <Col span={16}>
          <VisualCardWrapper title="Income gap across scenario" bordered>
            Chart
          </VisualCardWrapper>
        </Col>
        <Col span={8}>
          <Space direction="vertical">
            <div className="section-title">
              What are the results for the different segments across scenarios?
            </div>
            <div className="section-description">
              The visual on the right allows you to select and compare specific
              combinations of scenarios and segments. You can explore how
              household income composition and income gaps vary across segments
              in the scenarios you create.
            </div>
            <div>
              <Select
                {...selectProps}
                options={scenarioSegmentOptions}
                placeholder="Select Scenario - Segment"
                mode="multiple"
                // onChange={setSelectedScenarioSegmentChart}
              />
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ChartIncomeGapAcrossScenario;
