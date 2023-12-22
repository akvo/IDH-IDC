import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Card,
  Col,
  Row,
  Input,
  InputNumber,
  Divider,
  Button,
  Space,
  Form,
  Popover,
  Spin,
  Tabs,
  Select,
  Table,
} from "antd";
import {
  EditTwoTone,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  DeleteTwoTone,
} from "@ant-design/icons";
import {
  InputNumberThousandFormatter,
  getFunctionDefaultValue,
  selectProps,
} from "./";
import { ChartScenarioModeling } from "../visualizations";
import { isEmpty, orderBy, uniq } from "lodash";
import { SaveAsImageButton } from "../../../components/utils";
import { thousandFormatter } from "../../../components/chart/options/common";

const Question = ({
  id,
  parent,
  question_type,
  text,
  commodity,
  childrens,
  segment,
  percentage,
  unit,
  form,
  enableEditCase,
}) => {
  const { commodity_name, commodity_type, case_commodity, currency } =
    commodity;

  const unitName = useMemo(() => {
    return unit
      .split("/")
      .map((u) => u.trim())
      .map((u) => commodity?.[u])
      .join(" / ");
  }, [unit, commodity]);

  const answer = useMemo(() => {
    return segment.answers.find(
      (s) =>
        s.question.id === id &&
        s.caseCommodityId === case_commodity &&
        s.name === "current"
    );
  }, [segment, id, case_commodity]);

  const currentIncrease = useMemo(() => {
    let value = 0;
    if (percentage) {
      value = form.getFieldValue(`absolute-${case_commodity}-${id}`) || "-";
    } else {
      value = form.getFieldValue(`percentage-${case_commodity}-${id}`) || "-";
    }
    return !isNaN(value) ? value : 0;
  }, [form, case_commodity, id, percentage]);

  const disableTotalIncomeFocusCommodityField = !enableEditCase
    ? true
    : !parent && question_type === "aggregator" && commodity_type === "focus";

  return (
    <>
      <Row
        gutter={[8, 8]}
        align="middle"
        justify="space-between"
        display={
          question_type === "aggregator" && commodity_type === "focus"
            ? "none"
            : ""
        }
      >
        <Col span={9}>
          {!parent && question_type === "aggregator" ? (
            <h4>
              Total Income from {commodity_name} <small>({currency})</small>
            </h4>
          ) : (
            <h4>
              {text} <small>({unitName})</small>
            </h4>
          )}
        </Col>
        <Col span={5}>
          {["absolute", "percentage"].map((qtype) => (
            <Form.Item
              key={`${qtype}-${case_commodity}-${id}`}
              name={`${qtype}-${case_commodity}-${id}`}
              className="scenario-field-item"
              style={{
                display:
                  qtype !== "percentage" && percentage
                    ? "none"
                    : qtype === "percentage" && !percentage
                    ? "none"
                    : "",
              }}
              // disabled={disableTotalIncomeFocusCommodityField}
            >
              <InputNumber
                style={{
                  width: "100%",
                }}
                addonAfter={qtype === "percentage" ? "%" : ""}
                disabled={disableTotalIncomeFocusCommodityField}
                {...InputNumberThousandFormatter}
              />
            </Form.Item>
          ))}
        </Col>
        <Col span={5} align="right">
          {thousandFormatter(answer?.value?.toFixed(2)) || ""}
        </Col>
        <Col span={5} align="right">
          {percentage
            ? thousandFormatter(currentIncrease)
            : `${currentIncrease} %`}
        </Col>
      </Row>
      {!parent && commodity_type === "focus"
        ? childrens.map((child) => (
            <Question
              key={`scenario-${segment.id}-${case_commodity}-${child.id}`}
              commodity={commodity}
              percentage={percentage}
              segment={segment}
              form={form}
              {...child}
              enableEditCase={enableEditCase}
            />
          ))
        : null}
    </>
  );
};

