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
import { isEmpty, orderBy, uniqBy } from "lodash";
import { SaveAsImageButton, ShowLabelButton } from "../../../components/utils";
import { thousandFormatter } from "../../../components/chart/options/common";

const generateChartData = (data) => {
  return data.map((d) => {
    const incomeTarget = d.currentSegmentValue.target;
    const currentTotalIncome = d.currentSegmentValue.total_current_income;

    const newTotalIncome = d?.newTotalIncome || 0;
    const additionalValue = newTotalIncome
      ? newTotalIncome - currentTotalIncome
      : 0;

    let gapValue = incomeTarget - newTotalIncome;
    gapValue = gapValue < 0 ? 0 : gapValue;

    return {
      name: `${d.scenarioName}-${d.name}`,
      target: Math.round(incomeTarget),
      stack: [
        {
          name: "Current total\nhousehold income",
          title: "Current total\nhousehold income",
          value: Math.round(currentTotalIncome),
          total: Math.round(currentTotalIncome),
          color: "#1B625F",
          order: 1,
        },
        {
          name: "Additional income\nwhen income drivers\nare changed",
          title: "Additional income\nwhen income drivers\nare changed",
          value: Math.round(additionalValue),
          total: Math.round(additionalValue),
          color: "#49D985",
          order: 2,
        },
        {
          name: "Gap",
          title: "Gap",
          value: Math.round(gapValue),
          total: Math.round(gapValue),
          color: "#F9CB21",
          order: 3,
        },
      ],
    };
  });
};

