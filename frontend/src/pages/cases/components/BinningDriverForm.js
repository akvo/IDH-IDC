import React, { useMemo } from "react";
import { Row, Col, Form, Select, InputNumber } from "antd";
import { InputNumberThousandFormatter } from "../../../lib";
import { selectProps } from "../../../lib";
import { CaseUIState } from "../store";

const binningDriverFormStyles = {
  inputNumber: {
    width: "100%",
  },
};

const generateDriverOptions = (drivers, selected, excludes) => {
  const options = selected.filter((s) => excludes.includes(s.name));
  return drivers.map((d) => ({
    ...d,
    disabled: options.find((o) => o.value === d.value),
  }));
};

const BinningDriverForm = ({
  segment,
  selectedSegment,
  hidden,
  dataSource = [],
  selected = [],
  setBinningDriverOptions = () => {},
}) => {
  const { enableEditCase } = CaseUIState.useState((s) => s.general);

  const drivers = useMemo(() => {
    if (!selectedSegment) {
      return [];
    }
    // filter drivers to include in BinningForm options
    const res = dataSource
      .filter(
        (d) =>
          !["Total Primary Income", "Total Income", "Income Target"].includes(
            d.name
          )
      )
      .map((x) => {
        return {
          value: x.name,
          label: x.name,
          unitName: x.unitName,
        };
      });
    setBinningDriverOptions(res);
    return res;
  }, [selectedSegment, dataSource, setBinningDriverOptions]);

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

  const driverName = useMemo(() => {
    const x = selected.find((s) => s.name === "x-axis-driver");
    const y = selected.find((s) => s.name === "y-axis-driver");
    const binning = selected.find((s) => s.name === "binning-driver-name");
    return {
      x: x?.value || "",
      y: y?.value || "",
      binning: binning?.value || "",
    };
  }, [selected]);

  return (
    <Row gutter={[20, 20]} style={{ display: hidden ? "none" : "" }}>
      <Col span={24}>
        {/* BINNING DRIVER FORM ITEM */}
        <Row gutter={[10, 10]} align="middle">
          <Col span={12}>
            <Form.Item
              name={`${segment.id}_binning-driver-name`}
              label={`Select driver 1 that you want to see at different levels : ${driverName.binning}`}
            >
              <Select
                className="binning-input"
                {...selectProps}
                options={options["binning-driver-name"]}
                disabled={!enableEditCase}
                placeholder="Select driver"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Row gutter={[10, 10]} align="middle">
              <Col span={8}>
                <Form.Item
                  name={`${segment.id}_binning-value-1`}
                  label="Value 1"
                >
                  <InputNumber
                    className="binning-input"
                    {...InputNumberThousandFormatter}
                    disabled={!enableEditCase}
                    controls={false}
                    style={binningDriverFormStyles.inputNumber}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name={`${segment.id}_binning-value-2`}
                  label="Value 2"
                >
                  <InputNumber
                    className="binning-input"
                    {...InputNumberThousandFormatter}
                    disabled={!enableEditCase}
                    controls={false}
                    style={binningDriverFormStyles.inputNumber}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name={`${segment.id}_binning-value-3`}
                  label="Value 3"
                >
                  <InputNumber
                    className="binning-input"
                    {...InputNumberThousandFormatter}
                    disabled={!enableEditCase}
                    controls={false}
                    style={binningDriverFormStyles.inputNumber}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>
        {/* EOL BINNING DRIVER FORM ITEM */}

        {/* X AXIS DRIVER FORM ITEM */}
        <Row gutter={[10, 10]} align="middle">
          <Col span={12}>
            <Form.Item
              name={`${segment.id}_x-axis-driver`}
              label={`Select input driver 2 (X-axis) : ${driverName.x}`}
            >
              <Select
                className="binning-input"
                {...selectProps}
                options={options["x-axis-driver"]}
                disabled={!enableEditCase}
                placeholder="Select driver"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name={`${segment.id}_x-axis-min-value`}
              label="Minimum value"
            >
              <InputNumber
                className="binning-input"
                {...InputNumberThousandFormatter}
                disabled={!enableEditCase}
                controls={false}
                style={binningDriverFormStyles.inputNumber}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name={`${segment.id}_x-axis-max-value`}
              label="Maximum value"
            >
              <InputNumber
                className="binning-input"
                {...InputNumberThousandFormatter}
                disabled={!enableEditCase}
                controls={false}
                style={binningDriverFormStyles.inputNumber}
              />
            </Form.Item>
          </Col>
        </Row>
        {/* EOL X AXIS DRIVER FORM ITEM */}

        {/* Y AXIS DRIVER FORM ITEM */}
        <Row gutter={[10, 10]} align="middle">
          <Col span={12}>
            <Form.Item
              name={`${segment.id}_y-axis-driver`}
              label={`Select output driver (Y-axis) : ${driverName.y}`}
            >
              <Select
                className="binning-input"
                {...selectProps}
                options={options["y-axis-driver"]}
                disabled={!enableEditCase}
                placeholder="Select driver"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name={`${segment.id}_y-axis-min-value`}
              label="Minimum value"
            >
              <InputNumber
                className="binning-input"
                {...InputNumberThousandFormatter}
                disabled={!enableEditCase}
                controls={false}
                style={binningDriverFormStyles.inputNumber}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name={`${segment.id}_y-axis-max-value`}
              label="Maximum value"
            >
              <InputNumber
                className="binning-input"
                {...InputNumberThousandFormatter}
                disabled={!enableEditCase}
                controls={false}
                style={binningDriverFormStyles.inputNumber}
              />
            </Form.Item>
          </Col>
        </Row>
        {/* EOL Y AXIS DRIVER FORM ITEM */}
      </Col>
    </Row>
  );
};

export default BinningDriverForm;
