import React, { useMemo } from "react";
import { Tabs, Row, Col } from "antd";
import { CurrentCaseState, CaseUIState } from "../store";
import "../steps/steps.scss";
import { orderBy } from "lodash";

const SegmentTabsWrapper = ({ children, setbackfunction, setnextfunction }) => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const { activeSegmentId } = CaseUIState.useState((s) => s.general);
  const childrenCount = React.Children.count(children);

  const segmentTabItems = useMemo(() => {
    return orderBy(currentCase.segments, ["id"]).map((segment) => ({
      label: segment.name,
      key: segment.id,
      children:
        childrenCount === 1
          ? React.Children.map(children, (child) =>
              React.isValidElement(child)
                ? React.cloneElement(child, {
                    segment,
                    setbackfunction,
                    setnextfunction,
                  })
                : null
            )
          : React.Children.map(children, (child) =>
              child.key === "left"
                ? React.isValidElement(child)
                  ? React.cloneElement(child, {
                      segment,
                      setbackfunction,
                      setnextfunction,
                    })
                  : null
                : null
            ),
    }));
  }, [
    currentCase.segments,
    children,
    setbackfunction,
    setnextfunction,
    childrenCount,
  ]);

  return (
    <Row id="steps" gutter={[12, 12]}>
      <Col span={childrenCount === 1 ? 24 : 14}>
        <Tabs
          className="step-segment-tabs-container"
          type="card"
          items={segmentTabItems}
          tabBarGutter={5}
          activeKey={activeSegmentId || currentCase?.segments?.[0]?.id || null}
          onChange={(val) => {
            CaseUIState.update((s) => ({
              ...s,
              general: {
                ...s.general,
                activeSegmentId: val,
              },
            }));
          }}
        />
      </Col>
      {childrenCount > 1 &&
        React.Children.map(children, (child, index) =>
          child.key === "right" ? (
            React.isValidElement(child) ? (
              <Col key={index} span={10}>
                {child}
              </Col>
            ) : null
          ) : null
        )}
    </Row>
  );
};

export default SegmentTabsWrapper;
