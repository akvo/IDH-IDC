import { Store } from "pullstate";

const defaultScenarioData = {
  key: 1,
  name: "Scenario 1",
  description: null,
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
    config: {},
  },
  prevSensitivityAnalysis: {
    case: null,
    tab: "sensitivity_analysis",
    config: {},
  },
  scenarioModeling: {
    case: null,
    tab: "scenario_modeling",
    config: {
      percentage: true,
      scenarioData: [defaultScenarioData],
    },
  },
  prevScenarioModeling: {
    case: null,
    tab: "scenario_modeling",
    config: {
      percentage: true,
      scenarioData: [defaultScenarioData],
    },
  },
};

const CaseVisualState = new Store(defaultCaseVisualState);

export default CaseVisualState;
