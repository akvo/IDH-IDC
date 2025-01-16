import React, { useState, useEffect, useMemo } from "react";
import { Spin, Tabs, Row, Col } from "antd";
import { CaseWrapper } from "./layout";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../lib";
import {
  CurrentCaseState,
  stepPath,
  CaseUIState,
  PrevCaseState,
} from "./store";
import {
  SetIncomeTarget,
  EnterIncomeData,
  UnderstandIncomeGap,
  AssessImpactMitigationStrategies,
  ClosingGap,
} from "./steps";
import { EnterIncomeDataVisual } from "./components";
import "./steps/steps.scss";
import { isEmpty } from "lodash";

const Loading = () => (
  <div className="loading-container">
    <Spin />
  </div>
);

const renderPage = (key, navigate) => {
  switch (key) {
    case stepPath.step1.label:
      return (
        <SegmentTabsWrapper>
          <SetIncomeTarget />
        </SegmentTabsWrapper>
      );
    case stepPath.step2.label:
      return (
        <SegmentTabsWrapper>
          <EnterIncomeData key="left" />
          <EnterIncomeDataVisual key="right" />
        </SegmentTabsWrapper>
      );
    case stepPath.step3.label:
      return <UnderstandIncomeGap />;
    case stepPath.step4.label:
      return <AssessImpactMitigationStrategies />;
    case stepPath.step5.label:
      return (
        <SegmentTabsWrapper>
          <ClosingGap />
        </SegmentTabsWrapper>
      );
    default:
      return navigate("/not-found");
  }
};

const SegmentTabsWrapper = ({ children, setbackfunction, setnextfunction }) => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const { activeSegmentId } = CaseUIState.useState((s) => s.general);
  const childrenCount = React.Children.count(children);

  // set default active segmentId
  useEffect(() => {
    if (!activeSegmentId && !isEmpty(currentCase.segments)) {
      CaseUIState.update((s) => ({
        ...s,
        general: {
          ...s.general,
          activeSegmentId: currentCase.segments?.[0]?.id || null,
        },
      }));
    }
  }, [activeSegmentId, currentCase.segments]);

  const segmentTabItems = useMemo(() => {
    return currentCase.segments.map((segment) => ({
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
  }, [currentCase, children, setbackfunction, setnextfunction, childrenCount]);

  return (
    <Row id="steps" gutter={[20, 20]}>
      <Col span={childrenCount === 1 ? 24 : 16}>
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
              <Col key={index} span={8}>
                {child}
              </Col>
            ) : null
          ) : null
        )}
    </Row>
  );
};

const Case = () => {
  const navigate = useNavigate();
  const { caseId, step } = useParams();

  const [loading, setLoading] = useState(false);
  const currentCase = CurrentCaseState.useState((s) => s);

  const updateStepIncomeTargetState = (key, value) => {
    CaseUIState.update((s) => {
      s.stepSetIncomeTarget = {
        ...s.stepSetIncomeTarget,
        [key]: value,
      };
    });
  };

  useEffect(() => {
    if (caseId && currentCase.id !== parseInt(caseId)) {
      setLoading(true);
      // prevent fetch the data when it's already defined
      api
        .get(`case/${caseId}`)
        .then((res) => {
          const { data } = res;
          CurrentCaseState.update((s) => ({ ...s, ...data }));
          PrevCaseState.update((s) => ({ ...s, ...data }));
        })
        .catch((e) => {
          console.error("Error fetching case data", e);
          navigate("/not-found");
        })
        .finally(() => {
          setTimeout(() => {
            setLoading(false);
          }, 100);
        });
    }
  }, [caseId, currentCase.id, navigate]);

  useEffect(() => {
    // fetch region data
    if (currentCase?.country) {
      updateStepIncomeTargetState("regionOptionLoading", true);
      api
        .get(`region/options?country_id=${currentCase.country}`)
        .then((res) => {
          updateStepIncomeTargetState("regionOptionStatus", 200);
          updateStepIncomeTargetState("regionOptions", res.data);
        })
        .catch((e) => {
          const { status } = e.response;
          updateStepIncomeTargetState("regionOptionStatus", status);
        })
        .finally(() => {
          updateStepIncomeTargetState("regionOptionLoading", false);
        });
    }
  }, [currentCase?.country]);

  return (
    <CaseWrapper caseId={caseId} step={step} currentCase={currentCase}>
      {loading ? <Loading /> : renderPage(step, navigate)}
    </CaseWrapper>
  );
};

export default Case;
