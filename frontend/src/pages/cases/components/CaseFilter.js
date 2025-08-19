import React, { useState, useEffect, useMemo } from "react";
import { Card, Row, Col, Button, Select, InputNumber, Input } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { selectProps, api } from "../../../lib";
import { commodityOptions, countryOptions } from "../../../store/static";
import { UIState } from "../../../store";

const CaseFilter = ({
  filters = {},
  handleApplyFilters = () => {},
  handleClose = () => {},
}) => {
  const { tagOptions, companyOptions } = UIState.useState((s) => s);

  const [country, setCountry] = useState(filters.country || null);
  const [commodity, setCommodity] = useState(filters.commodity || null);
  const [tags, setTags] = useState(filters.tags || []);
  const [year, setYear] = useState(filters.year || null);
  const [email, setEmail] = useState(filters.email || null);
  const [company, setCompany] = useState(null);
  const [caseCountries, setCaseCountries] = useState([]);

  useEffect(() => {
    api
      .get("case_countries")
      .then((res) => {
        setCaseCountries(res.data);
      })
      .catch((e) => {
        console.error(e.response);
      });
  }, []);

  const filteredCountryOptions = useMemo(() => {
    const filterCountry = countryOptions.filter((country) =>
      caseCountries.includes(country.value)
    );
    return filterCountry;
  }, [caseCountries]);

  const filterProps = {
    ...selectProps,
    style: { width: "100%" },
  };

  const handleReset = () => {
    setCountry(null);
    setCompany(null);
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
            style={{ float: "right" }}
          />
        </Col>
      </Row>
      <Row gutter={[12, 12]} className="case-filter-body">
        <Col span={24}>
          <label>Select Country</label>
          <Select
            {...filterProps}
            key="1"
            options={filteredCountryOptions}
            placeholder="Country"
            value={country}
            onChange={setCountry}
          />
        </Col>
        <Col span={24}>
          <label>Select Company</label>
          <Select
            {...filterProps}
            key="1"
            options={companyOptions}
            placeholder="Company"
            value={company}
            onChange={setCompany}
          />
        </Col>
        <Col span={24}>
          <label>Select Primary Commodity</label>
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
          <label>Select Tags</label>
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
                company,
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
