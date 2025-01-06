import React from "react";
import { Select } from "antd";
import { selectProps } from "../components";

const DriverDropdown = ({ options = [], value, onChange }) => {
  return (
    <Select
      options={options}
      placeholder="Select Driver"
      value={value}
      onChange={onChange}
      {...selectProps}
      allowClear={false}
    />
  );
};

export default DriverDropdown;
