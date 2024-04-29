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
  Tooltip,
} from "antd";
import {
  DeleteTwoTone,
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
  InfoCircleOutlined,
  UsergroupAddOutlined,
  FileOutlined,
  MoneyCollectOutlined,
} from "@ant-design/icons";
import { isEmpty, upperFirst } from "lodash";
import {
  IncomeDriverForm,
  IncomeDriverTarget,
  InputNumberThousandFormatter,
} from "./";
import Chart from "../../../components/chart";
import { SaveAsImageButton, ShowLabelButton } from "../../../components/utils";
import { api } from "../../../lib";
import { driverOptions } from "../../explore-studies";
import { thousandFormatter } from "../../../components/chart/options/common";
import { UserState } from "../../../store";

const LIBTooltipText = (
  <div>
    Living income is the net annual income required for a household in a
    particular place to afford a decent standard of living for all members of
    that household. Elements of a decent standard of living include: food,
    water, housing, education, healthcare, transport, clothing, and other
    essential needs including provision for unexpected events. To find out more,
    visit https://www.living-income.com/the-concept
  </div>
);

const incomeTargetTooltipText =
  "To make use of the calculations and visualizations in this tool, it's crucial to set an income target. You have two options: either define the target yourself or rely on a living income benchmark value if available.";
const incomeDriversTooltipText =
  "We consider five income drivers to compute the income of a farmer and their household members. For further details on these income drivers and their role in income calculation, please refer to the home page or select the information box per driver below.";

