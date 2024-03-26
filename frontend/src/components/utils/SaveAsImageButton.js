import React, { useState } from "react";
import { Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { toPng } from "html-to-image";

const defaultStyle = {
  fontSize: "12px",
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
  // add custom padding
  elementRef.current.style.padding = "10px";
  //
  toPng(elementRef.current, {
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
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
    })
    .catch((err) => {
      console.error("Error while downloading content", err);
    })
    .finally(() => {
      // remove custom padding
      elementRef.current.style.padding = "0px";
      //
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
  buttonText = null,
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
      style={{ ...defaultStyle, ...typeStyle, ...style }}
      loading={loading}
    >
      {buttonText ? buttonText : "Download chart"}
    </Button>
  );
};

export default SaveAsImageButton;
