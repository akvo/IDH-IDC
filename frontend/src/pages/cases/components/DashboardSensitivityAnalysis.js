import React, { useState, useMemo, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Divider,
  Alert,
  Select,
  InputNumber,
  Table,
  Form,
} from "antd";
import { groupBy, map, isEmpty, uniq } from "lodash";
import { ChartBinningHeatmap } from "../visualizations";
import { InputNumberThousandFormatter } from ".";
import { thousandFormatter } from "../../../components/chart/options/common";

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
    title: "Current",
    dataIndex: "current",
    key: "current",
    render: (value) => thousandFormatter(value),
  },
  {
    title: "Feasible",
    dataIndex: "feasible",
    key: "feasible",
    render: (value) => thousandFormatter(value),
  },
];

const generateDriverOptions = (drivers, selected, excludes) => {
  const options = selected.filter((s) => excludes.includes(s.name));
  return drivers.map((d) => ({
    ...d,
    disabled: options.find((o) => o.value === d.value),
  }));
};

const BinningForm = ({ selected = [], segment, drivers = [], hidden }) => {
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
    <Row gutter={[8, 8]} style={{ display: hidden ? "none" : "" }}>
      <Col span={12}>
        <b>
          Binning driver{" "}
          <small>({selectedDriverUnit["binning-driver-name"]?.unitName})</small>{" "}
          :
        </b>
      </Col>
      <Col span={12}>
        <Form.Item name={`${segment.id}_binning-driver-name`}>
          <Select
            size="small"
            className="binning-input"
            options={options["binning-driver-name"]}
            allowClear
          />
        </Form.Item>
      </Col>
      <Col span={12}>Bin Values:</Col>
      <Col span={4}>
        <Form.Item name={`${segment.id}_binning-value-1`}>
          <InputNumber
            size="small"
            className="binning-input"
            {...InputNumberThousandFormatter}
          />
        </Form.Item>
      </Col>
      <Col span={4}>
        <Form.Item name={`${segment.id}_binning-value-2`}>
          <InputNumber
            size="small"
            className="binning-input"
            {...InputNumberThousandFormatter}
          />
        </Form.Item>
      </Col>
      <Col span={4}>
        <Form.Item name={`${segment.id}_binning-value-3`}>
          <InputNumber
            size="small"
            className="binning-input"
            {...InputNumberThousandFormatter}
          />
        </Form.Item>
      </Col>
      <Divider />
      <Col span={12}>
        <b>
          X-Axis Driver{" "}
          <small>({selectedDriverUnit["x-axis-driver"]?.unitName})</small> :
        </b>
      </Col>
      <Col span={12}>
        <Form.Item name={`${segment.id}_x-axis-driver`}>
          <Select
            size="small"
            className="binning-input"
            options={options["x-axis-driver"]}
            allowClear
          />
        </Form.Item>
      </Col>
      <Col span={12}>Minimum Value:</Col>
      <Col span={4}>
        <Form.Item name={`${segment.id}_x-axis-min-value`}>
          <InputNumber
            size="small"
            className="binning-input"
            {...InputNumberThousandFormatter}
          />
        </Form.Item>
      </Col>
      <Col span={12}>Maximum Value</Col>
      <Col span={4}>
        <Form.Item name={`${segment.id}_x-axis-max-value`}>
          <InputNumber
            size="small"
            className="binning-input"
            {...InputNumberThousandFormatter}
          />
        </Form.Item>
      </Col>
      <Divider />
      <Col span={12}>
        <b>
          Y-Axis Driver{" "}
          <small>({selectedDriverUnit["y-axis-driver"]?.unitName})</small> :
        </b>
      </Col>
      <Col span={12}>
        <Form.Item name={`${segment.id}_y-axis-driver`}>
          <Select
            size="small"
            className="binning-input"
            options={options["y-axis-driver"]}
            allowClear
          />
        </Form.Item>
      </Col>
      <Col span={12}>Minimum Value:</Col>
      <Col span={4}>
        <Form.Item name={`${segment.id}_y-axis-min-value`}>
          <InputNumber
            size="small"
            className="binning-input"
            {...InputNumberThousandFormatter}
          />
        </Form.Item>
      </Col>
      <Col span={12}>Maximum Value</Col>
      <Col span={4}>
        <Form.Item name={`${segment.id}_y-axis-max-value`}>
          <InputNumber
            size="small"
            className="binning-input"
            {...InputNumberThousandFormatter}
          />
        </Form.Item>
      </Col>
    </Row>
  );
};

