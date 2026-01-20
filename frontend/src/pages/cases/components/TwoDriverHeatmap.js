import React, { useState, useMemo } from "react";
import { Card, Space, Button, Row, Col, Form } from "antd";
import { SegmentSelector, TwoBinningDriverForm } from "../components";
import { CaseVisualState, CurrentCaseState } from "../store";
import { map, groupBy } from "lodash";
import { ChartTwoDriverHeatmap } from "../visualizations";

const TwoDriverHeatmap = () => {
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
    const filteredValues = Object.entries(allValues).reduce(
      (acc, [key, value]) => {
        acc[key] = value;
        return acc;
      },
      {}
    );
    console.log(filteredValues, "===");
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
    <Card
      className="card-content-wrapper card-with-gray-header-wrapper"
      title={
        <Row gutter={[20, 20]}>
          <Col span={18}>
            <Space direction="vertical">
              <div className="title">
                <b>Two driver heatmap</b>
              </div>
              <div className="description">
                The heatmap below shows the income reached at any two
                combinations of x and y, within your selected ranges.
              </div>
            </Space>
          </Col>
          <Col span={6} align="end">
            <Button style={{ float: "right" }}>Clear</Button>
          </Col>
        </Row>
      }
    >
      <Row gutter={[20, 20]}>
        <Col span={24}>
          <p>
            Closing the income gap often requires adjusting more than one
            driver. Select two drivers to explore how different combinations
            within your chosen ranges affect the outcome. The tool uses current
            and feasible levels by default, but you can adjust these to test any
            combination.
          </p>
          <SegmentSelector
            selectedSegment={selectedSegment}
            setSelectedSegment={setSelectedSegment}
          />
        </Col>

        {/* BINNING FORM */}
        <Col span={24}>
          <Form
            name="sensitivity-analysis"
            layout="vertical"
            form={form}
            onValuesChange={onSensitivityAnalysisValuesChange}
            initialValues={sensitivityAnalysis?.config || {}}
          >
            {dashboardData.map((segment, key) => (
              <TwoBinningDriverForm
                key={key}
                selectedSegment={selectedSegment}
                segment={segment}
                dataSource={dataSource}
                selected={
                  binningValues.find((b) => b.id === segment.id)?.selected
                }
                hidden={selectedSegment !== segment.id}
                setBinningDriverOptions={setBinningDriverOptions}
                showBinningDriverField={false}
              />
            ))}
          </Form>
        </Col>

        {/* HEATMAP */}
        <Col span={24}>
          {dashboardData.map((segment) =>
            selectedSegment === segment.id ? (
              <ChartTwoDriverHeatmap
                key={segment.id}
                segment={segment}
                data={sensitivityAnalysis.config}
                origin={dataSource}
              />
            ) : null
          )}
        </Col>
      </Row>
    </Card>
  );
};

export default TwoDriverHeatmap;
