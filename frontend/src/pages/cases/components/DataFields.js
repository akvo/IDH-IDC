import React, { useState, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Space,
  Popover,
  Input,
  InputNumber,
} from "antd";
import {
  DeleteTwoTone,
  InfoCircleFilled,
  CheckCircleTwoTone,
  EditTwoTone,
  CloseCircleTwoTone,
  CaretDownFilled,
  CaretUpFilled,
} from "@ant-design/icons";
import { map, groupBy } from "lodash";
import { IncomeDriverForm, IncomeDriverTarget, commodityOptions } from "./";
import Chart from "../../../components/chart";
import { incomeTargetChartOption } from "../../../components/chart/options/common";

const DataFields = ({
  segment,
  segmentLabel,
  onDelete,
  questionGroups,
  totalIncomeQuestion,
  commodityList,
  renameItem,
  segmentFormValues,
  setSegmentFormValues,
  segmentItem,
  handleSave,
  isSaving,
  currentCaseId,
  currentCase,
  dashboardData,
}) => {
  const [confimationModal, setConfimationModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(segmentLabel);

  const finishEditing = () => {
    renameItem(segment, newName);
    setEditing(false);
  };
  const cancelEditing = () => {
    setNewName(segmentLabel);
    setEditing(false);
  };

  const totalIncome = useMemo(() => {
    const currentFormValue = segmentFormValues.find(
      (x) => x.key === segmentItem.key
    );
    const current = totalIncomeQuestion
      .map((qs) => currentFormValue?.answers[`current-${qs}`])
      .filter((a) => a)
      .reduce((acc, a) => acc + a, 0);
    const feasible = totalIncomeQuestion
      .map((qs) => currentFormValue?.answers[`feasible-${qs}`])
      .filter((a) => a)
      .reduce((acc, a) => acc + a, 0);
    const percent = ((feasible - current) / current) * 100;
    const other = dashboardData.find((x) => x.key === segmentItem.key);
    return {
      current: current,
      feasible: feasible,
      percent: percent,
      diversified: {
        current: other?.total_current_diversified_income || 0,
        feasible: other?.total_feasible_diversified_income || 0,
        percent: other?.total_feasible_diversified_income
          ? ((other?.total_feasible_diversified_income -
              other?.total_current_diversified_income) /
              other?.total_current_diversified_income) *
            100
          : 0,
      },
    };
  }, [segmentFormValues, segmentItem, dashboardData, totalIncomeQuestion]);

  const segmentValues = segmentFormValues.find((v) => v.key === segment);

  const chartData = useMemo(() => {
    if (!segmentFormValues.length || !segmentValues) {
      return [];
    }
    const chartQuestion = totalIncomeQuestion.map((qid) => {
      const [caseCommodity, questionId] = qid.split("-");
      const feasibleId = `feasible-${qid}`;
      const currentId = `current-${qid}`;
      const feasibleValue = segmentValues.answers?.[feasibleId] || 0;
      const currentValue = segmentValues.answers?.[currentId];
      const question = questionGroups
        .flatMap((g) => g.questions)
        .find((q) => q.id === parseInt(questionId));
      const commodityId = commodityList.find(
        (c) => c.case_commodity === parseInt(caseCommodity)
      ).commodity;
      return {
        case_id: caseCommodity,
        commodity_id: commodityId,
        question: question,
        feasibleValue: feasibleValue - (currentValue || 0),
        currentValue: currentValue || 0,
      };
    });
    const commodityGroup = map(groupBy(chartQuestion, "case_id"), (g) => {
      const commodityName =
        commodityOptions.find((c) => c.value === g[0].commodity_id)?.label ||
        "diversified";
      const additionalIncome = g.reduce((a, b) => a + b.feasibleValue, 0);
      return {
        name: commodityName,
        title: commodityName,
        stack: [
          {
            name: "Current",
            title: "Current",
            value: g.reduce((a, b) => a + b.currentValue, 0),
            total: g.reduce((a, b) => a + b.currentValue, 0),
            order: 2,
            color: "#3b78d8",
          },
          {
            name: "Feasible",
            title: "Additional income if feasible values are reached",
            value: additionalIncome < 0 ? 0 : additionalIncome,
            total: additionalIncome < 0 ? 0 : additionalIncome,
            order: 1,
            color: "#c9daf8",
          },
        ],
      };
    });
    const totalIncomeCommodityGroup = {
      name: "Total\nIncome",
      title: "Total\nIncome",
      stack: [
        {
          name: "Current",
          title: "Current",
          value: totalIncome.current,
          total: totalIncome.current,
          order: 2,
          color: "#6aa84f",
        },
        {
          name: "Feasible",
          title: "Additional income if feasible values are reached",
          value: totalIncome.feasible - totalIncome.current,
          total: totalIncome.feasible,
          order: 1,
          color: "#d9ead3",
        },
      ],
    };
    return [...commodityGroup, totalIncomeCommodityGroup];
  }, [
    totalIncomeQuestion,
    segmentFormValues,
    questionGroups,
    commodityList,
    totalIncome,
    segmentValues,
  ]);

  const targetChartData = useMemo(() => {
    if (!chartData.length || !segmentValues) {
      return [];
    }
    return [
      {
        ...incomeTargetChartOption,
        data: chartData.map((x) => ({
          name: "Income Target",
          symbol: x.name === "Total\nIncome" ? "diamond" : "none",
          value: segmentValues.target.toFixed(2),
        })),
      },
    ];
  }, [chartData, segmentValues]);

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
      title="Are you sure want to delete this segment?"
      trigger="click"
      open={confimationModal}
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

  const extra = onDelete ? (
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

  return (
    <Row gutter={[16, 16]}>
      <Col span={16}>
        <Card
          title={
            <h3>
              {editing ? (
                <Input
                  defaultValue={segmentLabel}
                  onChange={(e) => setNewName(e.target.value)}
                />
              ) : (
                segmentLabel
              )}
            </h3>
          }
          extra={extra}
          className="segment-group"
        >
          <Card.Grid
            style={{
              width: "100%",
            }}
            hoverable={false}
          >
            <h2 className="section-title">
              Income Target
              <small>
                <InfoCircleFilled />
              </small>
            </h2>
            <IncomeDriverTarget
              segment={segment}
              currentCase={currentCase}
              segmentFormValues={segmentFormValues}
              setSegmentFormValues={setSegmentFormValues}
              segmentItem={segmentItem}
              totalIncome={totalIncome}
            />
            <h2 className="section-title">
              Income Drivers
              <small>
                <InfoCircleFilled />
              </small>
            </h2>
            <Row gutter={[8, 8]} align="middle">
              <Col span={14}></Col>
              <Col span={4}>
                <h4>Current</h4>
              </Col>
              <Col span={4}>
                <h4>Feasible</h4>
              </Col>
              <Col span={2}></Col>
            </Row>
            <Row
              gutter={[8, 8]}
              style={{
                borderBottom: "1px solid #f0f0f0",
                padding: "8px 0",
              }}
              align="middle"
            >
              <Col span={14}>
                <h2>Total Income</h2>
              </Col>
              <Col span={4}>
                <InputNumber
                  value={totalIncome.current}
                  disabled
                  style={{ width: "100%" }}
                />
              </Col>
              <Col span={4}>
                <InputNumber
                  value={totalIncome.feasible}
                  disabled
                  style={{ width: "100%" }}
                />
              </Col>
              <Col span={2}>
                <Space className="percentage-wrapper">
                  {totalIncome.percent === 0 ? null : totalIncome.percent >
                    0 ? (
                    <CaretUpFilled className="ceret-up" />
                  ) : (
                    <CaretDownFilled className="ceret-down" />
                  )}
                  <div
                    className={
                      totalIncome.percent === 0
                        ? ""
                        : totalIncome.percent > 0
                        ? "ceret-up"
                        : "ceret-down"
                    }
                  >
                    {totalIncome.feasible < totalIncome.current
                      ? -totalIncome.percent.toFixed(2)
                      : totalIncome.percent.toFixed(2)}
                    %
                  </div>
                </Space>
              </Col>
            </Row>
            {questionGroups.map((group, groupIndex) => (
              <IncomeDriverForm
                group={group}
                groupIndex={groupIndex}
                commodity={commodityList[groupIndex]}
                key={groupIndex}
                segmentFormValues={segmentFormValues}
                setSegmentFormValues={setSegmentFormValues}
                segmentItem={segmentItem}
                currentCaseId={currentCaseId}
                totalDiversifiedIncome={totalIncome.diversified}
              />
            ))}
          </Card.Grid>
        </Card>
        <Button
          htmlType="submit"
          className="button button-submit button-secondary"
          style={{ float: "right" }}
          loading={isSaving}
          onClick={handleSave}
        >
          Save
        </Button>
      </Col>
      <Chart
        title="Calculated Household Income"
        span={8}
        type="BARSTACK"
        data={chartData}
        affix={true}
        targetData={targetChartData}
        loading={!chartData.length || !targetChartData.length}
      />
    </Row>
  );
};

export default DataFields;
