import React, { useState, useEffect, useCallback } from "react";
import {
  Row,
  Col,
  Form,
  InputNumber,
  Select,
  Switch,
  message,
  Tooltip,
  Space,
} from "antd";
import { InfoCircleTwoTone } from "@ant-design/icons";
import { InputNumberThousandFormatter, selectProps } from "./";
import { api } from "../../../lib";
import isEmpty from "lodash/isEmpty";
import { thousandFormatter } from "../../../components/chart/options/common";

const formStyle = { width: "100%" };

const IncomeDriverTarget = ({
  segment,
  currentCase,
  formValues,
  setFormValues,
  segmentItem,
  enableEditCase,
  setBenchmark,
  benchmark,
  // totalIncome,
}) => {
  const [form] = Form.useForm();
  const [householdSize, setHouseholdSize] = useState(0);
  const [incomeTarget, setIncomeTarget] = useState(0);
  const [disableTarget, setDisableTarget] = useState(true);
  const [regionOptions, setRegionOptions] = useState([]);
  const [loadingRegionOptions, setLoadingRegionOptions] = useState(false);
  const currentSegmentId = segmentItem?.currentSegmentId || null;
  const [regionOptionStatus, setRegionOptionStatus] = useState(null);

  const [messageApi, contextHolder] = message.useMessage();

  const [notificationShown, setNotificationShown] = useState(false);

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

  const updateFormValues = useCallback(
    (value) => {
      const updatedFv = formValues.map((fv) => {
        if (fv.key === segment) {
          return {
            ...fv,
            ...value,
          };
        }
        return fv;
      });
      setFormValues(updatedFv);
    },
    [formValues, segment, setFormValues]
  );

  // load initial target & hh size
  useEffect(() => {
    if (!isEmpty(segmentItem) && currentSegmentId && !isEmpty(regionOptions)) {
      setIncomeTarget(segmentItem?.target || 0);
      if (!segmentItem?.region) {
        form.setFieldsValue({
          manual_target: true,
          target: segmentItem?.target || null,
        });
        setDisableTarget(false);
      }

      const checkRegion = regionOptions.find(
        (x) => x.value === segmentItem?.region
      );
      const hhAdult = segmentItem?.adult ? Math.round(segmentItem.adult) : 0;
      const hhChild = segmentItem?.child ? Math.round(segmentItem.child) : 0;
      if (checkRegion) {
        form.setFieldsValue({
          region: segmentItem?.region || null,
        });
        form.setFieldsValue({
          household_adult: hhAdult || null,
        });
        form.setFieldsValue({
          household_children: hhChild || null,
        });
        const HHSize = calculateHouseholdSize({
          household_adult: hhAdult,
          household_children: hhChild,
        });
        setHouseholdSize(HHSize);
      } else {
        setIncomeTarget(0);
      }
    }
  }, [segmentItem, currentSegmentId, form, regionOptions]);

  const resetBenchmark = useCallback(
    ({ region }) => {
      form.setFieldsValue({
        region: region,
        target: null,
        household_adult: null,
        household_children: null,
      });
      setHouseholdSize(0);
      setIncomeTarget(0);
      updateFormValues({
        region: region,
        target: 0,
        benchmark: {},
        adult: null,
        child: null,
      });
      setBenchmark("NA");
    },
    [form, setBenchmark, updateFormValues]
  );

  const showBenchmarNotification = useCallback(
    ({ currentCase }) => {
      return messageApi.open({
        type: "error",
        content: `No benchmark available in the specified currency (${currentCase.currency}). Consider switching to the local currency.`,
      });
    },
    [messageApi]
  );

  const fetchBenchmark = useCallback(
    ({ region, onLoadInitialValue = false }) => {
      const regionData = { region: region };
      let url = `country_region_benchmark?country_id=${currentCase.country}`;
      url = `${url}&region_id=${region}&year=${currentCase.year}`;
      api
        .get(url)
        .then((res) => {
          // data represent LI Benchmark value
          const { data } = res;
          // if data value by currency not found or 0
          // return a NA notif
          if (data?.value?.[currentCase.currency.toLowerCase()] === 0) {
            const timeout = onLoadInitialValue ? 500 : 0;
            showBenchmarNotification({ currentCase });
            setTimeout(() => {
              resetBenchmark({ region: onLoadInitialValue ? null : region });
            }, timeout);
            return;
          }
          //
          const household_adult = Math.round(data.nr_adults);
          const household_children = Math.round(
            data.household_size - data.nr_adults
          );
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
          // Use LCU if currency if not USE/EUR
          const targetValue =
            data.value?.[currentCase.currency.toLowerCase()] || data.value.lcu;
          // with CPI calculation
          // Case year LI Benchmark = Latest Benchmark*(1-CPI factor)
          // INFLATION RATE HERE
          if (data?.cpi_factor) {
            const caseYearLIB = targetValue * (1 + data.cpi_factor);
            // incorporate year multiplier
            // const LITarget = (defHHSize / targetHH) * caseYearLIB * 12;
            const LITarget = (defHHSize / targetHH) * caseYearLIB;
            setIncomeTarget(LITarget);
            updateFormValues({
              ...regionData,
              target: LITarget,
              benchmark: data,
              adult: household_adult,
              child: household_children,
            });
          } else {
            // incorporate year multiplier
            // const LITarget = (defHHSize / targetHH) * targetValue * 12;
            const LITarget = (defHHSize / targetHH) * targetValue;
            setIncomeTarget(LITarget);
            updateFormValues({
              ...regionData,
              target: LITarget,
              benchmark: data,
              adult: household_adult,
              child: household_children,
            });
          }
        })
        .catch((e) => {
          // reset field and benchmark value
          resetBenchmark({ region: region });
          // show notification
          const { statusText, data } = e.response;
          const content = data?.detail || statusText;
          messageApi.open({
            type: "error",
            content: content,
          });
        });
    },
    [
      currentCase,
      form,
      messageApi,
      updateFormValues,
      setBenchmark,
      resetBenchmark,
      showBenchmarNotification,
    ]
  );

  useEffect(() => {
    // handle income target value when householdSize updated
    if (benchmark && !isEmpty(benchmark) && benchmark !== "NA") {
      // show benchmark notification
      if (
        benchmark?.value?.[currentCase?.currency?.toLowerCase()] === 0 &&
        !notificationShown
      ) {
        setNotificationShown(true);
        showBenchmarNotification({ currentCase });
        setTimeout(() => {
          resetBenchmark({ region: null });
          setNotificationShown(false);
        }, 500);
        return;
      }
      // Use LCU if currency if not USE/EUR
      const targetValue =
        benchmark.value?.[currentCase.currency.toLowerCase()] ||
        benchmark.value.lcu;
      // with CPI calculation
      // Case year LI Benchmark = Latest Benchmark*(1-CPI factor)
      if (benchmark?.cpi_factor) {
        const caseYearLIB = targetValue * (1 + benchmark.cpi_factor);
        // incorporate year multiplier
        // const LITarget =
        //   (householdSize / benchmark.household_equiv) * caseYearLIB * 12;
        const LITarget =
          (householdSize / benchmark.household_equiv) * caseYearLIB;
        setIncomeTarget(LITarget);
      } else {
        // incorporate year multiplier
        // const LITarget =
        //   (householdSize / benchmark.household_equiv) * targetValue * 12;
        const LITarget =
          (householdSize / benchmark.household_equiv) * targetValue;
        setIncomeTarget(LITarget);
      }
    }

    // refetch benchmark if current case year changed
    if (
      isEmpty(benchmark) &&
      segmentItem?.benchmark?.region &&
      benchmark !== "NA"
    ) {
      fetchBenchmark({
        region: segmentItem?.benchmark?.region,
        onLoadInitialValue: true,
      });
    }
  }, [
    benchmark,
    householdSize,
    currentCase,
    fetchBenchmark,
    segmentItem,
    resetBenchmark,
    notificationShown,
    showBenchmarNotification,
  ]);

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
    const { target, region, manual_target } = allValues;
    const HHSize = calculateHouseholdSize(allValues);
    setHouseholdSize(HHSize);
    // eslint-disable-next-line no-undefined
    if (changedValues.manual_target !== undefined) {
      // manual target
      // comment for now
      // setDisableTarget(!changedValues.manual_target);
      // if (changedValues.manual_target && target) {
      //   form.setFieldsValue({ region: null });
      //   setIncomeTarget(target);
      //   updateFormValues({ region: null, target: target });
      // }
      // if (!changedValues.manual_target) {
      //   form.setFieldsValue({ target: null });
      //   setIncomeTarget(segmentItem?.target || 0);
      //   updateFormValues({ region: null, target: 0 });
      // }

      // new version
      setDisableTarget(!changedValues.manual_target);
      form.setFieldsValue({
        region: null,
        target: null,
        household_adult: null,
        household_children: null,
      });
      setIncomeTarget(0);
      updateFormValues({
        region: null,
        target: 0,
        adult: null,
        child: null,
        benchmark: {},
      });
      setBenchmark("NA");
    }
    // manual target
    // eslint-disable-next-line no-undefined
    if (manual_target && changedValues.target !== undefined && !disableTarget) {
      setIncomeTarget(target);
      updateFormValues({
        region: null,
        target: target,
        adult: null,
        child: null,
        benchmark: {},
      });
    }
    if (changedValues.region && disableTarget) {
      // get from API
      if (currentCase?.country && currentCase?.year && region) {
        fetchBenchmark({ region });
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
    <>
      {contextHolder}
      <Form
        name={`drivers-income-target-${segment}`}
        layout="vertical"
        form={form}
        onValuesChange={onValuesChange}
        style={{ width: "100%" }}
      >
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <Form.Item
              label="Set an income target yourself?"
              name="manual_target"
            >
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
              paddingBottom: "10px",
            }}
          >
            <Col span={24}>
              A benchmark for the country is not available; please switch to
              manual target.
            </Col>
          </Row>
        )}
        {/* Benchmark message if no CPI */}
        {benchmark?.message && (
          <Row
            style={{
              borderBottom: "1px solid #e8e8e8",
              marginBottom: "12px",
              color: "red",
              paddingBottom: "10px",
            }}
          >
            <Col span={24}>{benchmark.message}</Col>
          </Row>
        )}
        {/* EOL Benchmark message if no CPI */}
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
          <Col span={24}>
            <Space align="center" style={{ paddingTop: "18px" }}>
              <div>Living income benchmark value for a household per year</div>
              <Tooltip
                title={`Living Income Benchmarks are automatically adjusted for inflation.${
                  benchmark?.cpi_factor
                    ? ` Inflation rate: ${benchmark.cpi_factor.toFixed(2)}`
                    : ""
                }`}
                placement="topRight"
              >
                <InfoCircleTwoTone twoToneColor="#1677ff" />
              </Tooltip>
            </Space>
            <h2 className="income-target-value">
              {incomeTarget ? thousandFormatter(incomeTarget.toFixed()) : 0}{" "}
              {currentCase.currency}
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
    </>
  );
};

export default IncomeDriverTarget;
