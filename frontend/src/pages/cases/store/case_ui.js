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
    // i think this need to be local state because every segment has different setting
    // TODO :: differentiate the state value between segment
    regionOptions: [],
    regionOptionStatus: null,
    regionOptionLoading: false,
    incomeTarget: null,
  },
};

const CaseUIState = new Store(defaultCaseUIState);

export default CaseUIState;
