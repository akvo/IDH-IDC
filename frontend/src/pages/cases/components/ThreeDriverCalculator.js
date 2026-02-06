import React, { useMemo } from "react";
import { Card, Space, Row, Col, Select, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { CaseVisualState, CurrentCaseState } from "../store";
import { map, groupBy } from "lodash";
import { commodities } from "../../../store/static";
import { selectProps } from "../../../lib";
import {
  ThreeDriverCombinationChart,
  GapClosingPieChart,
} from "../visualizations";
import { yAxisFormula } from "../../../lib/formula";

const ThreeDriverCalculator = ({ selectedSegment }) => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);
  const { sensitivityAnalysis } = CaseVisualState.useState((s) => s);

  // const [thirdDriver, setThirdDriver] = useState(null);
  const thirdDriver = useMemo(() => {
    return (
      sensitivityAnalysis?.config?.[`${selectedSegment}_third-driver`] || null
    );
  }, [sensitivityAnalysis?.config, selectedSegment]);

  const handleThirdDriverChange = (value) => {
    CaseVisualState.update((s) => ({
      ...s,
      sensitivityAnalysis: {
        ...s.sensitivityAnalysis,
        config: {
          ...s.sensitivityAnalysis.config,
          [`${selectedSegment}_third-driver`]: value,
        },
      },
      prevSensitivityAnalysis: {
        ...s.prevSensitivityAnalysis,
        config: {
          ...s.prevSensitivityAnalysis.config,
          [`${selectedSegment}_third-driver`]: value,
        },
      },
    }));
  };

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

    if (!segmentData) {
      return [];
    }

    const answers = segmentData.answers;
    const drivers = answers.filter(
      (answer) => answer.question?.parent_id === 1 && answer.commodityFocus
    );
    const data = map(groupBy(drivers, "question.id"), (d, i) => {
      const currentQuestion = d[0].question;
      const unitName = currentQuestion?.unit
        ?.split("/")
        ?.map((u) => u.trim())
        ?.map((u) => {
          if (u === "currency") {
            return currencyUnit;
          }
          return u === "crop"
            ? commodities
                .find((c) => c.id === focusCommodity?.commodity)
                ?.name?.toLowerCase() || ""
            : focusCommodity?.[u];
        })
        ?.join(" / ");
      return {
        key: parseInt(i) - 1,
        qid: currentQuestion.id,
        name: currentQuestion.text,
        current: d.find((a) => a.name === "current")?.value || 0,
        feasible: d.find((a) => a.name === "feasible")?.value || 0,
        unitName: unitName,
      };
    });

    // Add Diversified Income as a driver
    data.push({
      key: "diversified-income",
      qid: 9002,
      name: "Diversified Income",
      current: segmentData.total_current_diversified_income || 0,
      feasible: segmentData.total_feasible_diversified_income || 0,
      unitName: currencyUnit,
    });

    return data;
  }, [
    selectedSegment,
    dashboardData,
    currentCase?.case_commodities,
    currentCase?.currency,
  ]);

  const drivers = useMemo(() => {
    return dataSource
      .filter((x) => yAxisFormula[`#${x.qid}`])
      .map((x) => ({
        value: x.name,
        label: x.name,
        qid: x.qid,
      }));
  }, [dataSource]);

  const xAxisDriver = useMemo(
    () => sensitivityAnalysis?.config?.[`${selectedSegment}_x-axis-driver`],
    [sensitivityAnalysis?.config, selectedSegment]
  );
  const yAxisDriver = useMemo(
    () => sensitivityAnalysis?.config?.[`${selectedSegment}_y-axis-driver`],
    [sensitivityAnalysis?.config, selectedSegment]
  );

  const options = useMemo(() => {
    return drivers.map((d) => ({
      ...d,
      disabled: d.value === xAxisDriver || d.value === yAxisDriver,
    }));
  }, [drivers, xAxisDriver, yAxisDriver]);

  const selectedThirdDriver = useMemo(() => {
    return dataSource.find((d) => d.name === thirdDriver);
  }, [dataSource, thirdDriver]);

  const xAxisDetails = useMemo(() => {
    return dataSource.find((d) => d.name === xAxisDriver);
  }, [dataSource, xAxisDriver]);

  const yAxisDetails = useMemo(() => {
    return dataSource.find((d) => d.name === yAxisDriver);
  }, [dataSource, yAxisDriver]);

  return (
    <Card
      className="card-content-wrapper card-with-gray-header-wrapper three-driver-calculator-wrapper"
      title={
        <Row gutter={[20, 20]}>
          <Col span={24}>
            <Space>
              <div className="title">
                <b>Three driver calculator</b>
              </div>
              <Tooltip title="Helpful information about three driver calculator">
                <InfoCircleOutlined className="info-icon" />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      }
    >
      <Row gutter={[20, 20]}>
        <Col span={24}>
          <p>
            If exploring combinations of two drivers still does not produce a
            feasible path to closing the income gap, consider adding a third
            driver. The tool will use the first two selected drivers and their
            combinations, then calculate the value the third driver would need
            to reach in order to close the gap.
          </p>
        </Col>

        <Col span={24} className="driver-selection-wrapper">
          <Space direction="vertical">
            <span>Select the third driver to calculate:</span>
            <Select
              className="driver-select"
              {...selectProps}
              options={options}
              value={thirdDriver}
              onChange={handleThirdDriverChange}
              placeholder="Select driver"
              disabled={!selectedSegment}
            />
          </Space>
        </Col>

        {thirdDriver && xAxisDriver && yAxisDriver && (
          <Col span={24}>
            <GapClosingPieChart
              selectedSegment={selectedSegment}
              thirdDriver={selectedThirdDriver}
              xAxisDriver={xAxisDetails}
              yAxisDriver={yAxisDetails}
            />
          </Col>
        )}

        {thirdDriver && xAxisDriver && yAxisDriver && (
          <Col span={24} className="combination-section">
            <Space direction="vertical" size={24} style={{ width: "100%" }}>
              <Space direction="vertical" size={16}>
                <h3 className="title combination-title">
                  What combination of drivers close to income gap?
                </h3>
                <p className="combination-description">
                  The tables below show the <b>{thirdDriver}</b> needed to close
                  the living income gap for different combinations of{" "}
                  <b>{xAxisDriver || "[X]"}</b> and{" "}
                  <b>{yAxisDriver || "[Y]"}</b>. The values for{" "}
                  <b>{xAxisDriver || "[X]"}</b> and{" "}
                  <b>{yAxisDriver || "[Y]"}</b> are taken from the ranges
                  defined above. The table focuses on combinations that are most
                  likely to reach the income target while staying within
                  feasible levels for the selected drivers.
                </p>
              </Space>

              <ThreeDriverCombinationChart
                selectedSegment={selectedSegment}
                thirdDriver={selectedThirdDriver}
                xAxisDriver={xAxisDetails}
                yAxisDriver={yAxisDetails}
              />
            </Space>
          </Col>
        )}
      </Row>
    </Card>
  );
};

export default ThreeDriverCalculator;
