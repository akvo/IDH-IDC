import React, { useEffect } from "react";
import { Radio } from "antd";
import { CaseVisualState } from "../store";
import { orderBy } from "lodash";

const SegmentSelector = ({ selectedSegment, setSelectedSegment }) => {
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);

  useEffect(() => {
    if (!selectedSegment && dashboardData?.length > 0) {
      setSelectedSegment(dashboardData[0].id);
    }
  }, [selectedSegment, dashboardData, setSelectedSegment]);

  const handleChangeSegmentSelector = (e) => {
    const value = e.target.value;
    setSelectedSegment(value);
  };

  return (
    <Radio.Group value={selectedSegment} onChange={handleChangeSegmentSelector}>
      {orderBy(dashboardData, ["id"]).map((d) => (
        <Radio.Button key={d.id} value={d.id}>
          {d.name}
        </Radio.Button>
      ))}
    </Radio.Group>
  );
};

export default SegmentSelector;
