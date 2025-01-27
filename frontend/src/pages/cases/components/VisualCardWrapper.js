import React, { useState } from "react";
import { Row, Col, Card, Space, Button, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { toPng } from "html-to-image";

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

const VisualCardWrapper = ({
  children,
  title,
  bordered = false,
  tooltipText = null,
  showLabel,
  setShowLabel,
  exportElementRef,
  exportFilename = "Undefined",
  extraButtons = [],
}) => {
  const [exportimg, setExporting] = useState(false);

  const handleOnClickSaveAsImage = () => {
    setExporting(true);
    htmlToImageConvert(exportElementRef, exportFilename, setExporting);
  };

  return (
    <Card
      ref={exportElementRef}
      className={`visual-card-wrapper ${bordered ? "bordered" : ""}`}
      title={
        <Row align="middle" gutter={[8, 8]} wrap>
          <Col span={14}>
            <Space align="center">
              <div className="title">{title}</div>
              {tooltipText ? (
                <Tooltip className="info-tooltip" title={tooltipText}>
                  <InfoCircleOutlined />
                </Tooltip>
              ) : (
                ""
              )}
            </Space>
          </Col>
          <Col span={10} align="end">
            {setShowLabel ? (
              <Button
                size="small"
                className="button-export"
                onClick={() => setShowLabel((prev) => !prev)}
              >
                {showLabel ? "Hide" : "Show"} label
              </Button>
            ) : (
              ""
            )}
            {exportElementRef ? (
              <Button
                size="small"
                className="button-export"
                onClick={handleOnClickSaveAsImage}
                loading={exportimg}
              >
                Export
              </Button>
            ) : (
              ""
            )}
            {extraButtons?.length ? extraButtons.map((button) => button) : ""}
          </Col>
        </Row>
      }
    >
      {children}
    </Card>
  );
};

export default VisualCardWrapper;