const generateTargetChartData = (data) => {
  const target = [
    {
      name: "Income Target",
      type: "line",
      symbol: "diamond",
      symbolSize: 15,
      color: "#000",
      lineStyle: {
        width: 0,
      },
      data: data.map((d) => ({
        name: "Benchmark",
        value: d?.target ? Math.round(d.target) : 0,
      })),
    },
  ];
  return target;
};

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
  refreshCurrentIncrease,
}) => {
  const { commodity_name, commodity_type, case_commodity, currency } =
    commodity;

  // custom fieldName for grouped diversified
  const fieldName = `${case_commodity}-${id}`;

  const unitName = useMemo(() => {
    return unit
      .split("/")
      .map((u) => u.trim())
      .map((u) => commodity?.[u])
      .join(" / ");
  }, [unit, commodity]);

  const answer = useMemo(() => {
    // handle grouped diversified value
    if (id === "diversified") {
      const answers = childrens
        .map((c) => {
          return segment.answers.find(
            (s) =>
              s.question.id === c.id &&
              s.caseCommodityId === c.case_commodity &&
              s.name === "current"
          );
        })
        .filter((x) => x);
      return {
        ...answers[0],
        id: id,
        question: childrens.map((c) => ({
          ...c,
          value: answers.find((a) => a.question.id === c.id)?.value || 0,
        })),
        value: answers.reduce((res, cur) => res + cur.value, 0),
      };
    }
    return segment.answers.find(
      (s) =>
        s.question.id === id &&
        s.caseCommodityId === case_commodity &&
        s.name === "current"
    );
  }, [segment, id, case_commodity, childrens]);

  const answerValue = useMemo(() => {
    if (!answer?.value) {
      return "";
    }
    let value = answer.value;
    if (value < 100) {
      value = value?.toFixed(2);
    } else {
      value = value?.toFixed();
    }
    return thousandFormatter(value);
  }, [answer]);

  const currentIncrease = useMemo(() => {
    let value = 0;
    if (percentage) {
      value = form.getFieldValue(`absolute-${case_commodity}-${id}`) || "-";
    } else {
      value = form.getFieldValue(`percentage-${case_commodity}-${id}`) || "-";
    }
    return !isNaN(value) ? value : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, case_commodity, id, percentage, refreshCurrentIncrease]);

  const disableTotalIncomeFocusCommodityField = !enableEditCase
    ? true
    : !parent && question_type === "aggregator" && commodity_type === "focus";

  return (
    <>
      <Row
        gutter={[5, 5]}
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
          ) : question_type === "diversified" ? (
            <h4>
              {commodity_name} <small>({currency})</small>
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
              key={`${qtype}-${fieldName}`}
              name={`${qtype}-${fieldName}`}
              className="scenario-field-item"
              style={{
                display:
                  qtype !== "percentage" && percentage
                    ? "none"
                    : qtype === "percentage" && !percentage
                    ? "none"
                    : "",
              }}
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
          {answerValue}
        </Col>
        <Col span={5} align="right">
          {percentage
            ? thousandFormatter(currentIncrease)
            : `${currentIncrease} %`}
        </Col>
      </Row>
      {/* Render questions */}
      {!parent && commodity_type === "focus"
        ? orderBy(childrens, ["id"]).map((child) => (
            <Question
              key={`scenario-${segment.id}-${case_commodity}-${child.id}`}
              commodity={commodity}
              percentage={percentage}
              segment={segment}
              form={form}
              {...child}
              enableEditCase={enableEditCase}
              refreshCurrentIncrease={refreshCurrentIncrease}
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
  const [refreshCurrentIncrease, setRefreshCurrentIncrease] = useState(0);

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
        totalAbsolute: absoluteValue.toFixed(),
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

    let segmentAnswer = {};
    // handle grouped diversified value
    if (id === "diversified") {
      const childrens = commodityQuestions
        .find((cq) => cq.commodity_type === "diversified")
        ?.questions?.find((q) => !q.parent)?.childrens;
      const answers = childrens
        ?.map((c) => {
          return segment.answers.find(
            (s) =>
              s.question.id === c.id &&
              s.caseCommodityId === c.case_commodity &&
              s.name === "current"
          );
        })
        .filter((x) => x);
      segmentAnswer = {
        ...answers[0],
        id: id,
        question: childrens.map((c) => ({
          ...c,
          value: answers.find((a) => a.question.id === c.id)?.value || 0,
        })),
        value: answers.reduce((res, cur) => res + cur.value, 0),
      };
    } else {
      segmentAnswer = segment.answers.find(
        (s) =>
          s.questionId === parseInt(id) &&
          s.caseCommodityId === parseInt(case_commodity) &&
          s.name === "current"
      );
    }

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
          value: !isNaN(allValues?.[key]) ? allValues[key] : absoluteIncrease,
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

    let totalValues = allParentQuestions.reduce((acc, p) => {
      const questionId = `absolute-${p.caseCommodityId}-${p.question.id}`;
      const value = allNewValues?.[questionId] || 0;
      if (value) {
        acc += parseFloat(value);
      }
      return acc;
    }, 0);

    // handle grouped diversified value
    const filterDiversifiedKeys = Object.keys(allNewValues).filter((key) => {
      return key.includes("absolute") && key.includes("diversified");
    });
    const newDiversified =
      filterDiversifiedKeys.map((key) => allNewValues[key])?.[0] || 0;
    totalValues =
      totalValues + (newDiversified ? parseFloat(newDiversified) : 0);
    //

    const newScenarioValue = {
      segmentId: segment.id,
      name: segment.name,
      value: !isNaN(totalValues) ? totalValues : 0,
      allNewValues: allNewValues,
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
    setRefreshCurrentIncrease((prev) => prev + 1);
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
      <Row gutter={[5, 5]} align="middle" justify="space-between">
        <Col span={9}>
          <h2>Income Target</h2>
        </Col>
        <Col span={15}>
          <h2>{`${segment.target?.toFixed()} ${currencyUnitName}`}</h2>
        </Col>
      </Row>
      <Row gutter={[5, 5]} align="middle" justify="space-between">
        <Col span={9}>
          <h4>Income Driver</h4>
        </Col>
        <Col span={5} align="center">
          <h4>New value</h4>
        </Col>
        <Col span={5} align="right">
          <h4>Current value</h4>
        </Col>
        <Col span={5} align="right">
          <h4>Change</h4>
        </Col>
      </Row>
      <Row gutter={[5, 5]} align="middle" justify="space-between">
        <Col span={9}>
          <h4>
            Total Income <small>{currencyUnitName}</small>
          </h4>
        </Col>
        <Col span={5} align="center">
          <h4>
            {/* {percentage
              ? `${scenarioIncrease.totalPercentage}%`
              : thousandFormatter(scenarioIncrease?.totalAbsolute)} */}
            {thousandFormatter(scenarioIncrease?.totalAbsolute)}
          </h4>
        </Col>
        <Col span={5} align="right">
          <h4>{thousandFormatter(segment.total_current_income?.toFixed())}</h4>
        </Col>
        <Col span={5} align="right">
          <h4>
            {percentage
              ? thousandFormatter(
                  (scenarioIncrease?.totalAbsolute
                    ? scenarioIncrease.totalAbsolute
                    : 0) - segment.total_current_income,
                  2
                )
              : `${scenarioIncrease.totalPercentage}%`}
          </h4>
        </Col>
      </Row>
      {commodityQuestions.map((c) => (
        <div key={c.commodity_id}>
          <Divider />
          {orderBy(c.questions, ["id"]).map((question) => (
            <Question
              key={`scenario-${segment.id}-${c.case_commodity}-${question.id}`}
              form={form}
              segment={segment}
              commodity={c}
              percentage={percentage}
              {...question}
              enableEditCase={enableEditCase}
              refreshCurrentIncrease={refreshCurrentIncrease}
            />
          ))}
        </div>
      ))}
    </Form>
  );
};

const Step = ({ number, title, description = null }) => (
  <Col span={24}>
    <Space align="center" className="scenario-step-wrapper">
      <div className="number">{number}</div>
      <div className="title">{title}</div>
    </Space>
    {description && (
      <div className="scenario-step-description">{description}</div>
    )}
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
  activeScenario,
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
  const [currentScenarioData, setCurrentScenarioData] = useState([]);

  const [
    showLabelChartCurrentScenarioIncomeGap,
    setShowLabelChartCurrentScenarioIncomeGap,
  ] = useState(false);
  const [showLabelChartIncomeGap, setShowLabelChartIncomeGap] = useState(false);

  const elCurrentScenarioIncomeGap = useRef(null);
  const elIncomeGapScenario = useRef(null);
  const elScenarioOutcomes = useRef(null);

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

  useEffect(() => {
    renameScenario(index, newName, newDescription);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, newName, newDescription]);

  const outcomeDriverQuestions = useMemo(() => {
    const commodities = commodityQuestions
      .filter(
        (cq) =>
          cq.commodity_type === "focus" && cq.commodity_type !== "diversified"
      )
      .flatMap((cq) => {
        const questions = cq.questions.find((q) => !q.parent);
        return questions.childrens?.map((x) => ({
          ...x,
          case_commodity: cq.case_commodity,
          commodity_name: cq.commodity_name,
        }));
      });
    let diversified = commodityQuestions.find(
      (cq) => cq.commodity_type === "diversified"
    );
    diversified = diversified?.questions?.map((x) => ({
      ...x,
      case_commodity: diversified.case_commodity,
      commodity_name: diversified.commodity_name,
      childrens: x.childrens,
    }));
    return [...commodities, ...diversified].map((q) => ({
      questionId: q.id,
      text: q.text,
      questionType: q.question_type,
      caseCommodityId: q.case_commodity,
      commodityName: q.commodity_name,
      childrens: q?.childrens || [],
    }));
  }, [commodityQuestions]);

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

    let data = filterScenarioData.flatMap((sd) => {
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
    data = orderBy(data, ["scenarioSegmentKey"]);

    setCurrentScenarioData(
      data.filter((d) => d.scenarioKey === parseInt(activeScenario))
    );

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
    activeScenario,
  ]);

  const chartData = useMemo(
    () => generateChartData(combineScenarioDataWithDashboardData),
    [combineScenarioDataWithDashboardData]
  );

  const targetChartData = useMemo(
    () => generateTargetChartData(chartData),
    [chartData]
  );

  const currentChartData = useMemo(
    () => generateChartData(currentScenarioData),
    [currentScenarioData]
  );

  const currentTargetChartData = useMemo(
    () => generateTargetChartData(currentChartData),
    [currentChartData]
  );

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
      icon={
        <CloseCircleTwoTone twoToneColor="#eb2f96" style={{ fontSize: 18 }} />
      }
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
        icon={<DeleteTwoTone twoToneColor="#fff" style={{ fontSize: 18 }} />}
      />
    </Popover>
  );

  const extra = !hideDelete ? (
    <Space>
      {/* <ButtonEdit />
      {editing && <ButtonCancelEdit />} */}
      {!editing && <ButtonDelete />}
    </Space>
  ) : (
    <Space>
      <ButtonEdit />
      {editing && <ButtonCancelEdit />}
    </Space>
  );

  const renderScenarioCardHeader = () => {
    return (
      <Row gutter={[16, 16]} className="scenario-information-wrapper">
        <Col span={24}>
          <div className="label">Name of scenario</div>
          <Input
            key={`scenario-name-${scenarioItem.key}`}
            placeholder="Scenario Name"
            defaultValue={scenarioItem.name}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={15}
            showCount={true}
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
      let res = { id: ind.key, title: ind.name };
      if (ind.key === "income_driver") {
        res = {
          ...res,
          current: "-",
        };
        const currentDriverValues = outcomeDriverQuestions.map((q) => {
          // handle grouped diversified income
          if (q.questionType === "diversified") {
            const temp = q.childrens.map(
              (c) =>
                current?.answers?.find(
                  (a) =>
                    a.questionId === c.id &&
                    a.name === "current" &&
                    a.caseCommodityId === c.case_commodity
                )?.value || 0
            );
            return {
              ...q,
              value: temp.reduce((res, cur) => res + cur, 0),
            };
          }
          return {
            ...q,
            value:
              current?.answers?.find(
                (a) =>
                  a.questionId === q.questionId &&
                  a.name === "current" &&
                  a.commodityType === "focus"
              )?.value || 0,
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
                let percentChange = 0;
                if (cur.value !== 0) {
                  percentChange = ((check.value - cur.value) / cur.value) * 100;
                  percentChange = `${percentChange?.toFixed(2)}%`;
                } else {
                  percentChange = "~";
                }
                const text =
                  check.questionType !== "diversified"
                    ? cur.text
                    : "Diversified Income";
                return {
                  qid: cur.questionId,
                  text: text,
                  percent: percentChange,
                };
              }
              return false;
            })
            .filter((x) => x);
          if (isEmpty(compareDrivers)) {
            return {
              ...res,
              [scenarioKey]: "-",
            };
          }
          const values = (
            <Space direction="vertical">
              {orderBy(uniqBy(compareDrivers, "qid"), "qid").map((x) => (
                <Space key={x.qid}>
                  <div>{x.text}</div>
                  <div>({x.percent})</div>
                </Space>
              ))}
            </Space>
          );

          res = {
            ...res,
            [scenarioKey]: values,
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
        <Card
          className="info-card-wrapper"
          title="Describe your scenario"
          extra={scenarioItem?.key > 1 ? extra : null}
        >
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
          type="card"
          destroyInactiveTabPane={true}
          className="scenario-segment-tabs-container"
          items={segmentTabs.map((item) => ({
            ...item,
            children: dashboardData
              .filter((d) => d.id === activeTab)
              .map((segment) => (
                <Row
                  key={segment.id}
                  gutter={[24, 24]}
                  align="top"
                  ref={elCurrentScenarioIncomeGap}
                >
                  <Col span={10}>
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
                  <Col span={14}>
                    <h2>
                      What are the results for the different segments in the
                      current scenario?
                    </h2>
                    <p>
                      This graph shows the gap between the household income
                      levels and the income target for the scenario you are
                      working on. It also highlights any variations between
                      segments.
                      <br />
                      <br />
                      Please note that modelling cost of production is only
                      possible for the primary crop. If you would like to
                      capture changes in in CoP for secondary and tertiary crops
                      then that needs to be accounted for in the changes you
                      model under Diversified Income.
                    </p>
                    <Card
                      className="chart-card-wrapper"
                      title="Income gap for the different segments in the current scenario"
                      extra={
                        <Space align="center">
                          <ShowLabelButton
                            showLabel={showLabelChartCurrentScenarioIncomeGap}
                            setShowLabel={
                              setShowLabelChartCurrentScenarioIncomeGap
                            }
                            type="ghost-white"
                          />
                          <SaveAsImageButton
                            elementRef={elCurrentScenarioIncomeGap}
                            filename="What are the results for the different segments in the current scenario?"
                            type="ghost-white"
                          />
                        </Space>
                      }
                    >
                      <ChartScenarioModeling
                        data={currentChartData || []}
                        targetChartData={currentTargetChartData}
                        currencyUnitName={currencyUnitName}
                        showLabel={showLabelChartCurrentScenarioIncomeGap}
                        height={385}
                      />
                    </Card>
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
              What are the results for the different segments across the
              different scenarios?
            </h2>
            <p>
              In the visual on the right you have the flexibility to select and
              compare specific combinations of scenarios and segments that you
              wish to visualise. You have the option as a user to choose which
              specific combination of scenarios and segments that you would like
              to compare.
              <br />
              <br />
              Insight: Understand the new composition of total household income
              and the income gap for the different segments in the scenarios you
              created.
            </p>
          </Col>
          <Col span={16}>
            <Card
              className="chart-card-wrapper"
              title="Income gap across scenario"
              extra={
                <Space align="center">
                  <ShowLabelButton
                    showLabel={showLabelChartIncomeGap}
                    setShowLabel={setShowLabelChartIncomeGap}
                    type="ghost-white"
                  />
                  <SaveAsImageButton
                    elementRef={elIncomeGapScenario}
                    filename="What are the results for the different segments across the different scenarios?"
                    type="ghost-white"
                  />
                </Space>
              }
            >
              <ChartScenarioModeling
                data={chartData || []}
                targetChartData={targetChartData}
                currencyUnitName={currencyUnitName}
                showLabel={showLabelChartIncomeGap}
              />
            </Card>
          </Col>
        </Row>
      </Col>

      {/* Step 3 */}
      <Step
        number={3}
        title="Better understand outcomes for your segments"
        description="In the table below, you can compare specific outcomes per segment to
        understand in which scenario the farmers in that segment reach the
        income target, how this is established, and how it compares to the
        current scenario."
      />
      {/* Scenario Outcomes */}
      <Col span={24} ref={elScenarioOutcomes}>
        <Card
          className="info-card-wrapper"
          title="Scenario Outcomes"
          // extra={
          //   <SaveAsImageButton
          //     elementRef={elScenarioOutcomes}
          //     filename="Scenario Outcomes"
          //     type="ghost-white"
          //   />
          // }
        >
          <Space size="large" direction="vertical">
            <Select
              {...selectProps}
              options={segmentOptions}
              placeholder="Select Segment"
              style={{ width: "25%" }}
              onChange={setSelectedSegment}
            />
            <Table
              rowKey="id"
              columns={scenarioOutcomeColumns}
              dataSource={scenarioOutcomeDataSource}
              pagination={false}
            />
          </Space>
        </Card>
      </Col>
    </Row>
  );
};

export default Scenario;