const DashboardSensitivityAnalysis = ({
  dashboardData = [],
  binningData,
  setBinningData,
  commodityList,
}) => {
  const [currentSegment, setCurrentSegment] = useState(null);
  const [form] = Form.useForm();

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
        name: "Total Focus Income",
        current: segmentData.total_current_focus_income?.toFixed(2) || 0,
        feasible: segmentData.total_feasible_focus_income?.toFixed(2) || 0,
        unitName: currencyUnit,
      },
      {
        key: data.length + 12,
        name: "Total Income",
        current: segmentData.total_current_income?.toFixed(2) || 0,
        feasible: segmentData.total_feasible_income?.toFixed(2) || 0,
        unitName: currencyUnit,
      },
      {
        key: data.length + 13,
        name: "Income Target",
        current: segmentData.target?.toFixed(2) || 0,
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
        !["Total Focus Income", "Total Income", "Income Target"].includes(
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
    <Row id="sensitivity-analysis">
      <Col span={24}>
        <Alert
          message="On this page you can explore how different combinations of drivers lead to different income levels. Whether it's optimizing land use, pricing strategies, or diversifying income sources, this page empowers you to explore various scenarios and find the best path towards improving farmer household income."
          type="success"
          className="alert-box"
        />
      </Col>
      <Col span={24}>
        <Card className="income-driver-dashboard">
          <Card.Grid
            style={{
              width: "100%",
            }}
            hoverable={false}
          >
            <Row
              className="income-driver-content"
              align="middle"
              justify="space-evenly"
              gutter={[8, 8]}
            >
              <Col span={24}>
                <h2>Settings for Analysis</h2>
              </Col>
              <Col span={20}>
                <b>Step 1</b>: Select segment for which you want to perform the
                sensitivity analysis
              </Col>
              <Col span={4}>
                <Select
                  size="small"
                  style={{ width: "100%", marginLeft: "10px" }}
                  onChange={handleOnChangeSegmentDropdown}
                  options={dashboardData.map((segment) => ({
                    value: segment.id,
                    label: segment.name,
                  }))}
                  value={currentSegment}
                />
              </Col>
              <Divider />
              <Col span={24}>
                <b>Step 2</b>: Select three drivers you want to model. The other
                two drivers remain at their current level. Use the driver
                overview on the right as reference.
                <ul>
                  <li>
                    Binning driver: this driver will be evaluated on a maximum
                    of three different values, named bins. For each bin, a
                    seperate heatmap will be created to compare. They also
                    reflect the different lines in the line chart.
                  </li>
                  <li>
                    X-axis driver: this driver will be reflected on the x-axis
                    of the line chart, and in the columns of the heatmaps. You
                    need to set a minimum and maximum value.{" "}
                  </li>
                  <li>
                    Y-axis driver: this driver will be reflected on the y-axis
                    of the line chart, and in the rows of the heatmaps. You need
                    to set a minimum and maximum value.
                  </li>
                </ul>
              </Col>
              <Divider />
              <Row
                className="income-driver-content"
                align="middle"
                justify="space-evenly"
                gutter={[8, 8]}
              >
                <Col span={10}>
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
                          binningValues.find((b) => b.id === segment.id)
                            ?.selected
                        }
                        hidden={currentSegment !== segment.id}
                      />
                    ))}
                  </Form>
                </Col>
                <Col span={10}>
                  {currentSegment ? (
                    <Table
                      size="small"
                      className="income-driver-table"
                      dataSource={dataSource.filter(
                        (d) => d.name !== "Income Target"
                      )}
                      columns={columns}
                      pagination={false}
                      summary={() => (
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
                      )}
                    />
                  ) : null}
                </Col>
                <Divider />
                <Col span={24}>
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
            </Row>
          </Card.Grid>
        </Card>
      </Col>
    </Row>
  );
};

export default DashboardSensitivityAnalysis;
