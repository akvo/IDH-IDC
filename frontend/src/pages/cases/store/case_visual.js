import { Store } from "pullstate";

const defaultScenarioData = {
  key: 1,
  name: "Scenario 1",
  description: null,
  percentage: true,
  scenarioValues: [],
};

// const defaultGlobalSectionTotalValues = {
//   segmentId: null,
//   sectionTotalValues: {},
// };

const defaultCaseVisualState = {
  questionGroups: [],
  totalIncomeQuestions: [],
  incomeDataDrivers: [],
  globalSectionTotalValues: [],
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
      optimizationModel: {
        selectedDrivers: [],
        increaseValues: {},
        optimizationResult: {},
      },
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

export const resetCaseVisualState = () => {
  CaseVisualState.update(() => defaultCaseVisualState);
};

export default CaseVisualState;
