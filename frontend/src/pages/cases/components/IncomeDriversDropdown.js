import React, { useEffect } from "react";
import { Select } from "antd";
import { selectProps } from "../../../lib";
import { CurrentCaseState } from "../store";

const IncomeDriversDropdown = ({
  driverOptionsDropdown,
  selectedSegmentData,
  selectedDriver,
  setSelectedDriver,
  setAxisTitle,
}) => {
  const currentCase = CurrentCaseState.useState((s) => s);

  useEffect(() => {
    if (driverOptionsDropdown.length > 0) {
      setSelectedDriver("diversified");
    }
  }, [driverOptionsDropdown, setSelectedDriver]);

  const handleOnChangeDriverDropdown = (value) => {
    setSelectedDriver(value);
    if (value === "diversified") {
      setAxisTitle(currentCase.currency);
      return;
    }
    if (selectedSegmentData) {
      const questions = selectedSegmentData.answers.find(
        (a) => a.isTotalCurrentFocusIncome
      ).question?.childrens;
      const currentQuestion = questions.find((q) => q.id === value);
      const { unit } = currentQuestion;
      const unitName = unit
        .split(" ")
        .map((x) => currentCase?.[x])
        .filter((x) => x)
        .join(" / ");
      setAxisTitle(unitName);
    }
  };

  return (
    <Select
      options={driverOptionsDropdown}
      placeholder="Select Driver"
      value={selectedDriver}
      onChange={handleOnChangeDriverDropdown}
      {...selectProps}
      allowClear={false}
    />
  );
};

export default IncomeDriversDropdown;
