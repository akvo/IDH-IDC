import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Row,
  Col,
  Card,
  Select,
  InputNumber,
  Table,
  Form,
  Space,
  Tooltip,
} from "antd";
import { groupBy, map, isEmpty, uniq } from "lodash";
import {
  ChartBinningHeatmap,
  ChartSensitivityAnalysisLine,
} from "../visualizations";
import { InputNumberThousandFormatter } from ".";
import { thousandFormatter } from "../../../components/chart/options/common";
import { SaveAsImageButton } from "../../../components/utils";
import { InfoCircleOutlined } from "@ant-design/icons";

const columns = [
  {
    title: "Income Driver",
    dataIndex: "name",
    key: "name",
    render: (name, record) => (
      <>
        {name} <small>({record.unitName})</small>
      </>
    ),
  },
  {
    title: "Current values",
    dataIndex: "current",
    key: "current",
    render: (value) => thousandFormatter(value),
  },
  {
    title: "Feasible values",
    dataIndex: "feasible",
    key: "feasible",
    render: (value) => thousandFormatter(value),
  },
];

const settingsForAnalysisContent = [
  {
    title: "Select segment",
    description:
      "Select the segment for which you want to perform the sensitivity analysis.",
  },
  {
    title: "Select the drivers",
    description:
      "Select three drivers you want to model. The other two drivers remain at their current level.",
  },
  {
    title: "Explore results",
    description:
      "Use the different visuals to understand the dynamics of changing the 3 income drivers.",
  },
];

const generateDriverOptions = (drivers, selected, excludes) => {
  const options = selected.filter((s) => excludes.includes(s.name));
  return drivers.map((d) => ({
    ...d,
    disabled: options.find((o) => o.value === d.value),
  }));
};

