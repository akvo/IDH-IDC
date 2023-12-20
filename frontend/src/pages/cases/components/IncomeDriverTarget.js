import React, { useState, useEffect } from "react";
import { Row, Col, Form, InputNumber, Select, Switch } from "antd";
import { InputNumberThousandFormatter, selectProps } from "./";
import { api } from "../../../lib";
import isEmpty from "lodash/isEmpty";
import { thousandFormatter } from "../../../components/chart/options/common";

const formStyle = { width: "100%" };

const IncomeDriverTarget = ({
  segment,
  currentCase,
  segmentFormValues,
  setSegmentFormValues,
  segmentItem,
  enableEditCase,
  // totalIncome,
}) => {
  const [form] = Form.useForm();
  const [householdSize, setHouseholdSize] = useState(0);
  const [benchmark, setBenchmark] = useState(segmentItem?.benchmark || null);
  const [incomeTarget, setIncomeTarget] = useState(0);
  const [disableTarget, setDisableTarget] = useState(true);
  const [regionOptions, setRegionOptions] = useState([]);
  const [loadingRegionOptions, setLoadingRegionOptions] = useState(false);
  const currentSegmentId = segmentItem?.currentSegmentId || null;
  const [regionOptionStatus, setRegionOptionStatus] = useState(null);

  const calculateHouseholdSize = ({
    household_adult = 0,
    household_children = 0,
  }) => {
    // OECD average household size
    // first adult = 1, next adult 0.5
    // 1 child = 0.3
    const adult_size =
      household_adult === 1 ? 1 : 1 + (household_adult - 1) * 0.5;
    const children_size = household_children * 0.3;
    return adult_size + children_size;
  };

  const updateFormValues = (value) => {
    const updatedFv = segmentFormValues.map((fv) => {
      if (fv.key === segment) {
        return {
          ...fv,
          ...value,
        };
      }
      return fv;
    });
    setSegmentFormValues(updatedFv);
  };

  // load initial target & hh size
  useEffect(() => {
    if (!isEmpty(segmentItem) && currentSegmentId) {
      setIncomeTarget(segmentItem?.target || 0);
      if (!segmentItem?.region) {
        form.setFieldsValue({
          manual_target: true,
          target: segmentItem?.target || null,
        });
        setDisableTarget(false);
      }
      form.setFieldsValue({ region: segmentItem?.region || null });
      form.setFieldsValue({
        household_adult: segmentItem?.adult || null,
      });
      form.setFieldsValue({
        household_children: segmentItem?.child || null,
      });
      const HHSize = calculateHouseholdSize({
        household_adult: segmentItem?.adult || 0,
        household_children: segmentItem?.child || 0,
      });
      setHouseholdSize(HHSize);
    }
  }, [segmentItem, currentSegmentId, form]);

  useEffect(() => {
    // handle income target value when householdSize updated
    if (benchmark && !isEmpty(benchmark)) {
      const targetValue =
        benchmark.value?.[currentCase.currency.toLowerCase()] ||
        benchmark.value.lcu;
      // with CPI calculation
      // Case year LI Benchmark = Latest Benchmark*(1-CPI factor)
      if (benchmark?.cpi_factor) {
        const caseYearLIB = targetValue * (1 - benchmark.cpi_factor);
        // incorporate year multiplier
        const LITarget =
          (householdSize / benchmark.household_equiv) * caseYearLIB * 12;
        setIncomeTarget(LITarget);
      } else {
        // incorporate year multiplier
        const LITarget =
          (householdSize / benchmark.household_equiv) * targetValue * 12;
        setIncomeTarget(LITarget);
      }
    }
  }, [benchmark, householdSize, currentCase]);

  // call region api
  useEffect(() => {
    if (currentCase?.country) {
      setLoadingRegionOptions(true);
      api
        .get(`region/options?country_id=${currentCase.country}`)
        .then((res) => {
          setRegionOptionStatus(200);
          setRegionOptions(res.data);
        })
        .catch((e) => {
          const { status } = e.response;
          setRegionOptionStatus(status);
        })
        .finally(() => {
          setLoadingRegionOptions(false);
        });
    }
  }, [currentCase?.country]);

  const handleOnChangeHouseholdAdult = (value) => {
    updateFormValues({ adult: value >= 0 ? value : null });
  };

  const handleOnChangeHouseholdChild = (value) => {
    updateFormValues({ child: value >= 0 ? value : null });
  };

  const onValuesChange = (changedValues, allValues) => {
    const { target, region } = allValues;
    const HHSize = calculateHouseholdSize(allValues);
    setHouseholdSize(HHSize);
    // eslint-disable-next-line no-undefined
    if (changedValues.manual_target !== undefined) {
      // manual target
      setDisableTarget(!changedValues.manual_target);
      if (changedValues.manual_target && target) {
        form.setFieldsValue({ region: null });
        setIncomeTarget(target);
        updateFormValues({ region: null, target: target });
      }
      if (!changedValues.manual_target) {
        form.setFieldsValue({ target: null });
        setIncomeTarget(segmentItem?.target || 0);
        updateFormValues({ region: null, target: 0 });
      }
    }
    // manual target
    if (changedValues.target && !disableTarget) {
      setIncomeTarget(target);
      updateFormValues({ region: null, target: target });
    }
    if (changedValues.region && disableTarget) {
      const regionData = { region: region };
      // get from API
      if (currentCase?.country && currentCase?.year && region) {
        let url = `country_region_benchmark?country_id=${currentCase.country}`;
        url = `${url}&region_id=${region}&year=${currentCase.year}`;
        api.get(url).then((res) => {
          // data represent LI Benchmark value
          const { data } = res;
          const household_adult = data.nr_adults;
          const household_children = data.household_size - data.nr_adults;
          setBenchmark(data);
          const defHHSize = calculateHouseholdSize({
            household_adult,
            household_children,
          });
          setHouseholdSize(defHHSize);
          // set hh adult and children default value
          form.setFieldsValue({
            household_adult: household_adult,
            household_children: household_children,
          });
          //
          const targetHH = data.household_equiv;
          const targetValue =
            data.value?.[currentCase.currency.toLowerCase()] || data.value.lcu;
          // with CPI calculation
          // Case year LI Benchmark = Latest Benchmark*(1-CPI factor)
          if (data?.cpi_factor) {
            const caseYearLIB = targetValue * (1 - data.cpi_factor);
            // incorporate year multiplier
            const LITarget = (defHHSize / targetHH) * caseYearLIB * 12;
            setIncomeTarget(LITarget * 12);
            updateFormValues({
              ...regionData,
              target: LITarget,
              benchmark: data,
              adult: household_adult,
              child: household_children,
            });
          } else {
            // incorporate year multiplier
            const LITarget = (defHHSize / targetHH) * targetValue * 12;
            setIncomeTarget(LITarget);
            updateFormValues({
              ...regionData,
              target: LITarget,
              benchmark: data,
              adult: household_adult,
              child: household_children,
            });
          }
        });
      }
    }
  };

  const preventNegativeValue = (fieldName) => [
    () => ({
      validator(_, value) {
        if (value >= 0) {
          return Promise.resolve();
        }
        const allValues = form.getFieldsValue();
        form.setFieldValue(fieldName, null);
        onValuesChange(
          { [fieldName]: null },
          { ...allValues, [fieldName]: null }
        );
        return Promise.reject(new Error("Negative value not allowed"));
      },
    }),
  ];

  return (
    <Form
      name={`drivers-income-target-${segment}`}
      layout="vertical"
      form={form}
      onValuesChange={onValuesChange}
      style={{ width: "100%" }}
    >
      <Row gutter={[8, 8]}>
        <Col span={12}>
          <Form.Item label="Better income target" name="manual_target">
            <Switch checked={!disableTarget} disabled={!enableEditCase} />
          </Form.Item>
        </Col>
        <Col
          span={12}
          style={{
            display: disableTarget ? "none" : "",
          }}
        >
          <Row align="middle" gutter={[16, 16]}>
            <Col span={21}>
              <Form.Item label="Target" name="target">
                <InputNumber
                  style={formStyle}
                  disabled={disableTarget || !enableEditCase}
                  {...InputNumberThousandFormatter}
                />
              </Form.Item>
            </Col>
            <Col span={3}>
              <b>{currentCase.currency}</b>
            </Col>
          </Row>
        </Col>
      </Row>
      {/* region options notif */}
      {regionOptionStatus === 404 && (
        <Row
          style={{
            borderBottom: "1px solid #e8e8e8",
            marginBottom: "12px",
            color: "red",
          }}
        >
          <Col span={24}>
            A benchmark for the county is not available; please switch to manual
            target.
          </Col>
        </Row>
      )}
      <Row gutter={[8, 8]} style={{ display: !disableTarget ? "none" : "" }}>
        <Col span={8}>
          <Form.Item label="Region" name="region">
            <Select
              style={formStyle}
              options={regionOptions}
              disabled={!disableTarget || !enableEditCase}
              loading={loadingRegionOptions}
              placeholder={
                regionOptionStatus === 404
                  ? "Region not available"
                  : "Select or Type Region"
              }
              {...selectProps}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Avg # of adults in HH"
            name="household_adult"
            rules={preventNegativeValue("household_adult")}
          >
            <InputNumber
              style={formStyle}
              onChange={handleOnChangeHouseholdAdult}
              disabled={!enableEditCase}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Avg # of children in HH"
            name="household_children"
            rules={preventNegativeValue("household_children")}
          >
            <InputNumber
              style={formStyle}
              onChange={handleOnChangeHouseholdChild}
              disabled={!enableEditCase}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row
        gutter={[8, 8]}
        style={{
          borderTop: "1px solid #e8e8e8",
          display: !disableTarget ? "none" : "",
        }}
      >
        <Col span={8}>
          <p>Living Income Target</p>
          <h2 className="income-target-value">
            {thousandFormatter(incomeTarget.toFixed(2))} {currentCase.currency}
          </h2>
        </Col>
        {/* <Col span={16}>
          <p>Current HH Living Income</p>
          <h2>
            {thousandFormatter(totalIncome.current.toFixed(2))}{" "}
            {currentCase.currency}
          </h2>
        </Col> */}
      </Row>
    </Form>
  );
};

export default IncomeDriverTarget;
