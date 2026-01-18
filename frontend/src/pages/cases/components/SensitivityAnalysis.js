import React, { useState, useEffect, useMemo } from "react";
import { CurrentCaseState, CaseVisualState } from "../store";
import { Row, Col, Card, Form } from "antd";
import {
  ChartBinningDriversSensitivityAnalysis,
  ChartBinningHeatmapSensitivityAnalysis,
} from "../visualizations";
import {
  BinningDriverForm,
  SegmentSelector,
  AdjustIncomeTarget,
} from "../components";
import { map, groupBy, isEmpty } from "lodash";
import { commodities } from "../../../store/static";
import { CustomEvent } from "@piwikpro/react-piwik-pro";

const SensitivityAnalysis = () => {
  const [form] = Form.useForm();

  const [selectedSegment, setSelectedSegment] = useState(null);
  const [binningDriverOptions, setBinningDriverOptions] = useState([]);
  const [driverPair, setDriverPair] = useState({});

  const currentCase = CurrentCaseState.useState((s) => s);
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);
  const { sensitivityAnalysis } = CaseVisualState.useState((s) => s);

  const updateCaseVisualSensitivityAnalysisState = (updatedValue) => {
    CaseVisualState.update((s) => ({
      ...s,
      sensitivityAnalysis: {
        ...s.sensitivityAnalysis,
        ...updatedValue,
      },
    }));
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

  return (
    <Card className="card-content-wrapper">
      <Row gutter={[20, 20]}>
        {/* Binning Form */}
        <Col span={24}>
          {/* Description */}
          <p>
            Select the segment and upto three impactful drivers for which you
            want to run the sensibility analysis. The tools populates the
            current and feasible values by default.
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
  );
};

export default SensitivityAnalysis;
