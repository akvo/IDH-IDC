import React, { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  stepPath,
  CurrentCaseState,
  CaseVisualState,
  CaseUIState,
} from "../store";
import {
  Row,
  Col,
  Card,
  Space,
  Carousel,
  Button,
  message,
  InputNumber,
} from "antd";
import {
  ChartBiggestImpactOnIncome,
  ChartMonetaryImpactOnIncome,
} from "../visualizations";
import {
  OptimizeIncomeTarget,
  SingleDriverChange,
  // SensitivityAnalysis,
  TwoDriverHeatmap,
} from "../components";
import { isEqual, isEmpty } from "lodash";
import { api } from "../../../lib";
import { removeUndefinedObjectValue } from "../../../lib";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { routePath } from "../../../components/route";

/**
 * STEP 4
 */

const AssessImpactMitigationStrategies = ({
  setbackfunction,
  setnextfunction,
  setsavefunction,
  onSave,
}) => {
  const navigate = useNavigate();
  const currentCase = CurrentCaseState.useState((s) => s);
  const { sensitivityAnalysis, prevSensitivityAnalysis } =
    CaseVisualState.useState((s) => s);
  const { enableEditCase } = CaseUIState.useState((s) => s.general);

  const carouselChartRef = useRef(null);

  const [messageApi, contextHolder] = message.useMessage();

  const upateCaseButtonState = (value) => {
    CaseUIState.update((s) => ({
      ...s,
      caseButton: value,
    }));
  };

  const handleSaveVisualization = useCallback(
    ({ allowNavigate = false }) => {
      if (!enableEditCase) {
        return;
      }

      upateCaseButtonState({ loading: true });
      const payloads = [sensitivityAnalysis];
      // sensitivity analysis
      const isBinningDataUpdated = !isEqual(
        removeUndefinedObjectValue(prevSensitivityAnalysis?.config),
        removeUndefinedObjectValue(sensitivityAnalysis?.config)
      );
      // save only when the payloads is provided
      if (!isEmpty(payloads?.[0]?.config) && payloads?.[0]?.case) {
        // Save
        api
          .sendCompressedData(
            `visualization?updated=${isBinningDataUpdated}`,
            payloads
          )
          .then(() => {
            CaseVisualState.update((s) => ({
              ...s,
              prevSensitivityAnalysis: {
                ...sensitivityAnalysis,
              },
            }));
            messageApi.open({
              type: "success",
              content:
                "Assess impact of mitigation strategies saved successfully.",
            });
            if (allowNavigate) {
              setTimeout(() => {
                navigate(
                  `${routePath.idc.case}/${currentCase.id}/${stepPath.step5.label}`
                );
              }, 100);
            }
          })
          .catch((e) => {
            console.error(e);
            const { status, data } = e.response;
            let errorText =
              "Failed to save assess impact of mitigation strategies.";
            if (status === 403) {
              errorText = data.detail;
            }
            messageApi.open({
              type: "error",
              content: errorText,
            });
          })
          .finally(() => {
            upateCaseButtonState({ loading: false });
          });
      } else {
        upateCaseButtonState({ loading: false });
        if (allowNavigate) {
          setTimeout(() => {
            navigate(
              `${routePath.idc.case}/${currentCase.id}/${stepPath.step5.label}`
            );
          }, 100);
        }
      }
    },
    [
      currentCase.id,
      enableEditCase,
      messageApi,
      navigate,
      prevSensitivityAnalysis,
      sensitivityAnalysis,
    ]
  );

  const backFunction = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const nextFunction = useCallback(() => {
    handleSaveVisualization({ allowNavigate: true });
  }, [handleSaveVisualization]);

  const saveFunction = useCallback(() => {
    handleSaveVisualization({ allowNavigate: false });
  }, [handleSaveVisualization]);

  useEffect(() => {
    if (setbackfunction) {
      setbackfunction(backFunction);
    }
    if (setnextfunction) {
      setnextfunction(nextFunction);
    }
    if (setsavefunction) {
      setsavefunction(saveFunction);
    }
  }, [
    setbackfunction,
    setnextfunction,
    setsavefunction,
    backFunction,
    nextFunction,
    saveFunction,
  ]);

  return (
    <Row id="assess-impact-mitigation-strategies" gutter={[24, 24]}>
      {contextHolder}
      <Col span={24} className="header-wrapper">
        <div>
          <Space direction="vertical">
            <div className="title">
              Assess the impact of mitigation strategies
            </div>
            <div className="description">
              This page allows you to understand and arrive at potential paths
              to close the income gap for farmers in your supply chain. Users
              can identify the most impactful income drivers, adjust each
              driver&apos;s range individually and in combinations, to
              understand their ability to close the income gap.
            </div>
          </Space>
        </div>
        <div>
          <Button className="button-green-fill" onClick={onSave}>
            Save
          </Button>
        </div>
      </Col>

      {/* #1 Chart */}
      <Col span={24}>
        <Card className="card-section-wrapper">
          Which drivers have the highest impact on income change?
        </Card>
      </Col>
      {/* Carousel */}
      <Col span={24} className="carousel-container">
        <div className="carousel-arrows-wrapper">
          <div className="arrow-left">
            <Button
              className="button-arrow-carousel"
              type="link"
              icon={<LeftOutlined />}
              onClick={() => carouselChartRef?.current?.prev()}
            />
          </div>
          <div className="arrow-right">
            <Button
              className="button-arrow-carousel"
              type="link"
              icon={<RightOutlined />}
              onClick={() => carouselChartRef?.current?.next()}
            />
          </div>
        </div>
        <Carousel autoplay={false} ref={carouselChartRef}>
          <div>
            <ChartMonetaryImpactOnIncome />
          </div>
          <div>
            <ChartBiggestImpactOnIncome />
          </div>
        </Carousel>
      </Col>
      {/* EOL Carousel */}

      {/* NEW - Explore: How do income drivers need to change to close the gap? */}
      <Col span={24}>
        <Card className="card-section-wrapper">
          Explore: How do income drivers need to change to close the gap?
        </Card>
      </Col>

      <Col span={24}>
        <Card className="card-content-wrapper select-the-goal-container">
          <Row gutter={[20, 20]} align="middle">
            <Col span={16}>
              <h3>Select the Goal:</h3>
              <p>
                Closing the income gap may not be fully achievable within your
                feasible levels. Choose the percentage of the gap you would like
                to close and test different scenarios. The newly chosen target
                will be applied to all the calculations within the explore
                section of this step.
              </p>
            </Col>
            <Col span={8}>
              <Space direction="vertical" size={2}>
                <p>The income gap to be closed by:</p>
                <InputNumber controls={false} />
                <p className="new-target-text">New target: xxx Currency</p>
              </Space>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col span={24}>
        <SingleDriverChange />
      </Col>
      {/* EOL NEW - Explore: How do income drivers need to change to close the gap? */}

      {/* #2 Sensitivity Analysis => Two Driver Heatmap */}
      {/* <Col span={24}>
        <Card className="card-section-wrapper">
          Which pairs of drivers have a strong impact on income?
        </Card>
      </Col>
      <Col span={24}>
        <SensitivityAnalysis />
      </Col> */}
      <Col span={24}>
        <TwoDriverHeatmap />
      </Col>
      {/* EOL Sensitivity Analysis => Two Driver Heatmap */}

      {/* #3 Optimize Income Target */}
      <Col span={24}>
        <Card className="card-section-wrapper">
          What is the minimum change in drivers needed to close the income gap
          within feasible limits?
        </Card>
      </Col>
      <Col span={24}>
        <Card className="card-content-wrapper">
          <OptimizeIncomeTarget />
        </Card>
      </Col>
      {/* EOL Optimize Income Target */}
    </Row>
  );
};

export default AssessImpactMitigationStrategies;
