import React, { useMemo } from "react";
import { Tabs, Row, Col, Space, Button } from "antd";
import { CurrentCaseState, CaseUIState } from "../store";
import "../steps/steps.scss";
import { orderBy } from "lodash";

const SegmentTabsWrapper = ({
  children,
  setbackfunction,
  setnextfunction,
  setsavefunction,
  titleId = null,
  pageTitle = null,
}) => {
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
                    setsavefunction,
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
                      setsavefunction,
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
    setsavefunction,
    childrenCount,
  ]);

  return (
    <div id="steps">
      <Row id={titleId || "steps-row"} gutter={[24, 24]}>
        {titleId && pageTitle ? (
          <Col span={24} className="header-wrapper">
            <div>
              <Space direction="vertical">
                <div className="title">{pageTitle}</div>
              </Space>
            </div>
            <div>
              <Button
                className="button-green-fill"
                // onClick={() => setCaseSettingModalVisible(true)}
              >
                Save
              </Button>
            </div>
          </Col>
        ) : null}
        <Col span={24}>
          <Row id="steps" gutter={[12, 12]}>
            <Col span={childrenCount === 1 ? 24 : 14}>
              <Tabs
                className="step-segment-tabs-container"
                type="card"
                items={segmentTabItems}
                tabBarGutter={5}
                activeKey={
                  activeSegmentId
                    ? activeSegmentId
                    : currentCase?.segments?.[0]?.id
                }
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
        </Col>
      </Row>
    </div>
  );
};

export default SegmentTabsWrapper;
