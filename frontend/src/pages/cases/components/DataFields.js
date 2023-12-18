import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Space,
  Popover,
  Input,
  InputNumber,
  Divider,
  Table,
  Select,
} from "antd";
import {
  DeleteTwoTone,
  InfoCircleFilled,
  CheckCircleTwoTone,
  EditTwoTone,
  CloseCircleTwoTone,
  CaretDownFilled,
  CaretUpFilled,
  StepForwardOutlined,
  StepBackwardOutlined,
  CalendarOutlined,
  HomeOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { isEmpty } from "lodash";
import {
  IncomeDriverForm,
  IncomeDriverTarget,
  InputNumberThousandFormatter,
} from "./";
import Chart from "../../../components/chart";
import { SaveAsImageButton } from "../../../components/utils";
import { api } from "../../../lib";
import { driverOptions } from "../../explore-studies";

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
  setPage,
  enableEditCase,
}) => {
  const [confimationModal, setConfimationModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(segmentLabel);
  const elDriverChart = useRef(null);

  const [loadingRefData, setLoadingRefData] = useState(false);
  const [referenceData, setReferenceData] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState("area");
  const [exploreButtonLink, setExploreButtonLink] = useState(null);

  const finishEditing = () => {
    renameItem(segment, newName);
    setEditing(false);
  };
  const cancelEditing = () => {
    setNewName(segmentLabel);
    setEditing(false);
  };

  useEffect(() => {
    const country = currentCase?.country;
    const commodity = currentCase?.case_commodities?.find(
      (x) => x.commodity_type === "focus"
    )?.commodity;
    if (!isEmpty(currentCase) && selectedDriver) {
      setLoadingRefData(true);
      setExploreButtonLink(
        `/explore-studies/${country}/${commodity}/${selectedDriver}`
      );
      api
        .get(
          `reference_data/reference_value?country=${country}&commodity=${commodity}&driver=${selectedDriver}`
        )
        .then((res) => {
          setReferenceData(res.data);
        })
        .catch(() => {
          setReferenceData([]);
        })
        .finally(() => {
          setLoadingRefData(false);
        });
    }
  }, [currentCase, selectedDriver]);

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

  const benchmarkInfo = useMemo(() => {
    const findSegmentBenchmark =
      dashboardData.find((d) => d.key === segment)?.benchmark || null;
    return {
      label: "Source",
      value: findSegmentBenchmark ? findSegmentBenchmark.source : "NA",
      link: findSegmentBenchmark?.links || null,
      childs: [
        {
          label: "Year of Study",
          value: findSegmentBenchmark?.year || "NA",
          icon: <CalendarOutlined />,
        },
        {
          label: "Household Size",
          value: findSegmentBenchmark?.household_size || "NA",
          icon: <HomeOutlined />,
        },
        {
          label: "Adults",
          value: findSegmentBenchmark?.nr_adults || "NA",
          icon: <UserOutlined />,
        },
      ],
    };
  }, [dashboardData, segment]);

  const chartData = useMemo(() => {
    if (!segmentFormValues.length || !segmentValues) {
      return [];
    }
    const res = segmentFormValues.map((currentFormValue) => {
      const current = totalIncomeQuestion
        .map((qs) => currentFormValue?.answers[`current-${qs}`])
        .filter((a) => a)
        .reduce((acc, a) => acc + a, 0);
      const feasible = totalIncomeQuestion
        .map((qs) => currentFormValue?.answers[`feasible-${qs}`])
        .filter((a) => a)
        .reduce((acc, a) => acc + a, 0);
      return {
        name: `Total Income\n${currentFormValue.name}`,
        data: [
          {
            name: "Current Income",
            value: current,
            color: "#03625f",
          },
          {
            name: "Feasible Income",
            value: feasible,
            color: "#82b2b2",
          },
        ],
      };
    });
    return res;
  }, [totalIncomeQuestion, segmentFormValues, segmentValues]);

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
      <Col span={14}>
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
          extra={enableEditCase ? extra : null}
          className="segment-group"
        >
          <Card.Grid
            style={{
              width: "100%",
              paddingRight: 0,
            }}
            hoverable={false}
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card
                  title={
                    <h2 className="section-title">
                      Income Target
                      <small>
                        <InfoCircleFilled />
                      </small>
                    </h2>
                  }
                  className="segment-child-wrapper"
                >
                  <Card.Grid
                    style={{
                      width: "100%",
                    }}
                    hoverable={false}
                  >
                    <IncomeDriverTarget
                      segment={segment}
                      currentCase={currentCase}
                      segmentFormValues={segmentFormValues}
                      setSegmentFormValues={setSegmentFormValues}
                      segmentItem={segmentItem}
                      totalIncome={totalIncome}
                      enableEditCase={enableEditCase}
                    />
                  </Card.Grid>
                </Card>
              </Col>
              <Col span={24}>
                <Card
                  title={
                    <h2 className="section-title">
                      Income Drivers
                      <small>
                        <InfoCircleFilled />
                      </small>
                    </h2>
                  }
                  className="segment-child-wrapper"
                >
                  <Card.Grid
                    style={{
                      width: "100%",
                    }}
                    hoverable={false}
                  >
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
                      <Col span={13}>
                        <h2>Total Income</h2>
                      </Col>
                      <Col span={4}>
                        <InputNumber
                          value={totalIncome.current}
                          disabled
                          style={{ width: "100%" }}
                          {...InputNumberThousandFormatter}
                        />
                      </Col>
                      <Col span={4}>
                        <InputNumber
                          value={totalIncome.feasible}
                          disabled
                          style={{ width: "100%" }}
                          {...InputNumberThousandFormatter}
                        />
                      </Col>
                      <Col span={3}>
                        <Space className="percentage-wrapper">
                          {totalIncome.percent ===
                          0 ? null : totalIncome.percent > 0 ? (
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
                        enableEditCase={enableEditCase}
                      />
                    ))}
                  </Card.Grid>
                </Card>
              </Col>
            </Row>
          </Card.Grid>
        </Card>
        <Row style={{ paddingLeft: "20px" }}>
          <Col span={12}>
            <Button
              className="button button-submit button-secondary"
              onClick={() => setPage("Case Profile")}
            >
              <StepBackwardOutlined />
              Previous
            </Button>
          </Col>
          <Col
            span={12}
            style={{
              justifyContent: "flex-end",
              display: "grid",
            }}
          >
            <Space size={[8, 16]} wrap>
              {enableEditCase && (
                <Button
                  htmlType="submit"
                  className="button button-submit button-secondary"
                  loading={isSaving}
                  onClick={handleSave}
                >
                  Save
                </Button>
              )}
              <Button
                htmlType="submit"
                className="button button-submit button-secondary"
                loading={isSaving}
                onClick={() => {
                  handleSave({ isNextButton: true });
                }}
              >
                Next
                <StepForwardOutlined />
              </Button>
            </Space>
          </Col>
        </Row>
      </Col>
      <Col span={10} style={{ paddingRight: "24px" }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card
              title="Information about Living Income Benchmark"
              className="info-card-wrapper"
            >
              <div className="benchmark-info-title-wrapper">
                <b>{benchmarkInfo?.label}</b> :{" "}
                {benchmarkInfo?.link ? (
                  <a href={benchmarkInfo.link} target="_blank" rel="noreferrer">
                    {benchmarkInfo?.value}
                  </a>
                ) : (
                  benchmarkInfo?.value
                )}
              </div>
              <Divider style={{ margin: "10px" }} />
              <Space
                direction="vertical"
                className="benchmark-info-child-wrapper"
              >
                {benchmarkInfo?.childs.map((bi, i) => (
                  <div key={i}>
                    <Space>
                      <div>{bi.icon}</div>
                      <div>
                        <b>{bi.label}</b> : <span>{bi.value}</span>
                      </div>
                    </Space>
                  </div>
                ))}
              </Space>
            </Card>
          </Col>
          <Col span={24}>
            <Card
              ref={elDriverChart}
              title="Calculated Household Income"
              className="chart-card-wrapper"
              extra={
                <SaveAsImageButton
                  elementRef={elDriverChart}
                  filename="Calculated Household Income"
                  type="ghost-white"
                />
              }
            >
              <Chart
                // title="Calculated Household Income"
                // span={10}
                // affix={true}
                wrapper={false}
                type="COLUMN-BAR"
                data={chartData}
                loading={!chartData.length}
                height={window.innerHeight * 0.45}
                extra={{
                  axisTitle: { y: `Income (${currentCase.currency})` },
                }}
              />
            </Card>
          </Col>
          <Col span={24}>
            <Card
              title="Explore Studies"
              className="info-card-wrapper"
              extra={
                <a
                  href={exploreButtonLink}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Button
                    className="save-as-image-btn"
                    style={{
                      fontSize: 12,
                      borderRadius: "20px",
                      padding: "0 10px",
                      backgroundColor: "transparent",
                      color: "#fff",
                      fontWeight: 600,
                    }}
                    disabled={!exploreButtonLink}
                  >
                    Explore Studies
                  </Button>
                </a>
              }
            >
              <Space direction="vertical" size="large">
                <Select
                  options={driverOptions}
                  onChange={setSelectedDriver}
                  value={selectedDriver}
                  size="small"
                />
                <Table
                  bordered
                  size="small"
                  rowKey="id"
                  loading={loadingRefData}
                  columns={[
                    {
                      key: "value",
                      title: "Value",
                      dataIndex: "value",
                    },
                    {
                      key: "unit",
                      title: "Unit",
                      dataIndex: "unit",
                    },
                    {
                      key: "source",
                      title: "Source",
                      width: "35%",
                      render: (value, row) => {
                        if (!row?.link) {
                          return value;
                        }
                        const url = row.link?.includes("https://")
                          ? row.link
                          : `https://${row.link}`;
                        return (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            {row.source}
                          </a>
                        );
                      },
                    },
                  ]}
                  dataSource={referenceData}
                  scroll={{
                    y: 240,
                  }}
                />
              </Space>
            </Card>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default DataFields;