const BinningForm = ({
  selected = [],
  segment,
  drivers = [],
  hidden,
  enableEditCase,
}) => {
  const options = useMemo(() => {
    if (!selected.length) {
      return {
        "binning-driver-name": drivers,
        "x-axis-driver": drivers,
        "y-axis-driver": drivers,
      };
    }
    return {
      "binning-driver-name": generateDriverOptions(drivers, selected, [
        "x-axis-driver",
        "y-axis-driver",
      ]),
      "x-axis-driver": generateDriverOptions(drivers, selected, [
        "binning-driver-name",
        "y-axis-driver",
      ]),
      "y-axis-driver": generateDriverOptions(drivers, selected, [
        "binning-driver-name",
        "x-axis-driver",
      ]),
    };
  }, [drivers, selected]);

  const selectedDriverUnit = useMemo(() => {
    const transformSelected = selected
      .map((s) => {
        const findDriver = drivers.find((d) => d.value === s.value);
        return {
          ...s,
          ...findDriver,
        };
      })
      .reduce((res, curr) => ({ ...res, [curr.name]: curr }), {});
    return transformSelected;
  }, [selected, drivers]);

  return (
    <Row gutter={[16, 16]} style={{ display: hidden ? "none" : "" }}>
      <Col span={8}>
        <Card
          title={
            <b>
              Binning Driver{" "}
              <small>
                ({selectedDriverUnit["binning-driver-name"]?.unitName})
              </small>
            </b>
          }
          className="info-card-wrapper"
          extra={
            <Tooltip title="The binning driver can take on three specific values called 'bins.' We create a separate heatmap for each bin below allowing us to compare the results. Likewise, the lines in the line graph represent the 3 bins.">
              <InfoCircleOutlined className="info-icon" />
            </Tooltip>
          }
        >
          <Form.Item name={`${segment.id}_binning-driver-name`}>
            <Select
              className="binning-input"
              options={options["binning-driver-name"]}
              allowClear
              disabled={!enableEditCase}
              placeholder="Select driver"
            />
          </Form.Item>
          <br />
          <Row gutter={[8, 8]}>
            <Col span={24}>
              <div>Bin values</div>
            </Col>
            <Col span={24}>
              <Row gutter={[8, 8]} align="middle">
                <Col span={8}>
                  <Form.Item name={`${segment.id}_binning-value-1`}>
                    <InputNumber
                      className="binning-input"
                      {...InputNumberThousandFormatter}
                      disabled={!enableEditCase}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name={`${segment.id}_binning-value-2`}>
                    <InputNumber
                      className="binning-input"
                      {...InputNumberThousandFormatter}
                      disabled={!enableEditCase}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name={`${segment.id}_binning-value-3`}>
                    <InputNumber
                      className="binning-input"
                      {...InputNumberThousandFormatter}
                      disabled={!enableEditCase}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>
      </Col>
      <Col span={8}>
        <Card
          title={
            <b>
              X-Axis Driver{" "}
              <small>({selectedDriverUnit["x-axis-driver"]?.unitName})</small>
            </b>
          }
          className="info-card-wrapper"
          extra={
            <Tooltip title="This driver will be reflected on the x-axis of the line chart, and in the columns of the heatmaps. You need to set a minimum and maximum value.">
              <InfoCircleOutlined className="info-icon" />
            </Tooltip>
          }
        >
          <Form.Item name={`${segment.id}_x-axis-driver`}>
            <Select
              className="binning-input"
              options={options["x-axis-driver"]}
              allowClear
              disabled={!enableEditCase}
              placeholder="Select driver"
            />
          </Form.Item>
          <br />
          <Row gutter={[8, 8]} align="middle">
            <Col span={12}>
              <Row gutter={[8, 8]}>
                <Col span={24}>
                  <div>Minimum Value</div>
                </Col>
                <Col span={24}>
                  <Form.Item name={`${segment.id}_x-axis-min-value`}>
                    <InputNumber
                      className="binning-input"
                      {...InputNumberThousandFormatter}
                      disabled={!enableEditCase}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
            <Col span={12}>
              <Row gutter={[8, 8]}>
                <Col span={24}>
                  <div>Maximum Value</div>
                </Col>
                <Col span={24}>
                  <Form.Item name={`${segment.id}_x-axis-max-value`}>
                    <InputNumber
                      className="binning-input"
                      {...InputNumberThousandFormatter}
                      disabled={!enableEditCase}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>
      </Col>
      <Col span={8}>
        <Card
          title={
            <b>
              Y-Axis Driver{" "}
              <small>({selectedDriverUnit["y-axis-driver"]?.unitName})</small>
            </b>
          }
          className="info-card-wrapper"
          extra={
            <Tooltip title="This driver will be reflected on the y-axis of the line chart, and in the rows of the heatmaps. You need to set a minimum and maximum value.">
              <InfoCircleOutlined className="info-icon" />
            </Tooltip>
          }
        >
          <Form.Item name={`${segment.id}_y-axis-driver`}>
            <Select
              className="binning-input"
              options={options["y-axis-driver"]}
              allowClear
              disabled={!enableEditCase}
              placeholder="Select driver"
            />
          </Form.Item>
          <br />
          <Row gutter={[8, 8]} align="middle">
            <Col span={12}>
              <Row gutter={[8, 8]}>
                <Col span={24}>Minimum Value</Col>
                <Col span={24}>
                  <Form.Item name={`${segment.id}_y-axis-min-value`}>
                    <InputNumber
                      className="binning-input"
                      {...InputNumberThousandFormatter}
                      disabled={!enableEditCase}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
            <Col span={12}>
              <Row gutter={[8, 8]}>
                <Col span={24}>Maximum Value</Col>
                <Col span={24}>
                  <Form.Item name={`${segment.id}_y-axis-max-value`}>
                    <InputNumber
                      className="binning-input"
                      {...InputNumberThousandFormatter}
                      disabled={!enableEditCase}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
};

const DashboardSensitivityAnalysis = ({
  dashboardData = [],
  binningData,
  setBinningData,
  commodityList,
  enableEditCase,
}) => {
  const [currentSegment, setCurrentSegment] = useState(null);
  const [form] = Form.useForm();
  const elDriversTable = useRef(null);

  useEffect(() => {
    if (!isEmpty(binningData)) {
      const segmentIds = uniq(
        Object.keys(binningData).map((key) => key.split("_")[0])
      );
      setCurrentSegment(parseInt(segmentIds[0]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dataSource = useMemo(() => {
    if (!currentSegment) {
      return [];
    }
    const focusCommodity = commodityList.find(
      (cm) => cm.commodity_type === "focus"
    );
    const segmentData = dashboardData.find(
      (segment) => segment.id === currentSegment
    );
    const answers = segmentData.answers;
    const drivers = answers.filter(
      (answer) => answer.question.parent_id === 1 && answer.commodityFocus
    );
    const data = map(groupBy(drivers, "question.id"), (d, i) => {
      const currentQuestion = d[0].question;
      const unitName = currentQuestion.unit
        .split("/")
        .map((u) => u.trim())
        .map((u) => focusCommodity?.[u])
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
  }, [currentSegment, dashboardData, commodityList]);

  const drivers = useMemo(() => {
    if (!currentSegment) {
      return [];
    }
    // filter drivers to include in BinningForm options
    return dataSource.filter(
      (d) =>
        !["Total Primary Income", "Total Income", "Income Target"].includes(
          d.name
        )
    );
  }, [currentSegment, dataSource]);

  const binningValues = useMemo(() => {
    const allBining = Object.keys(binningData);
    const groupBinning = Object.keys(
      groupBy(allBining, (b) => b.split("_")[0])
    ).map((g) => {
      const binning = allBining.filter((b) => b.split("_")[0] === g);
      const binningValue = binning.reduce((acc, b) => {
        const value = binningData[b];
        return {
          ...acc,
          [b.split("_")[1]]: value,
        };
      }, {});
      const selected = [
        "binning-driver-name",
        "x-axis-driver",
        "y-axis-driver",
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
  }, [binningData]);

  const handleOnChangeSegmentDropdown = (value) => {
    setCurrentSegment(value);
  };

  const onValuesChange = (c, values) => {
    const objectName = Object.keys(c)[0];
    const [segmentId, valueName] = objectName.split("_");
    const value = c[objectName];

    if (valueName === "x-axis-driver") {
      const dataValue = dataSource.find((d) => d.name === value);
      values = {
        ...values,
        [`${segmentId}_x-axis-driver`]: dataValue?.name,
        [`${segmentId}_x-axis-min-value`]: dataValue?.current,
        [`${segmentId}_x-axis-max-value`]: dataValue?.feasible,
      };
    }
    if (valueName === "y-axis-driver") {
      const dataValue = dataSource.find((d) => d.name === value);
      values = {
        ...values,
        [`${segmentId}_y-axis-driver`]: dataValue?.name,
        [`${segmentId}_y-axis-min-value`]: dataValue?.current,
        [`${segmentId}_y-axis-max-value`]: dataValue?.feasible,
      };
    }
    if (valueName === "binning-driver-name") {
      const dataValue = dataSource.find((d) => d.name === value);
      values = {
        ...values,
        [`${segmentId}_binning-driver-name`]: dataValue?.name,
        [`${segmentId}_binning-value-1`]: dataValue?.current,
        [`${segmentId}_binning-value-2`]: dataValue
          ? (dataValue.current + dataValue.feasible) / 2
          : dataValue,
        [`${segmentId}_binning-value-3`]: dataValue?.feasible,
      };
    }
    setBinningData(values);
    form.setFieldsValue(values);
  };

  const tableSummaryValue = useMemo(
    () => dataSource.find((d) => d.name === "Income Target"),
    [dataSource]
  );

  return (
    <Row id="sensitivity-analysis" gutter={[24, 24]}>
      <Col span={24} className="income-driver-dashboard">
        <Row gutter={[24, 24]} align="middle">
          <Col span={10} className="settings-wrapper">
            <h2>Perform a sensitivity analysis</h2>
            <p>
              On this page, you can explore how different combinations of income
              drivers lead to varying income levels. Whether it&apos;s
              increasing area, applying pricing strategies, or diversifying
              income sources, this page empowers you to investigate various
              scenarios and understand the paths towards improving farmer
              household income.
            </p>
            <Space direction="vertical" className="settings-info-wrapper">
              {settingsForAnalysisContent.map((it, i) => (
                <div key={i}>
                  <Space direction="vertical">
                    <Space align="center">
                      <div className="number">{i + 1}</div>
                      <div className="title">{it.title}</div>
                    </Space>
                    <div className="description">{it.description}</div>
                  </Space>
                </div>
              ))}
            </Space>
          </Col>
          <Col span={14}>
            <Row gutter={[18, 18]}>
              <Col span={24}>
                <Card title="Select segment" className="info-card-wrapper">
                  <Select
                    style={{ width: "100%" }}
                    onChange={handleOnChangeSegmentDropdown}
                    options={dashboardData.map((segment) => ({
                      value: segment.id,
                      label: segment.name,
                    }))}
                    value={currentSegment}
                  />
                </Card>
              </Col>
              <Col span={24} ref={elDriversTable}>
                <Card
                  title="The breakdown of drivers"
                  className="info-card-wrapper no-padding"
                  extra={
                    <SaveAsImageButton
                      elementRef={elDriversTable}
                      filename={"The breakdown of drivers"}
                      type="ghost-white"
                    />
                  }
                >
                  <Table
                    size="small"
                    className="income-driver-table"
                    dataSource={
                      currentSegment
                        ? dataSource.filter((d) => d.name !== "Income Target")
                        : []
                    }
                    columns={columns}
                    pagination={false}
                    summary={() =>
                      currentSegment ? (
                        <Table.Summary>
                          <Table.Summary.Row>
                            <Table.Summary.Cell index={0}>
                              Income Target{" "}
                              <small>({tableSummaryValue?.unitName})</small>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1}>
                              {tableSummaryValue?.current
                                ? thousandFormatter(tableSummaryValue.current)
                                : 0}
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={2}></Table.Summary.Cell>
                          </Table.Summary.Row>
                        </Table.Summary>
                      ) : null
                    }
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Col>

      <Col span={24} className="income-driver-dashboard">
        <Row
          className="income-driver-content"
          align="middle"
          justify="space-evenly"
          gutter={[8, 8]}
        >
          <Col span={24}>
            <Form
              name="sensitivity-analysis"
              layout="horizontal"
              form={form}
              onValuesChange={onValuesChange}
              initialValues={binningData}
            >
              {dashboardData.map((segment, key) => (
                <BinningForm
                  key={key}
                  segment={segment}
                  drivers={drivers.map((x) => {
                    return {
                      value: x.name,
                      label: x.name,
                      unitName: x.unitName,
                    };
                  })}
                  selected={
                    binningValues.find((b) => b.id === segment.id)?.selected
                  }
                  hidden={currentSegment !== segment.id}
                  enableEditCase={enableEditCase}
                />
              ))}
            </Form>
          </Col>
        </Row>
      </Col>

      <Col span={24} className="income-driver-dashboard">
        {dashboardData.map((segment) =>
          currentSegment === segment.id ? (
            <ChartSensitivityAnalysisLine
              key={segment.id}
              data={binningData}
              segment={segment}
              origin={dataSource}
            />
          ) : null
        )}
      </Col>

      <Col span={24} className="income-driver-dashboard">
        {dashboardData.map((segment) =>
          currentSegment === segment.id ? (
            <ChartBinningHeatmap
              key={segment.id}
              data={binningData}
              segment={segment}
              origin={dataSource}
            />
          ) : null
        )}
      </Col>
    </Row>
  );
};

export default DashboardSensitivityAnalysis;
