import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
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
  Form,
  Button,
  message,
  InputNumber,
} from "antd";
import {
  ChartBiggestImpactOnIncome,
  ChartMonetaryImpactOnIncome,
  ChartBinningDriversSensitivityAnalysis,
  ChartBinningHeatmapSensitivityAnalysis,
} from "../visualizations";
import {
  BinningDriverForm,
  SegmentSelector,
  AdjustIncomeTarget,
  OptimizeIncomeTarget,
} from "../components";
import { map, groupBy, isEqual, isEmpty } from "lodash";
import { commodities } from "../../../store/static";
import { api } from "../../../lib";
import { removeUndefinedObjectValue } from "../../../lib";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { CustomEvent } from "@piwikpro/react-piwik-pro";
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
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const currentCase = CurrentCaseState.useState((s) => s);
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);
  const { sensitivityAnalysis, prevSensitivityAnalysis } =
    CaseVisualState.useState((s) => s);
  const { enableEditCase } = CaseUIState.useState((s) => s.general);

  const [selectedSegment, setSelectedSegment] = useState(null);
  const [binningDriverOptions, setBinningDriverOptions] = useState([]);
  const [driverPair, setDriverPair] = useState({});

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

  const dataSource = useMemo(() => {
    if (!selectedSegment) {
      return [];
    }
    const focusCommodity = currentCase?.case_commodities?.find(
      (cm) => cm.commodity_type === "focus"
    );
    const currencyUnit = currentCase?.currency || "";
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
        .map((u) => {
          if (u === "currency") {
            return currencyUnit;
          }
          return u === "crop"
            ? commodities
                .find((c) => c.id === focusCommodity?.commodity)
                ?.name?.toLowerCase() || ""
            : focusCommodity?.[u];
        })
        .join(" / ");
      return {
        key: parseInt(i) - 1,
        name: currentQuestion.text,
        current: d.find((a) => a.name === "current")?.value || 0,
        feasible: d.find((a) => a.name === "feasible")?.value || 0,
        unitName: unitName,
      };
    });
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
  }, [
    selectedSegment,
    dashboardData,
    currentCase?.case_commodities,
    currentCase?.currency,
  ]);

  const binningValues = useMemo(() => {
    const allBining = Object.keys(sensitivityAnalysis.config);
    const groupBinning = Object.keys(
      groupBy(allBining, (b) => b.split("_")[0])
    ).map((g) => {
      const binning = allBining.filter((b) => b.split("_")[0] === g);
      const binningValue = binning.reduce((acc, b) => {
        const value = sensitivityAnalysis?.config?.[b];
        return {
          ...acc,
          [b.split("_")[1]]: value,
        };
      }, {});
      const selected = [
        "x-axis-driver",
        "y-axis-driver",
        "binning-driver-name",
      ];
      return {
        id: parseInt(g),
        binning: binning,
        values: binningValue,
        selected: selected
          .map((s) => {
            return {
              name: s,
              value: binningValue?.[s],
            };
          })
          .filter((s) => s),
      };
    });
    return groupBinning;
  }, [sensitivityAnalysis.config]);

  const onSensitivityAnalysisValuesChange = (changedValue, allValues) => {
    const objectName = Object.keys(changedValue)[0];
    const [segmentId, valueName] = objectName.split("_");
    const value = changedValue[objectName];

    if (valueName === "x-axis-driver") {
      const dataValue = dataSource.find((d) => d.name === value);
      setDriverPair((prev) => ({ ...prev, xAxisName: dataValue?.name || "" }));
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
      setDriverPair((prev) => ({ ...prev, yAxisName: dataValue?.name || "" }));
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
      setDriverPair((prev) => ({ ...prev, binName: dataValue?.name || "" }));
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
    const filteredValues = Object.entries(allValues).reduce(
      (acc, [key, value]) => {
        acc[key] = value;
        return acc;
      },
      {}
    );
    updateCaseVisualSensitivityAnalysisState({
      case: currentCase.id,
      config: {
        ...sensitivityAnalysis?.config,
        ...filteredValues,
      },
    });
    form.setFieldsValue(filteredValues);
  };

  // handle track event
  useEffect(() => {
    if (!isEmpty(driverPair) && Object.keys(driverPair)?.length === 3) {
      const { xAxisName, yAxisName, binName } = driverPair;
      const combinedSelection = `${xAxisName} - ${yAxisName} - ${binName}`;
      CustomEvent.trackEvent(
        "Sensitivity Analysis - Which pairs of drivers have a strong impact on income", // Event Category
        "on driver selection", // Event Action
        "Driver Pair Selection", // Event Name
        1, // Event Value
        {
          dimension10: combinedSelection, // Custom Dimension: Track combination of x-y-bin
        }
      );

      // Matomo event
      if (window._paq) {
        // 1️⃣ Aggregatable event for FREE Matomo
        window._paq.push([
          "trackEvent",
          "Sensitivity Analysis",
          `Driver pair selected - ${combinedSelection}`, // Action
          "", // Label unused
          1,
        ]);

        // 2️⃣ Structured event for future paid reports
        window._paq.push([
          "trackEvent",
          "Sensitivity Analysis",
          "Driver pair selected",
          `driver_pair=${combinedSelection}`,
          1,
        ]);
      }

      console.info(
        "track event",
        "Sensitivity Analysis - Which pairs of drivers have a strong impact on income",
        "on driver selection",
        "Driver Pair Selection",
        1,
        {
          dimension10: combinedSelection,
        }
      );
    }
  }, [driverPair]);

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
      {/* EOL NEW - Explore: How do income drivers need to change to close the gap? */}

      {/* #2 Sensitivity Analysis */}
      <Col span={24}>
        <Card className="card-section-wrapper">
          Which pairs of drivers have a strong impact on income?
        </Card>
      </Col>
      <Col span={24}>
        <Card className="card-content-wrapper">
          <Row gutter={[20, 20]}>
            {/* Binning Form */}
            <Col span={24}>
              {/* Description */}
              <p>
                Select the segment and upto three impactful drivers for which
                you want to run the sensibility analysis. The tools populates
                the current and feasible values by default.
              </p>
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
                initialValues={sensitivityAnalysis?.config || {}}
              >
                {dashboardData.map((segment, key) => (
                  <BinningDriverForm
                    key={key}
                    selectedSegment={selectedSegment}
                    segment={segment}
                    dataSource={dataSource}
                    selected={
                      binningValues.find((b) => b.id === segment.id)?.selected
                    }
                    hidden={selectedSegment !== segment.id}
                    setBinningDriverOptions={setBinningDriverOptions}
                  />
                ))}
              </Form>
            </Col>
            {/* EOL Binning Form */}

            {/* Adjust Income Target */}
            <Col span={24}>
              <AdjustIncomeTarget selectedSegment={selectedSegment} />
            </Col>
            {/* EOL Adjust Income Target */}

            {/* Sensitivity Analysis Chart */}
            <Col span={24}>
              {/* LINE GRAPH */}
              {dashboardData.map((segment) =>
                selectedSegment === segment.id ? (
                  <ChartBinningDriversSensitivityAnalysis
                    key={segment.id}
                    segment={segment}
                    data={sensitivityAnalysis.config}
                    origin={dataSource}
                    binningDriverOptions={binningDriverOptions}
                    setAdjustTargetVisible={() => {}}
                  />
                ) : null
              )}
              {/* EOL LINE GRAPH */}
            </Col>
            <Col span={24}>
              {dashboardData.map((segment) =>
                selectedSegment === segment.id ? (
                  <ChartBinningHeatmapSensitivityAnalysis
                    key={segment.id}
                    segment={segment}
                    data={sensitivityAnalysis.config}
                    origin={dataSource}
                  />
                ) : null
              )}
            </Col>
            {/* EOL Sensitivity Analysis Chart */}
          </Row>
        </Card>
      </Col>
      {/* EOL Sensitivity Analysis */}

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
