import React, { useState, useMemo, useRef } from "react";
import { Row, Col, Card, Button, Modal, Select, Space } from "antd";
import { selectProps } from "../../lib";
import { TableScenarioOutcomes } from "../../pages/cases/visualizations";
import {
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { toPng } from "html-to-image";
import { isEmpty } from "lodash";

const SHOW_SEGMENT_DROPDOWN = false;

const incomeTargetIcon = {
  reached: (
    <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 18 }} />
  ),
  not_reached: (
    <CloseCircleTwoTone twoToneColor="#eb2f96" style={{ fontSize: 18 }} />
  ),
};

const htmlToImageConvert = (exportElementRef, exportFilename, setExporting) => {
  if (!exportElementRef) {
    console.error("Please provide you element ref using react useRef");
    setTimeout(() => {
      setExporting(false);
    }, 100);
    return;
  }
  // add custom padding
  exportElementRef.current.style.padding = "10px";
  //
  toPng(exportElementRef.current, {
    filter: (node) => {
      const exclusionClasses = [
        "save-as-image-btn",
        "show-label-btn",
        "info-tooltip",
        "button-export",
        "ant-btn",
      ];
      return !exclusionClasses.some((classname) =>
        node.classList?.contains(classname)
      );
    },
    cacheBust: false,
    backgroundColor: "#fff",
    style: {
      padding: 32,
      width: "100%",
    },
  })
    .then((dataUrl) => {
      const link = document.createElement("a");
      link.download = `${exportFilename}.png`;
      link.href = dataUrl;
      link.click();
    })
    .catch((err) => {
      console.error("Error while downloading content", err);
    })
    .finally(() => {
      // remove custom padding
      exportElementRef.current.style.padding = "0px";
      //
      setTimeout(() => {
        setExporting(false);
      }, 100);
    });
};

const ViewSummaryModal = ({
  setShowSummaryModal,
  showSummaryModal = false,
  selectedCaseData = {},
}) => {
  const exportElementRef = useRef(null);

  const [selectedSegment, setSelectedSegment] = useState(null);
  const [exportFilename, setExportFilename] = useState(null);

  const [exportimg, setExporting] = useState(false);

  const handleOnClickSaveAsImage = () => {
    setExporting(true);
    htmlToImageConvert(exportElementRef, exportFilename, setExporting);
  };

  const segmentOptions = useMemo(() => {
    if (!selectedCaseData.has_scenario_data) {
      return [];
    }
    return selectedCaseData.scenario_outcome_data_source?.map((d) => ({
      value: d.segmentId,
      label: d.segmentName,
    }));
  }, [
    selectedCaseData.has_scenario_data,
    selectedCaseData.scenario_outcome_data_source,
  ]);

  const summaryScenarioOutcomeDataSource = useMemo(() => {
    if (isEmpty(selectedCaseData)) {
      return [];
    }
    if (!selectedSegment) {
      setExportFilename(`Scenario of ${selectedCaseData.name}`);
      return selectedCaseData?.scenario_outcome_data_source?.map((sco) => {
        const remap = sco?.scenarioOutcome?.map((r) => {
          if (r.id === "income_driver") {
            // render value
            Object.entries(r).map(([key, value]) => {
              if (key !== "title") {
                const splitted = value.split("|");
                const values = (
                  <Space direction="vertical">
                    {splitted.map((x, xi) => {
                      const [text, percent] = x.split("#");
                      return (
                        <Space key={`${xi}-${x}`}>
                          <div>{text}</div>
                          <div>{percent}</div>
                        </Space>
                      );
                    })}
                  </Space>
                );
                r = {
                  ...r,
                  [key]: values,
                };
              }
            });
          }
          if (r.id === "income_target_reached") {
            Object.entries(r).map(([key, value]) => {
              if (key !== "title") {
                let icon = "";
                if (value === "reached") {
                  icon = incomeTargetIcon.reached;
                } else {
                  icon = incomeTargetIcon.not_reached;
                }
                r = {
                  ...r,
                  [key]: icon,
                };
              }
            });
          }
          return r;
        });
        return {
          ...sco,
          scenarioOutcome: remap,
        };
      });
    }
    const segment = selectedCaseData.scenario_outcome_data_source?.find(
      (s) => s.segmentId === selectedSegment
    );
    setExportFilename(
      `Scenario of ${selectedCaseData.name} ${segment.segmentName}`
    );
    return segment?.scenarioOutcome?.map((r) => {
      if (r.id === "income_driver") {
        // render value
        Object.entries(r).map(([key, value]) => {
          if (key !== "title") {
            const splitted = value.split("|");
            const values = (
              <Space direction="vertical">
                {splitted.map((x, xi) => {
                  const [text, percent] = x.split("#");
                  return (
                    <Space key={`${xi}-${x}`}>
                      <div>{text}</div>
                      <div>{percent}</div>
                    </Space>
                  );
                })}
              </Space>
            );
            r = {
              ...r,
              [key]: values,
            };
          }
        });
      }
      if (r.id === "income_target_reached") {
        Object.entries(r).map(([key, value]) => {
          if (key !== "title") {
            let icon = "";
            if (value === "reached") {
              icon = incomeTargetIcon.reached;
            } else {
              icon = incomeTargetIcon.not_reached;
            }
            r = {
              ...r,
              [key]: icon,
            };
          }
        });
      }
      return r;
    });
  }, [selectedSegment, selectedCaseData]);

  return (
    <Modal
      title="View summary"
      open={showSummaryModal}
      onCancel={setShowSummaryModal}
      width="65%"
      className="view-summary-modal-wrapper"
      maskClosable={false}
      footer={false}
      destroyOnClose={true}
    >
      <Row gutter={SHOW_SEGMENT_DROPDOWN ? [20, 20] : [0, 10]}>
        <Col span={24}>
          <Card className="scenario-outcome-form-wrapper">
            <Row gutter={[12, 12]} align="top">
              {SHOW_SEGMENT_DROPDOWN ? (
                <Col span={12}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <label>Segment</label>
                    <Select
                      {...selectProps}
                      placeholder="Select segment"
                      options={segmentOptions}
                      onChange={(val) => setSelectedSegment(val)}
                    />
                  </Space>
                </Col>
              ) : (
                ""
              )}
              <Col span={SHOW_SEGMENT_DROPDOWN ? 12 : 24} align="end">
                <Button
                  className="button-download"
                  onClick={handleOnClickSaveAsImage}
                  loading={exportimg}
                >
                  Download scenario outcomes
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={24} ref={exportElementRef}>
          {SHOW_SEGMENT_DROPDOWN ? (
            <TableScenarioOutcomes
              summaryScenarioOutcomeDataSource={
                summaryScenarioOutcomeDataSource
              }
              isSummary={true}
            />
          ) : (
            <Row gutter={[20, 20]}>
              {summaryScenarioOutcomeDataSource.map((item, index) => (
                <Col span={24} key={`${item.segmentId}-col-summary`}>
                  <Card
                    title={item.segmentName}
                    className="summary-table-wrapper"
                  >
                    <TableScenarioOutcomes
                      summaryScenarioOutcomeDataSource={item.scenarioOutcome}
                      isSummary={true}
                    />
                  </Card>
                  {index < summaryScenarioOutcomeDataSource.length - 1 ? (
                    <Button
                      icon={<ArrowDownOutlined />}
                      className="button-icon-arrow-down"
                      size="small"
                    />
                  ) : (
                    ""
                  )}
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>
    </Modal>
  );
};

export default ViewSummaryModal;
