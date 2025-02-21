import React, { useMemo } from "react";
import { TreeSelect } from "antd";
import { CaseUIState, CaseVisualState } from "../store";

const generateDriverOptions = ({ group, questions }) => {
  return questions.map((q) => ({
    value: `${group.id}-${q.id}`, // commodityID - questionID
    label: q.text,
    selectable: q.question_type === "aggregator" ? false : true,
    children: generateDriverOptions({ group, questions: q.childrens }),
  }));
};

const AllDriverTreeSelector = ({
  onChange,
  value = null,
  multiple = false,
  dropdownStyle = {},
}) => {
  const { enableEditCase } = CaseUIState.useState((s) => s.general);
  const { incomeDataDrivers } = CaseVisualState.useState((s) => s);

  const incomeDriverOptions = useMemo(() => {
    return incomeDataDrivers.map((driver) => ({
      value: driver.groupName,
      title: driver.groupName,
      selectable: false,
      children: driver.questionGroups.map((qg) => ({
        value: qg.id,
        label: qg.commodity_name,
        selectable: false,
        children: generateDriverOptions({
          group: qg,
          questions: qg.questions,
        }),
      })),
    }));
  }, [incomeDataDrivers]);

  return (
    <TreeSelect
      showSearch
      allowClear
      style={{ width: "100%" }}
      dropdownStyle={{
        maxHeight: 400,
        overflow: "auto",
        ...dropdownStyle,
      }}
      placeholder="Select driver"
      onChange={(value) => {
        if (onChange) {
          onChange(value);
        }
      }}
      treeData={incomeDriverOptions}
      disabled={!enableEditCase}
      treeNodeFilterProp="label"
      multiple={multiple}
      value={value}
    />
  );
};

export default AllDriverTreeSelector;
