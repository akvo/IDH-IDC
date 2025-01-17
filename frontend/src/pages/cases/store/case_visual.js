import { Store } from "pullstate";

const defaultCaseVisualState = {
  questionGroups: [],
  totalIncomeQuestions: [],
  incomeDataDrivers: [],
  dashboardData: [],
};

const CaseVisualState = new Store(defaultCaseVisualState);

export default CaseVisualState;
