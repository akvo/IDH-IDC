import { Store } from "pullstate";

const defaultCaseUIState = {
  secondary: {
    enable: false,
    disableAreaSizeField: true,
    disableLandUnitField: false,
    disableDataOnIncomeDriverField: false,
  },
  tertiary: {
    enable: false,
    disableAreaSizeField: true,
    disableLandUnitField: false,
    disableDataOnIncomeDriverField: false,
  },
  stepSetIncomeTarget: {
    regionOptions: [],
    regionOptionStatus: null,
    regionOptionLoading: false,
    incomeTarget: null,
  },
};

const CaseUIState = new Store(defaultCaseUIState);

export default CaseUIState;
