import { useEffect } from "react";
import { CaseVisualState } from "../store";
import { calculateOutcomeData } from "../utils/scenarioOutcomeCalculations";

const useScenarioCalculations = () => {
  const {
    scenarioModeling,
    dashboardData,
    questionGroups,
    totalIncomeQuestions,
  } = CaseVisualState.useState((s) => s);

  const scenarioData = scenarioModeling.config.scenarioData;

  useEffect(() => {
    if (!scenarioData?.length || !dashboardData?.length) {
      return;
    }

    // Calculate the scenario results globally
    const allScenarioOutcomes = calculateOutcomeData(
      scenarioData,
      dashboardData,
      questionGroups,
      totalIncomeQuestions
    );

    // Update the global state
    CaseVisualState.update((s) => {
      s.scenarioModeling.config.scenarioOutcomeDataSource = allScenarioOutcomes;
    });
  }, [scenarioData, dashboardData, questionGroups, totalIncomeQuestions]);
};

export default useScenarioCalculations;
