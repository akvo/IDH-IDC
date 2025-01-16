import { Store } from "pullstate";

const defaultCaseVisualState = {
  questionGroups: [],
  totalIncomeQuestions: [],
};

const CaseVisualState = new Store(defaultCaseVisualState);

export default CaseVisualState;
