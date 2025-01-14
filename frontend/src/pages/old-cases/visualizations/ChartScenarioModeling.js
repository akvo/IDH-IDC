import React from "react";
import Chart from "../../../components/chart";

const ChartScenarioModeling = ({
  data = [],
  targetChartData = [],
  currencyUnitName,
  showLabel = false,
  height = 450,
}) => {
  return (
    <div style={{ padding: "0px 0px 0px 0px" }}>
      <Chart
        wrapper={false}
        type="BARSTACK"
        data={data}
        targetData={targetChartData}
        loading={!data.length}
        extra={{ axisTitle: { y: `Income ${currencyUnitName}` } }}
        grid={{ right: 161 }}
        showLabel={showLabel}
        height={height}
      />
    </div>
  );
};

export default ChartScenarioModeling;
