import { Store } from "pullstate";

const defaultCaseUIState = {
  general: {
    enableEditCase: true,
    activeSegmentId: null,
  },
  caseButton: {
    loading: false,
  },
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
    newCpiModalVisible: false,
    newCPI: null,
    newCPIFactor: null,
  },
};

const CaseUIState = new Store(defaultCaseUIState);

export const resetCaseUIState = () => {
  CaseUIState.update(() => defaultCaseUIState);
};

export default CaseUIState;