const DataFields = ({
  segment,
  segmentLabel,
  onDelete,
  questionGroups,
  totalIncomeQuestion,
  commodityList,
  renameItem,
  formValues,
  setFormValues,
  segmentItem,
  handleSave,
  isSaving,
  currentCaseId,
  currentCase,
  dashboardData,
  setPage,
  enableEditCase,
  segments,
}) => {
  const [confimationModal, setConfimationModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(segmentLabel);
  const elDriverChart = useRef(null);

  const [loadingRefData, setLoadingRefData] = useState(false);
  const [referenceData, setReferenceData] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState("area");
  const [exploreButtonLink, setExploreButtonLink] = useState(null);

  const [showChartLabel, setShowChartLabel] = useState(false);
  const [benchmark, setBenchmark] = useState(
    segmentItem?.benchmark?.year === currentCase?.year
      ? segmentItem?.benchmark
      : null
  );

  const userRole = UserState.useState((s) => s.role);
  const isInternalUser = UserState.useState((s) => s.internal_user);

  const finishEditing = () => {
    renameItem(segment, newName);
    setEditing(false);
  };
  const cancelEditing = () => {
    setNewName(segmentLabel);
    setEditing(false);
  };

  const isExternalUser = useMemo(() => {
    return userRole === "user" && !isInternalUser;
  }, [userRole, isInternalUser]);

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
    const currentFormValue = formValues.find((x) => x.key === segmentItem.key);
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
    const otherCurrent = other?.total_current_diversified_income || 0;
    const otherFeasible = other?.total_feasible_diversified_income || 0;
    const otherPercent = otherFeasible
      ? ((otherFeasible - otherCurrent) / otherCurrent) * 100
      : 0;
    return {
      current: current,
      feasible: feasible,
      percent: isNaN(percent) ? 0 : percent,
      diversified: {
        current: otherCurrent,
        feasible: otherFeasible,
        percent: isNaN(otherPercent) ? 0 : otherPercent,
      },
    };
  }, [formValues, segmentItem, dashboardData, totalIncomeQuestion]);

  const benchmarkInfo = useMemo(() => {
    const findSegmentBenchmark =
      dashboardData.find((d) => d.key === segment)?.benchmark || {};
    const { source, links, year, household_size, nr_adults } =
      findSegmentBenchmark;
    let nr_childs = "NA";
    if (household_size && nr_adults) {
      nr_childs = household_size - nr_adults;
    }
    let inflationRate = [];
    if (benchmark?.cpi_factor) {
      inflationRate = [
        {
          label: "Inflation Rate",
          value: benchmark.cpi_factor.toFixed(2),
          icon: <MoneyCollectOutlined />,
        },
      ];
    }
    return {
      label: "Source",
      value: source || "NA",
      link: links || null,
      childs: [
        {
          label: "Year of Study",
          value: year || "NA",
          icon: <CalendarOutlined />,
        },
        {
          label: "Household Size",
          value: household_size || "NA",
          icon: <HomeOutlined />,
        },
        {
          label: "Adults",
          value: nr_adults || "NA",
          icon: <UserOutlined />,
        },
        {
          label: "Childrens",
          value: nr_childs || "NA",
          icon: <UsergroupAddOutlined />,
        },
        ...inflationRate,
      ],
    };
  }, [dashboardData, segment, benchmark?.cpi_factor]);

  const chartData = useMemo(() => {
    if (!segments.length) {
      return [];
    }
    const res = segments.map((item) => {
      const answers =
        formValues.find((fv) => fv.key === item.key)?.answers || {};
      const current = totalIncomeQuestion
        .map((qs) => answers?.[`current-${qs}`] || 0)
        .filter((a) => a)
        .reduce((acc, a) => acc + a, 0);
      const feasible = totalIncomeQuestion
        .map((qs) => answers?.[`feasible-${qs}`] || 0)
        .filter((a) => a)
        .reduce((acc, a) => acc + a, 0);
      return {
        name: item.label,
        data: [
          {
            name: "Current Income",
            value: Math.round(current),
            color: "#03625f",
          },
          {
            name: "Feasible Income",
            value: Math.round(feasible),
            color: "#82b2b2",
          },
        ],
      };
    });
    return res;
  }, [totalIncomeQuestion, segments, formValues]);

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
                  maxLength={15}
                  showCount={true}
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
                      <div>
                        <Tooltip title={incomeTargetTooltipText}>
                          <InfoCircleOutlined />
                        </Tooltip>
                      </div>
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
                      formValues={formValues}
                      setFormValues={setFormValues}
                      segmentItem={segmentItem}
                      totalIncome={totalIncome}
                      enableEditCase={enableEditCase}
                      setBenchmark={setBenchmark}
                      benchmark={benchmark}
                    />
                  </Card.Grid>
                </Card>
              </Col>
              <Col span={24}>
                <Card
                  title={
                    <h2 className="section-title">
                      Income Drivers
                      <div>
                        <Tooltip title={incomeDriversTooltipText}>
                          <InfoCircleOutlined />
                        </Tooltip>
                      </div>
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
                      <Col span={13}></Col>
                      <Col span={4} align="center">
                        <h4>
                          Current level
                          <br />
                          per year
                        </h4>
                      </Col>
                      <Col span={4} align="center">
                        <h4>
                          Feasible level
                          <br />
                          per year
                        </h4>
                      </Col>
                      <Col span={3}></Col>
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
                          formatter={(value, info) =>
                            InputNumberThousandFormatter.formatter(
                              value,
                              info,
                              true
                            )
                          }
                          parser={InputNumberThousandFormatter.parser}
                        />
                      </Col>
                      <Col span={4}>
                        <InputNumber
                          value={totalIncome.feasible}
                          disabled
                          style={{ width: "100%" }}
                          formatter={(value, info) =>
                            InputNumberThousandFormatter.formatter(
                              value,
                              info,
                              true
                            )
                          }
                          parser={InputNumberThousandFormatter.parser}
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
                        formValues={formValues}
                        setFormValues={setFormValues}
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
              extra={
                <Space>
                  <a
                    href="/files/explanation_on_using_benchmarks.pdf"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Tooltip title='See "An explanation of how to contextualise the Living Income Benchmarks" document here.'>
                      <FileOutlined style={{ color: "#fff" }} />
                    </Tooltip>
                  </a>
                  <Tooltip title={LIBTooltipText}>
                    <InfoCircleOutlined style={{ color: "#fff" }} />
                  </Tooltip>
                </Space>
              }
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
                <Space align="center">
                  <ShowLabelButton
                    showLabel={showChartLabel}
                    setShowLabel={setShowChartLabel}
                    type="ghost-white"
                  />
                  <SaveAsImageButton
                    elementRef={elDriverChart}
                    filename="Calculated Household Income"
                    type="ghost-white"
                  />
                </Space>
              }
            >
              <Chart
                wrapper={false}
                type="COLUMN-BAR"
                data={chartData}
                loading={!chartData.length}
                height={window.innerHeight * 0.45}
                extra={{
                  axisTitle: { y: `Income (${currentCase.currency})` },
                }}
                grid={{ bottom: 60, right: 5, left: 90 }}
                showLabel={showChartLabel}
              />
            </Card>
          </Col>
          {!isExternalUser ? (
            <Col span={24}>
              <Card
                title={
                  <Space>
                    <div>Explore data from other studies</div>
                    <Tooltip
                      title="We have assessed data from secondary sources that you can use
                  as a reference for the income drivers."
                    >
                      <InfoCircleOutlined />
                    </Tooltip>
                  </Space>
                }
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
                        render: (value) => {
                          if (value && Number(value)) {
                            return thousandFormatter(value);
                          }
                          return value || "-";
                        },
                      },
                      {
                        key: "unit",
                        title: "Unit",
                        dataIndex: "unit",
                        render: (value) => value || "-",
                      },
                      {
                        key: "type",
                        title: "Type",
                        dataIndex: "type",
                        render: (value) => value || "-",
                      },
                      {
                        key: "source",
                        title: "Source",
                        width: "35%",
                        render: (value, row) => {
                          if (!row?.link) {
                            return value;
                          }
                          const url =
                            row.link?.includes("https://") ||
                            row.link?.includes("http://")
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
                    expandable={{
                      expandedRowRender: (record) => (
                        <div style={{ padding: 0 }}>
                          <Table
                            bordered
                            showHeader={false}
                            size="small"
                            rowKey="id"
                            columns={[
                              {
                                key: "label",
                                title: "Label",
                                dataIndex: "label",
                                width: "45%",
                              },
                              {
                                key: "value",
                                title: "Value",
                                dataIndex: "value",
                              },
                            ]}
                            dataSource={Object.keys(record)
                              .map((key) => {
                                if (
                                  [
                                    "id",
                                    "unit",
                                    "value",
                                    "source",
                                    "link",
                                  ].includes(key)
                                ) {
                                  return false;
                                }
                                const label = key
                                  .split("_")
                                  ?.map((x) => upperFirst(x))
                                  ?.join(" ");
                                let value = record[key];
                                if (value && typeof value === "number") {
                                  value = thousandFormatter(value);
                                }
                                if (value && typeof value !== "number") {
                                  value = value
                                    .split(" ")
                                    .map((x) => upperFirst(x))
                                    .join(" ");
                                }
                                return {
                                  label: label,
                                  value: value || "-",
                                };
                              })
                              .filter((x) => x)}
                            pagination={false}
                          />
                        </div>
                      ),
                    }}
                  />
                </Space>
              </Card>
            </Col>
          ) : null}
        </Row>
      </Col>
    </Row>
  );
};

export default DataFields;
