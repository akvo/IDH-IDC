import React from "react";
import { Tag } from "antd";
import "./ToolTags.scss";

// Non-editable badges for the tools a user can use (Figma 13048:10177)
const TOOL_TAGS = [
  { tool: "academy", label: "LI Academy" },
  { tool: "idc", label: "IDC" },
];

const ToolTags = ({ tools = [], className = "", emptyText = null }) => {
  const userTools = Array.isArray(tools) ? tools : [];
  const visible = TOOL_TAGS.filter(({ tool }) => userTools.includes(tool));
  if (!visible.length) {
    return emptyText;
  }
  return (
    <div className={`tool-tags ${className}`.trim()} data-testid="tool-tags">
      {visible.map(({ tool, label }) => (
        <Tag
          key={tool}
          className={`tool-tag tool-tag--${tool}`}
          data-testid={`tool-tag-${tool}`}
        >
          {label}
        </Tag>
      ))}
    </div>
  );
};

export default ToolTags;
