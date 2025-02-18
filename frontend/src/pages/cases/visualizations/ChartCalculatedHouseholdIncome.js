import React, { useMemo, useState, useRef } from "react";
import { CurrentCaseState, CaseVisualState } from "../store";
import { VisualCardWrapper } from "../components";
import Chart from "../../../components/chart";

const ChartCalculatedHouseholdIncome = () => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const totalIncomeQuestions = CaseVisualState.useState(
    (s) => s.totalIncomeQuestions
  );
  const [showLabel, setShowLabel] = useState(false);
  const elChartHHIncome = useRef(null);

  const chartData = useMemo(() => {
    if (!currentCase.segments.length) {
      return [];
    }
    const res = currentCase.segments.map((item) => {
      const answers = item.answers || {};
      const current = totalIncomeQuestions
        .map((qs) => answers?.[`current-${qs}`] || 0)
        .filter((a) => a)
        .reduce((acc, a) => acc + a, 0);
      const feasible = totalIncomeQuestions
        .map((qs) => answers?.[`feasible-${qs}`] || 0)
        .filter((a) => a)
        .reduce((acc, a) => acc + a, 0);
      return {
        name: item.name,
        data: [
          {
            name: "Current Income",
            value: Math.round(current),
            color: "#03625f",
          },
          {
            name: "Feasible Income",
            value: Math.round(feasible),
            color: "#82b2b2",
          },
        ],
      };
    });
    return res;
  }, [totalIncomeQuestions, currentCase.segments]);

  return (
    <VisualCardWrapper
      title="Calculated household income"
      showLabel={showLabel}
      setShowLabel={setShowLabel}
      exportElementRef={elChartHHIncome}
      exportFilename="Calculated Household Income"
    >
      <Chart
        wrapper={false}
        type="COLUMN-BAR"
        data={chartData}
        loading={!chartData.length}
        height={window.innerHeight * 0.4}
        extra={{
          axisTitle: { y: `Income (${currentCase.currency})` },
          xAxisLabel: {
            rotate: 45,
            margin: 40,
            align: "center",
          },
        }}
        grid={{ bottom: 60, right: 5, left: 70 }}
        showLabel={showLabel}
      />
    </VisualCardWrapper>
  );
};

export default ChartCalculatedHouseholdIncome;
