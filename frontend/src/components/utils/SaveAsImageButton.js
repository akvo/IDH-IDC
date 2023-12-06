import React, { useState } from "react";
import { Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { toPng } from "html-to-image";

const defaultStyle = {
  borderRadius: "20px",
  padding: "0 10px",
};

const buttonTypeStyle = {
  "ghost-white": {
    backgroundColor: "transparent",
    color: "#fff",
    fontWeight: 600,
  },
};

const htmlToImageConvert = (elementRef, filename, setLoading) => {
  if (!elementRef) {
    console.error("Please provide you element ref using react useRef");
    setTimeout(() => {
      setLoading(false);
    }, 100);
    return;
  }
  toPng(elementRef.current, {
    filter: (node) => {
      const exclusionClasses = ["save-as-image-btn"];
      return !exclusionClasses.some((classname) =>
        node.classList?.contains(classname)
      );
    },
    cacheBust: false,
    backgroundColor: "#fff",
    style: {
      padding: 50,
      width: "100%",
    },
  })
    .then((dataUrl) => {
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
    })
    .catch((err) => {
      console.error("Error while downloading content", err);
    })
    .finally(() => {
      setTimeout(() => {
        setLoading(false);
      }, 100);
    });
};

const SaveAsImageButton = ({
  elementRef,
  filename = "Undefined",
  style = {},
  type = null,
}) => {
  const [loading, setLoading] = useState(false);

  const typeStyle = buttonTypeStyle?.[type] || {};

  const handleOnClickSaveAsImage = () => {
    setLoading(true);
    htmlToImageConvert(elementRef, filename, setLoading);
  };

  return (
    <Button
      id="save-as-image-btn"
      className="save-as-image-btn"
      icon={<DownloadOutlined />}
      size="small"
      onClick={handleOnClickSaveAsImage}
      style={{ fontSize: 12, ...defaultStyle, ...typeStyle, ...style }}
      loading={loading}
    >
      Download chart
    </Button>
  );
};

export default SaveAsImageButton;
