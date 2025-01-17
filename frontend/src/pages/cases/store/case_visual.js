import { Store } from "pullstate";

const defaultCaseVisualState = {
  questionGroups: [],
  totalIncomeQuestions: [],
  incomeDataDrivers: [],
};

const CaseVisualState = new Store(defaultCaseVisualState);

export default CaseVisualState;