const ScenarioInput = ({
  segment,
  commodityQuestions,
  percentage,
  setScenarioValues,
  scenarioValue,
  scenarioItem,
  setScenarioData,
  currencyUnitName,
  enableEditCase,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 300);
  }, []);

  const scenarioIncrease = useMemo(() => {
    if (scenarioValue?.value) {
      const { value: absoluteValue } = scenarioValue;
      const { total_current_income: totalIncome } = segment;
      return {
        totalPercentage: ((absoluteValue / totalIncome) * 100).toFixed(2),
        totalAbsolute: absoluteValue.toFixed(2),
      };
    }
    return {
      totalPercentage: 0,
      totalAbsolute: 0,
    };
  }, [scenarioValue, segment]);

  const onValuesChange = (changedValues, allValues) => {
    const objectId = Object.keys(changedValues)[0];
    const [, case_commodity, id] = objectId.split("-");
    const segmentAnswer = segment.answers.find(
      (s) =>
        s.questionId === parseInt(id) &&
        s.caseCommodityId === parseInt(case_commodity) &&
        s.name === "current"
    );

    const parentQuestion = segment.answers.find(
      (s) =>
        s.questionId === segmentAnswer?.question?.parent &&
        s.caseCommodityId === parseInt(case_commodity) &&
        s.name === "current"
    );

    const currentValue = segmentAnswer?.value || 0;
    const value = parseFloat(changedValues[objectId]);
    const newFieldsValue = {};

    let absoluteIncrease = 0;
    if (percentage) {
      const absoluteValue = (currentValue * value) / 100;
      absoluteIncrease = (absoluteValue + currentValue).toFixed(2);
      newFieldsValue[`absolute-${case_commodity}-${id}`] = absoluteIncrease;
    } else {
      absoluteIncrease = value;
      const percentageValue = (value - currentValue) / currentValue;
      const percentageIncrease = (percentageValue * 100).toFixed(2);
      newFieldsValue[`percentage-${case_commodity}-${id}`] = percentageIncrease;
    }

    if (parentQuestion) {
      const allObjectValues = Object.keys(allValues).reduce((acc, key) => {
        const [type, , id] = key.split("-");
        acc.push({
          id: `${type}-${id}`,
          value: allValues[key] || absoluteIncrease,
        });
        return acc;
      }, []);
      const newParentAnswerAbsoluteValue = getFunctionDefaultValue(
        parentQuestion.question,
        "absolute",
        allObjectValues
      );
      newFieldsValue[
        `absolute-${case_commodity}-${parentQuestion.question.id}`
      ] = newParentAnswerAbsoluteValue.toFixed(2);
      const newParentAnswerPercentageValue = parentQuestion?.value
        ? ((newParentAnswerAbsoluteValue - parentQuestion.value) /
            parentQuestion.value) *
          100
        : 0;
      newFieldsValue[
        `percentage-${case_commodity}-${parentQuestion.question.id}`
      ] = newParentAnswerPercentageValue.toFixed(2);
    }

    const allParentQuestions = segment.answers.filter(
      (s) => s.question.parent === null && s.name === "current"
    );
    const allNewValues = { ...allValues, ...newFieldsValue };

    const totalValues = allParentQuestions.reduce((acc, p) => {
      const questionId = `absolute-${p.caseCommodityId}-${p.question.id}`;
      const value = allNewValues[questionId];
      if (value) {
        acc += parseFloat(value);
      }
      return acc;
    }, 0);

    const newScenarioValue = {
      segmentId: segment.id,
      name: segment.name,
      value: !isNaN(totalValues) ? totalValues : 0,
    };
    setScenarioValues((prev) => {
      return [
        ...prev.filter((p) => p.segmentId !== segment.id),
        newScenarioValue,
      ];
    });
    // add scenarioValues into scenarioData
    setScenarioData((prev) => {
      const updated = prev.find((p) => p.key === scenarioItem.key);
      return [
        ...prev.filter((p) => p.key !== scenarioItem.key),
        {
          ...updated,
          scenarioValues: [
            ...updated.scenarioValues.filter((p) => p.segmentId !== segment.id),
            {
              ...newScenarioValue,
              allNewValues: allNewValues,
            },
          ],
        },
      ];
    });
    form.setFieldsValue(allNewValues);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin />
      </div>
    );
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={onValuesChange}
      initialValues={scenarioValue?.allNewValues || {}}
    >
      <Row gutter={[8, 8]} align="middle" justify="space-between">
        <Col span={9}>
          <h2>Income Target</h2>
        </Col>
        <Col span={15}>
          <h2>{`${segment.target} ${currencyUnitName}`}</h2>
        </Col>
      </Row>
      <Row gutter={[8, 8]} align="middle" justify="space-between">
        <Col span={9}>
          <h4>Income Driver</h4>
        </Col>
        <Col span={5} align="center">
          <h4>New Value</h4>
        </Col>
        <Col span={5} align="right">
          <h4>Current</h4>
        </Col>
        <Col span={5} align="right">
          <h4>Increase</h4>
        </Col>
      </Row>
      <Row gutter={[8, 8]} align="middle" justify="space-between">
        <Col span={9}>
          <h4>
            Total Income <small>{currencyUnitName}</small>
          </h4>
        </Col>
        <Col span={5} align="center">
          <h4>
            {percentage
              ? `${scenarioIncrease.totalPercentage}%`
              : thousandFormatter(scenarioIncrease?.totalAbsolute)}
          </h4>
        </Col>
        <Col span={5} align="right">
          <h4>{thousandFormatter(segment.total_current_income?.toFixed(2))}</h4>
        </Col>
        <Col span={5} align="right">
          <h4>
            {percentage
              ? thousandFormatter(scenarioIncrease?.totalAbsolute)
              : `${scenarioIncrease.totalPercentage}%`}
          </h4>
        </Col>
      </Row>
      {commodityQuestions.map((c) => (
        <div key={c.commodity_id}>
          <Divider />
          {c.questions.map((question) => (
            <Question
              key={`scenario-${segment.id}-${c.case_commodity}-${question.id}`}
              form={form}
              segment={segment}
              commodity={c}
              percentage={percentage}
              {...question}
              enableEditCase={enableEditCase}
            />
          ))}
        </div>
      ))}
    </Form>
  );
};

