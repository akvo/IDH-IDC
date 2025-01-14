import React from "react";
import { Radio } from "antd";

const SegmentSelector = ({
  dashboardData,
  selectedSegment,
  setSelectedSegment,
}) => {
  return (
    <Radio.Group
      value={selectedSegment}
      onChange={(e) => {
        setSelectedSegment(e.target.value);
      }}
    >
      {dashboardData.map((d) => (
        <Radio.Button key={d.id} value={d.id}>
          {d.name}
        </Radio.Button>
      ))}
    </Radio.Group>
  );
};

export default SegmentSelector;
