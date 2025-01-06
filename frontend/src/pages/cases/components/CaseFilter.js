import React, { useState } from "react";
import { Card, Row, Col, Button, Select, InputNumber, Input } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { selectProps } from ".";
import { UIState } from "../../../store";

const countryOptions = window.master.countries;
const commodityOptions = window.master.commodity_categories
  .flatMap((c) => c.commodities)
  .map((c) => ({ label: c.name, value: c.id }));

const CaseFilter = ({
  filters = {},
  handleApplyFilters = () => {},
  handleClose = () => {},
}) => {
  const tagOptions = UIState.useState((s) => s.tagOptions);

  const [country, setCountry] = useState(filters.country || null);
  const [commodity, setCommodity] = useState(filters.commodity || null);
  const [tags, setTags] = useState(filters.tags || []);
  const [year, setYear] = useState(filters.year || null);
  const [email, setEmail] = useState(filters.email || null);

  const filterProps = {
    ...selectProps,
    style: { width: "100%" },
  };

  const handleReset = () => {
    setCountry(null);
    setCommodity(null);
    setTags([]);
    setYear(null);
    setEmail(null);
    handleApplyFilters({
      country: null,
      commodity: null,
      tags: [],
      year: null,
      email: null,
    });
  };

  return (
    <Card className="case-filter-container">
      <Row align="middle" className="case-filter-header">
        <Col span={20} className="case-filter-title">
          Filter
        </Col>
        <Col span={4} align="end">
          <Button
            size="small"
            type="icon"
            icon={<CloseOutlined />}
            onClick={handleClose}
          />
        </Col>
      </Row>
      <Row gutter={[12, 12]} className="case-filter-body">
        <Col span={24}>
          <label>Select country</label>
          <Select
            {...filterProps}
            key="1"
            options={countryOptions}
            placeholder="Country"
            value={country}
            onChange={setCountry}
          />
        </Col>
        <Col span={24}>
          <label>Select primary commodity</label>
          <Select
            {...filterProps}
            key="2"
            options={commodityOptions}
            placeholder="Primary Commodity"
            value={commodity}
            onChange={setCommodity}
          />
        </Col>
        <Col span={24}>
          <label>Select tags</label>
          <Select
            {...filterProps}
            key="3"
            options={tagOptions}
            placeholder="Tags"
            mode="multiple"
            value={tags}
            onChange={setTags}
          />
        </Col>
        <Col span={24}>
          <label>Year</label>
          <InputNumber
            key="4"
            placeholder="Year"
            controls={false}
            onChange={setYear}
            value={year}
            style={{ width: "100%" }}
          />
        </Col>
        <Col span={24}>
          <label>Case owner email</label>
          <Input
            key="5"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
          />
        </Col>
      </Row>
      <Row className="case-filter-footer">
        <Col span={12}>
          <Button className="button-reset" onClick={handleReset}>
            Reset
          </Button>
        </Col>
        <Col span={12} align="end">
          <Button
            className="button-filter"
            onClick={() => {
              handleApplyFilters({
                country,
                commodity,
                tags,
                year,
                email,
              });
              handleClose();
            }}
          >
            Apply filters
          </Button>
        </Col>
      </Row>
    </Card>
  );
};

export default CaseFilter;
