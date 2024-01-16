import React from "react";
import Chart from "../../../components/chart";

const ChartScenarioModeling = ({
  data = [],
  targetChartData = [],
  currencyUnitName,
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
      />
    </div>
  );
};

export default ChartScenarioModeling;