const Step = ({ number, title }) => (
  <Col span={24}>
    <Space align="center" className="scenario-step-wrapper">
      <div className="number">{number}</div>
      <div className="title">{title}</div>
    </Space>
  </Col>
);

const outcomeIndicator = [
  {
    key: "income_driver",
    name: "What income drivers have changed?",
  },
  {
    key: "income_gap",
    name: "How big is the income gap?",
  },
  {
    key: "income_target_reached",
    name: "Is the income target reached?",
  },
  {
    key: "income_increase",
    name: "What is the income increase?",
  },
  {
    key: "income_increase_percentage",
    name: "What is the % income increase?",
  },
];

const incomeTargetIcon = {
  reached: (
    <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 18 }} />
  ),
  not_reached: (
    <CloseCircleTwoTone twoToneColor="#eb2f96" style={{ fontSize: 18 }} />
  ),
};

const Scenario = ({
  index,
  scenarioItem,
  renameScenario,
  onDelete,
  hideDelete,
  dashboardData,
  commodityQuestions,
  segmentTabs,
  percentage,
  scenarioData,
  setScenarioData,
  currentScenarioValues = {},
  enableEditCase,
}) => {
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(dashboardData[0].id);
  const [newName, setNewName] = useState(scenarioItem.name);
  const [newDescription, setNewDescription] = useState(
    scenarioItem.description
  );
  const [confirmationModal, setConfimationModal] = useState(false);
  const [scenarioValues, setScenarioValues] = useState([]);
  const [selectedScenarioSegmentChart, setSelectedScenarioSegmentChart] =
    useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const elIncomeGapScenario = useRef(null);

  const scenarioSegmentOptions = useMemo(() => {
    let i = 1;
    const res = orderBy(scenarioData, "key").flatMap((sc) => {
      const concat = segmentTabs.map((st) => {
        const opt = {
          order: i,
          label: `${sc.name} - ${st.label}`,
          value: `${sc.key}-${st.key}`,
        };
        i += 1;
        return opt;
      });
      return concat;
    });
    return res;
  }, [scenarioData, segmentTabs]);

  const segmentOptions = useMemo(() => {
    return segmentTabs.map((st) => ({
      label: st.label,
      value: st.key,
    }));
  }, [segmentTabs]);

  const finishEditing = () => {
    renameScenario(index, newName, newDescription);
    setEditing(false);
  };

  const cancelEditing = () => {
    setNewName(scenarioItem.name);
    setNewDescription(scenarioItem.description);
    setEditing(false);
  };

  const currencyUnitName = useMemo(() => {
    const currency = commodityQuestions[0]?.currency;
    return currency ? `(${currency})` : "";
  }, [commodityQuestions]);

  useEffect(() => {
    if (dashboardData.length > 0) {
      let scenarioInitialData = [];
      if (isEmpty(currentScenarioValues)) {
        scenarioInitialData = dashboardData.map((segment) => ({
          segmentId: segment.id,
          name: segment.name,
        }));
      }
      // load scenario values
      if (!isEmpty(currentScenarioValues)) {
        scenarioInitialData = currentScenarioValues;
      }
      setScenarioValues(scenarioInitialData);
      // add scenarioValues into scenarioData
      setScenarioData((prev) => {
        const updated = prev.find((p) => p.key === scenarioItem.key);
        return [
          ...prev.filter((p) => p.key !== scenarioItem.key),
          {
            ...updated,
            scenarioValues: scenarioInitialData,
          },
        ];
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardData]);

  const focusCommodity = useMemo(() => {
    return commodityQuestions.find((cq) => cq.commodity_type === "focus");
  }, [commodityQuestions]);

  const outcomeDriverQuestions = useMemo(() => {
    const focus = focusCommodity?.questions[0]?.childrens?.map((x) => ({
      ...x,
      case_commodity: focusCommodity.case_commodity,
    }));
    let diversified = commodityQuestions.find(
      (cq) => cq.commodity_type === "diversified"
    );
    diversified = diversified?.questions?.map((x) => ({
      ...x,
      case_commodity: diversified.case_commodity,
    }));
    return [...focus, ...diversified].map((q) => ({
      questionId: q.id,
      text: q.text,
      questionType: q.question_type,
      caseCommodityId: q.case_commodity,
    }));
  }, [commodityQuestions, focusCommodity]);

  const combineScenarioDataWithDashboardData = useMemo(() => {
    const scenarioKeys = [];
    const segmentIds = [];
    selectedScenarioSegmentChart.forEach((item) => {
      const [scenario, segment] = item.split("-").map((x) => parseInt(x));
      scenarioKeys.push(scenario);
      segmentIds.push(segment);
    });

    const filterScenarioData = isEmpty(selectedScenarioSegmentChart)
      ? scenarioData.filter((sd) => sd.key === scenarioItem.key)
      : scenarioData.filter((sd) => scenarioKeys.includes(sd.key));

    const data = filterScenarioData.flatMap((sd) => {
      const segments = scenarioValues.map((sv) => {
        return {
          ...sv,
          scenarioSegmentKey: `${sd.key}-${sv.segmentId}`,
          allNewValues: sv?.allNewValues || {},
          newTotalIncome: sv?.value || 0,
          scenarioKey: sd.key,
          scenarioName: sd.name,
          currentSegmentValue: dashboardData.find(
            (dd) => dd.id === sv.segmentId
          ),
        };
      });
      return segments;
    });

    if (!isEmpty(selectedScenarioSegmentChart)) {
      return data.filter((d) =>
        selectedScenarioSegmentChart.includes(d.scenarioSegmentKey)
      );
    }
    return data;
  }, [
    dashboardData,
    scenarioData,
    scenarioItem,
    scenarioValues,
    selectedScenarioSegmentChart,
  ]);

  const chartData = useMemo(() => {
    // const totalFocusIncomeQuestion = focusCommodity.questions[0];
    const data = combineScenarioDataWithDashboardData.map((d) => {
      const incomeTarget = d.currentSegmentValue.target;
      const currentTotalIncome = d.currentSegmentValue.total_current_income;
      // const currentFocusIncome =
      //   d.currentSegmentValue.total_current_focus_income;
      const feasibleFocusIncome =
        d.currentSegmentValue.total_feasible_focus_income;

      const newTotalIncome = d?.newTotalIncome || feasibleFocusIncome;
      // let newFocusCommodityIncome =
      //   d.allNewValues?.[
      //     `absolute-${focusCommodity.case_commodity}-${totalFocusIncomeQuestion.id}`
      //   ] || feasibleFocusIncome;
      // newFocusCommodityIncome = parseFloat(newFocusCommodityIncome);
      const additionalValue = newTotalIncome - currentTotalIncome;

      let gapValue = incomeTarget - newTotalIncome;
      gapValue = gapValue < 0 ? 0 : gapValue;

      return {
        name: `${d.scenarioName} - ${d.name}`,
        target: incomeTarget,
        stack: [
          {
            name: "Current total household income",
            title: "Current total household income",
            value: currentTotalIncome,
            total: currentTotalIncome,
            color: "#1B625F",
            order: 1,
          },
          {
            name: "Additional income when income drivers are changed",
            title: "Additional income when income drivers are changed",
            value: additionalValue,
            total: additionalValue,
            color: "#49D985",
            order: 2,
          },
          {
            name: "Gap",
            title: "Gap",
            value: gapValue,
            total: gapValue,
            color: "#E06666",
            order: 3,
          },
        ],
      };
    });
    return data;
    // const data = dashboardData.map((segment) => {
    //   const scenarioIncome =
    //     scenarioValues.find((s) => s.segmentId === segment.id)?.value || 0;
    //   const increaseIncome = scenarioIncome
    //     ? scenarioIncome - segment.total_current_income
    //     : scenarioIncome;
    //   const gapValue = scenarioIncome
    //     ? scenarioIncome >= segment.target
    //       ? 0
    //       : segment.target - scenarioIncome
    //     : segment.target - segment.total_current_income;
    //   return {
    //     name: segment.name,
    //     title: segment.name,
    //     stack: [
    //       {
    //         name: "Current Income",
    //         title: "Current Income",
    //         order: 1,
    //         total: segment.total_current_income,
    //         value: segment.total_current_income,
    //         color: "#00625F",
    //       },
    //       {
    //         name: "Income Increase",
    //         title: "Income Increase",
    //         order: 2,
    //         total: increaseIncome,
    //         value: increaseIncome,
    //         color: "#47D985",
    //       },
    //       {
    //         name: "Gap",
    //         title: "Gap",
    //         order: 3,
    //         total: gapValue > 0 ? gapValue : 0,
    //         value: gapValue > 0 ? gapValue : 0,
    //         color: "#F1C5B2",
    //       },
    //     ],
    //   };
    // });
    // return data;
  }, [combineScenarioDataWithDashboardData]);

  const targetChartData = useMemo(() => {
    return [
      {
        name: "Income Target",
        type: "line",
        symbol: "diamond",
        symbolSize: 15,
        color: "#000",
        lineStyle: {
          width: 0,
        },
        data: chartData.map((d) => ({
          name: "Benchmark",
          value: d?.target ? d.target.toFixed(2) : 0,
        })),
      },
    ];
  }, [chartData]);

  const ButtonEdit = () => (
    <Button
      size="small"
      shape="circle"
      type="secondary"
      icon={
        editing ? (
          <CheckCircleTwoTone twoToneColor="#52c41a" />
        ) : (
          <EditTwoTone twoToneColor="" />
        )
      }
      onClick={editing ? finishEditing : () => setEditing(true)}
    />
  );

  const ButtonCancelEdit = () => (
    <Button
      size="small"
      shape="circle"
      type="secondary"
      icon={<CloseCircleTwoTone twoToneColor="#eb2f96" />}
      onClick={cancelEditing}
    />
  );

  const ButtonDelete = () => (
    <Popover
      content={
        <Space align="end">
          <Button type="primary" onClick={() => setConfimationModal(false)}>
            Close
          </Button>
          <Button onClick={onDelete} danger>
            Delete
          </Button>
        </Space>
      }
      title="Are you sure want to delete this scenario?"
      trigger="click"
      open={confirmationModal}
      onOpenChange={(e) => setConfimationModal(e)}
    >
      <Button
        size="small"
        shape="circle"
        type="secondary"
        icon={<DeleteTwoTone twoToneColor="#eb2f96" />}
      />
    </Popover>
  );

  const extra = !hideDelete ? (
    <Space>
      <ButtonEdit />
      {editing && <ButtonCancelEdit />}
      {!editing && <ButtonDelete />}
    </Space>
  ) : (
    <Space>
      <ButtonEdit />
      {editing && <ButtonCancelEdit />}
    </Space>
  );
  console.info(extra);

  const renderScenarioCardHeader = () => {
    return (
      <Row gutter={[16, 16]} className="scenario-information-wrapper">
        <Col span={24}>
          <div className="label">Name</div>
          <Input
            key={`scenario-name-${scenarioItem.key}`}
            placeholder="Scenario Name"
            defaultValue={scenarioItem.name}
            onChange={(e) => setNewName(e.target.value)}
          />
        </Col>
        <Col span={24}>
          <div className="label">Description</div>
          <Input.TextArea
            key={`scenario-description-${scenarioItem.key}`}
            rows={4}
            placeholder="Scenario Description"
            defaultValue={scenarioItem.description}
            onChange={(e) => setNewDescription(e.target.value)}
          />
        </Col>
      </Row>
    );
  };

  const scenarioOutcomeColumns = useMemo(() => {
    const scenarioCol = scenarioData.map((x) => ({
      title: x.name,
      dataIndex: `scenario-${x.key}`,
      key: `scenario-${x.key}`,
    }));
    return [
      {
        title: null,
        dataIndex: "title",
        key: "title",
        width: "25%",
      },
      {
        title: "Current Value",
        dataIndex: "current",
        key: "current",
      },
      ...scenarioCol,
    ];
  }, [scenarioData]);

  const scenarioOutcomeDataSource = useMemo(() => {
    if (!selectedSegment || isEmpty(outcomeDriverQuestions)) {
      return [];
    }
    // current data
    const current = dashboardData.find((dd) => dd.id === selectedSegment);
    const data = outcomeIndicator.map((ind) => {
      let res = { title: ind.name };
      if (ind.key === "income_driver") {
        res = {
          ...res,
          current: "-",
        };
        const currentDriverValues = outcomeDriverQuestions.map((q) => {
          return {
            ...q,
            value:
              current?.answers?.find((a) => a.questionId === q.questionId)
                ?.value || 0,
          };
        });
        // scenario data
        scenarioData.forEach((sd) => {
          const scenarioKey = `scenario-${sd.key}`;
          const segment =
            sd.scenarioValues.find((sv) => sv.segmentId === selectedSegment) ||
            {};
          const scenarioDriverValues = outcomeDriverQuestions.map((q) => {
            const answerKey = `absolute-${q.caseCommodityId}-${q.questionId}`;
            return {
              ...q,
              value: segment?.allNewValues?.[answerKey] || null,
            };
          });
          // commpare current driver with scenario driver values
          const compareDrivers = currentDriverValues
            .map((cur) => {
              const check = scenarioDriverValues.find(
                (nw) => nw.questionId === cur.questionId
              );
              if (check.value !== null && check.value !== cur.value) {
                return check.questionType !== "diversified"
                  ? cur.text
                  : "Diversified Income";
              }
              return false;
            })
            .filter((x) => x);
          res = {
            ...res,
            [scenarioKey]: isEmpty(compareDrivers)
              ? "-"
              : uniq(compareDrivers).join(", "),
          };
        });
      }

      if (ind.key === "income_target_reached") {
        res = {
          ...res,
          current:
            current.target <= current.total_current_income
              ? incomeTargetIcon.reached
              : incomeTargetIcon.not_reached,
        };
        // scenario data
        scenarioData.forEach((sd) => {
          const scenarioKey = `scenario-${sd.key}`;
          const segment =
            sd.scenarioValues.find((sv) => sv.segmentId === selectedSegment) ||
            {};
          const newTotalIncome = !segment?.value
            ? current.total_current_income
            : segment?.value;
          res = {
            ...res,
            [scenarioKey]:
              current.target <= newTotalIncome
                ? incomeTargetIcon.reached
                : incomeTargetIcon.not_reached,
          };
        });
      }

      if (ind.key === "income_gap") {
        const currentGap = current.target - current.total_current_income;
        res = {
          ...res,
          current: currentGap <= 0 ? "-" : currentGap?.toFixed(2),
        };
        // scenario data
        scenarioData.forEach((sd) => {
          const scenarioKey = `scenario-${sd.key}`;
          const segment =
            sd.scenarioValues.find((sv) => sv.segmentId === selectedSegment) ||
            {};
          const segmentValue = segment?.value ? segment.value : current.target;
          const segmentGap = current.target - segmentValue;
          res = {
            ...res,
            [scenarioKey]:
              segmentGap <= 0 ? "-" : thousandFormatter(segmentGap?.toFixed(2)),
          };
        });
      }

      if (ind.key === "income_increase") {
        res = {
          ...res,
          current: "-",
        };
        // scenario data
        scenarioData.forEach((sd) => {
          const scenarioKey = `scenario-${sd.key}`;
          const segment =
            sd.scenarioValues.find((sv) => sv.segmentId === selectedSegment) ||
            {};
          const segmentValue = segment?.value
            ? segment.value
            : current.total_current_income;
          const incomeIncrease = segmentValue - current.total_current_income;
          res = {
            ...res,
            [scenarioKey]:
              parseInt(incomeIncrease) === 0
                ? "-"
                : thousandFormatter(incomeIncrease?.toFixed(2)),
          };
        });
      }

      if (ind.key === "income_increase_percentage") {
        res = {
          ...res,
          current: "-",
        };
        // scenario data
        scenarioData.forEach((sd) => {
          const scenarioKey = `scenario-${sd.key}`;
          const segment =
            sd.scenarioValues.find((sv) => sv.segmentId === selectedSegment) ||
            {};
          const segmentValue = segment?.value
            ? segment.value
            : current.total_current_income;
          const incomeIncrease = segmentValue - current.total_current_income;
          let incomeIncreasePercent = "-";
          if (parseInt(incomeIncrease) !== 0) {
            incomeIncreasePercent = (
              (incomeIncrease / current.total_current_income) *
              100
            )?.toFixed(2);
            incomeIncreasePercent = `${incomeIncreasePercent}%`;
          }
          res = {
            ...res,
            [scenarioKey]: incomeIncreasePercent,
          };
        });
      }
      return res;
    });
    return data;
  }, [dashboardData, scenarioData, selectedSegment, outcomeDriverQuestions]);

  return (
    <Row gutter={[16, 16]}>
      {/* Information Input */}
      <Col span={24}>
        <Card className="info-card-wrapper" title="Information">
          {renderScenarioCardHeader()}
        </Card>
      </Col>

      {/* Step 1 */}
      <Step number={1} title="Fill in values for your scenarios" />

      {/* Income Driver Scenario Values */}
      <Col span={24}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={segmentTabs.map((item) => ({
            ...item,
            children: dashboardData
              .filter((d) => d.id === activeTab)
              .map((segment) => (
                <Row key={segment.id} gutter={[24, 24]}>
                  <Col span={16}>
                    <Card
                      className="info-card-wrapper"
                      title="Income Driver Values"
                    >
                      <ScenarioInput
                        segment={segment}
                        commodityQuestions={commodityQuestions}
                        percentage={percentage}
                        setScenarioValues={setScenarioValues}
                        scenarioValue={scenarioValues.find(
                          (s) => s.segmentId === segment.id
                        )}
                        scenarioItem={scenarioItem}
                        setScenarioData={setScenarioData}
                        currencyUnitName={currencyUnitName}
                        enableEditCase={enableEditCase}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <h2>
                      What is the income gap when you change your income drivers
                      using the scenario modeler?
                    </h2>
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                      sed do eiusmod tempor incididunt ut labore et dolore magna
                      aliqua.
                    </p>
                  </Col>
                </Row>
              )),
          }))}
        />
      </Col>

      {/* Step 2 */}
      <Step number={2} title="Visualise your scenarios" />

      {/* Chart and Select scenario - segment */}
      <Col span={24}>
        <Row gutter={[24, 24]} ref={elIncomeGapScenario}>
          <Col span={8}>
            <Select
              {...selectProps}
              options={scenarioSegmentOptions}
              placeholder="Select Scenario - Segment"
              mode="multiple"
              onChange={setSelectedScenarioSegmentChart}
            />
            <h2>
              What is the income gap when you change your income drivers using
              the scenario modeler?
            </h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.{" "}
            </p>
          </Col>
          <Col span={16}>
            <Card
              className="chart-card-wrapper"
              title="Income Gap"
              extra={
                <SaveAsImageButton
                  elementRef={elIncomeGapScenario}
                  filename="What is the income gap when you change your income drivers using
              the scenario modeler?"
                  type="ghost-white"
                />
              }
            >
              <ChartScenarioModeling
                data={chartData || []}
                targetChartData={targetChartData}
                currencyUnitName={currencyUnitName}
              />
            </Card>
          </Col>
        </Row>
      </Col>

      {/* Step 3 */}
      <Step number={3} title="Better understand outcomes for your segments" />

      {/* Scenario Outcomes */}
      <Col span={24}>
        <Card className="info-card-wrapper" title="Scenario Outcomes">
          <Space size="large" direction="vertical">
            <Select
              {...selectProps}
              options={segmentOptions}
              placeholder="Select Segment"
              style={{ width: "25%" }}
              onChange={setSelectedSegment}
            />
            <Table
              columns={scenarioOutcomeColumns}
              dataSource={scenarioOutcomeDataSource}
              pagination={false}
            />
          </Space>
        </Card>
      </Col>

      {/* <Card
        className="income-driver-dashboard"
        tabList={segmentTabs}
        activeTabKey={activeTab}
        onTabChange={(key) => setActiveTab(key)}
      >
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
            {dashboardData.map((segment) => (
              <Col
                key={segment.id}
                span={12}
                style={{
                  display: activeTab === segment.id ? "" : "none",
                  borderRight: "1px solid #f0f0f0",
                }}
              >
                <ScenarioInput
                  segment={segment}
                  commodityQuestions={commodityQuestions}
                  percentage={percentage}
                  setScenarioValues={setScenarioValues}
                  scenarioValue={scenarioValues.find(
                    (s) => s.segmentId === segment.id
                  )}
                  scenarioItem={scenarioItem}
                  setScenarioData={setScenarioData}
                  currencyUnitName={currencyUnitName}
                  enableEditCase={enableEditCase}
                />
              </Col>
            ))}
            <Col span={12}>
              <ChartScenarioModeling
                data={chartData || []}
                targetChartData={targetChartData}
                currencyUnitName={currencyUnitName}
              />
            </Col>
          </Row>
        </Card.Grid>
      </Card> */}
    </Row>
  );
};

export default Scenario;
