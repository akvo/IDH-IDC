import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { stepPath, CurrentCaseState, CaseVisualState } from "../store";
import { Row, Col, Card, Space, Carousel, Form } from "antd";
import {
  ChartBiggestImpactOnIncome,
  ChartMonetaryImpactOnIncome,
} from "../visualizations";
import { BinningDriverForm, SegmentSelector } from "../components";
import { map, groupBy } from "lodash";
import { commodities } from "../../../store/static";

/**
 * STEP 4
 */
const AssessImpactMitigationStrategies = ({
  setbackfunction,
  setnextfunction,
}) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const currentCase = CurrentCaseState.useState((s) => s);
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);
  // const sensitivityAnalysis = CaseVisualState.useState(
  //   (s) => s.sensitivityAnalysis
  // );

  const [selectedSegment, setSelectedSegment] = useState(null);

  const backFunction = useCallback(() => {
    navigate(`/case/${currentCase.id}/${stepPath.step3.label}`);
  }, [navigate, currentCase.id]);

  const nextFunction = useCallback(() => {
    navigate(`/case/${currentCase.id}/${stepPath.step5.label}`);
  }, [navigate, currentCase.id]);

  const updateCaseVisualSensitivityAnalysisState = (updatedValue) => {
    CaseVisualState.update((s) => ({
      ...s,
      sensitivityAnalysis: {
        ...s.sensitivityAnalysis,
        ...updatedValue,
      },
    }));
  };

  useEffect(() => {
    if (setbackfunction) {
      setbackfunction(backFunction);
    }
    if (setnextfunction) {
      setnextfunction(nextFunction);
    }
  }, [setbackfunction, setnextfunction, backFunction, nextFunction]);

  const dataSource = useMemo(() => {
    if (!selectedSegment) {
      return [];
    }
    const focusCommodity = currentCase?.case_commodities?.find(
      (cm) => cm.commodity_type === "focus"
    );
    const segmentData = dashboardData.find(
      (segment) => segment.id === selectedSegment
    );
    const answers = segmentData.answers;
    const drivers = answers.filter(
      (answer) => answer.question?.parent_id === 1 && answer.commodityFocus
    );
    const data = map(groupBy(drivers, "question.id"), (d, i) => {
      const currentQuestion = d[0].question;
      const unitName = currentQuestion.unit
        .split("/")
        .map((u) => u.trim())
        .map((u) =>
          u === "crop"
            ? commodities
                .find((c) => c.id === focusCommodity?.commodity)
                ?.name?.toLowerCase() || ""
            : focusCommodity?.[u]
        )
        .join(" / ");
      return {
        key: parseInt(i) - 1,
        name: currentQuestion.text,
        current: d.find((a) => a.name === "current")?.value || 0,
        feasible: d.find((a) => a.name === "feasible")?.value || 0,
        unitName: unitName,
      };
    });
    const currencyUnit = focusCommodity["currency"];
    return [
      ...data,
      {
        key: data.length + 10,
        name: "Diversified Income",
        current: segmentData.total_current_diversified_income,
        feasible: segmentData.total_feasible_diversified_income,
        unitName: currencyUnit,
      },
      {
        key: data.length + 11,
        name: "Total Primary Income",
        current: segmentData.total_current_focus_income?.toFixed() || 0,
        feasible: segmentData.total_feasible_focus_income?.toFixed() || 0,
        unitName: currencyUnit,
      },
      {
        key: data.length + 12,
        name: "Total Income",
        current: segmentData.total_current_income?.toFixed() || 0,
        feasible: segmentData.total_feasible_income?.toFixed() || 0,
        unitName: currencyUnit,
      },
      {
        key: data.length + 13,
        name: "Income Target",
        current: segmentData.target?.toFixed() || 0,
        unitName: currencyUnit,
        render: (i) => {
          <div>test {i}</div>;
        },
      },
    ];
  }, [selectedSegment, dashboardData, currentCase?.case_commodities]);

  const onSensitivityAnalysisValuesChange = (changedValue, allValues) => {
    const objectName = Object.keys(changedValue)[0];
    const [segmentId, valueName] = objectName.split("_");
    const value = changedValue[objectName];

    if (valueName === "x-axis-driver") {
      const dataValue = dataSource.find((d) => d.name === value);
      allValues = {
        ...allValues,
        [`${segmentId}_x-axis-driver`]: dataValue?.name,
        [`${segmentId}_x-axis-min-value`]: dataValue?.current,
        [`${segmentId}_x-axis-max-value`]: dataValue?.feasible,
        [`${segmentId}_x-axis-current-value`]: dataValue?.current,
        [`${segmentId}_x-axis-feasible-value`]: dataValue?.feasible,
      };
    }
    if (valueName === "y-axis-driver") {
      const dataValue = dataSource.find((d) => d.name === value);
      allValues = {
        ...allValues,
        [`${segmentId}_y-axis-driver`]: dataValue?.name,
        [`${segmentId}_y-axis-min-value`]: dataValue?.current,
        [`${segmentId}_y-axis-max-value`]: dataValue?.feasible,
        [`${segmentId}_y-axis-current-value`]: dataValue?.current,
        [`${segmentId}_y-axis-feasible-value`]: dataValue?.feasible,
      };
    }
    if (valueName === "binning-driver-name") {
      const dataValue = dataSource.find((d) => d.name === value);
      allValues = {
        ...allValues,
        [`${segmentId}_binning-driver-name`]: dataValue?.name,
        [`${segmentId}_binning-value-1`]: dataValue?.current,
        [`${segmentId}_binning-value-2`]: dataValue
          ? (dataValue.current + dataValue.feasible) / 2
          : dataValue,
        [`${segmentId}_binning-value-3`]: dataValue?.feasible,
        [`${segmentId}_binning-current-value`]: dataValue?.current,
        [`${segmentId}_binning-feasible-value`]: dataValue?.feasible,
      };
    }
    updateCaseVisualSensitivityAnalysisState({
      case: currentCase.id,
      config: allValues,
    });
    form.setFieldsValue(allValues);
  };

  return (
    <Row id="assess-impact-mitigation-strategies" gutter={[24, 24]}>
      <Col span={24} className="header-wrapper">
        <Space direction="vertical">
          <div className="title">Explanatory text</div>
          <div className="description">
            This page enables you to explore various scenarios by adjusting your
            income drivers in different ways across your segments. This allows
            you to understand the potential paths towards improving farmer
            household income
          </div>
        </Space>
      </Col>

      {/* #1 Chart */}
      <Col span={24}>
        <Card className="card-section-wrapper">
          Which drivers have the highest impact on income change?
        </Card>
      </Col>
      {/* Carousel */}
      <Col span={24}>
        <Carousel autoplay>
          <div>
            <ChartBiggestImpactOnIncome />
          </div>
          <div>
            <ChartMonetaryImpactOnIncome />
          </div>
        </Carousel>
      </Col>
      {/* EOL Carousel */}

      {/* #2 Sensitivity Analysis */}
      <Col span={24}>
        <Card className="card-section-wrapper">
          Which pairs of drivers have a strong impact on income?
        </Card>
      </Col>
      <Col span={24}>
        <Card className="card-content-wrapper">
          <Row gutter={[20, 20]}>
            <Col span={24}>
              <SegmentSelector
                selectedSegment={selectedSegment}
                setSelectedSegment={setSelectedSegment}
              />
            </Col>
            <Col span={24}>
              <Form
                name="sensitivity-analysis"
                layout="vertical"
                form={form}
                onValuesChange={onSensitivityAnalysisValuesChange}
                // initialValues={binningData}
              >
                {dashboardData.map((segment, key) => (
                  <BinningDriverForm
                    key={key}
                    selectedSegment={selectedSegment}
                    segment={segment}
                    dataSource={dataSource}
                    // selected={
                    //   binningValues.find((b) => b.id === segment.id)?.selected
                    // }
                    hidden={selectedSegment !== segment.id}
                    // enableEditCase={enableEditCase}
                  />
                ))}
              </Form>
            </Col>
          </Row>
        </Card>
      </Col>
      {/* EOL Sensitivity Analysis */}
    </Row>
  );
};

export default AssessImpactMitigationStrategies;
