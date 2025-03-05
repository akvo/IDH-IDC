import { Store } from "pullstate";

const defaultScenarioData = {
  key: 1,
  name: "Scenario 1",
  description: null,
  percentage: true,
  scenarioValues: [],
};

const defaultCaseVisualState = {
  questionGroups: [],
  totalIncomeQuestions: [],
  incomeDataDrivers: [],
  dashboardData: [],
  sensitivityAnalysis: {
    case: null,
    tab: "sensitivity_analysis",
    config: {
      optimizationModel: {},
    },
  },
  prevSensitivityAnalysis: {
    case: null,
    tab: "sensitivity_analysis",
    config: {
      optimizationModel: {},
    },
  },
  scenarioModeling: {
    case: null,
    tab: "scenario_modeling",
    config: {
      scenarioData: [defaultScenarioData],
      scenarioOutcomeDataSource: [],
    },
  },
  prevScenarioModeling: {
    case: null,
    tab: "scenario_modeling",
    config: {
      scenarioData: [defaultScenarioData],
      scenarioOutcomeDataSource: [],
    },
  },
};

const CaseVisualState = new Store(defaultCaseVisualState);

export default CaseVisualState;
