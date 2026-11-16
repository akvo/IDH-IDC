import React from "react";
import { Button, Progress } from "antd";
import { FileOutlined, RightOutlined } from "@ant-design/icons";
import ProgressStatusTag from "./ProgressStatusTag";
import { ACADEMY_PRIMARY_COLOR } from "../utils";

const ICON_THEMES = ["blue", "green", "pink", "purple", "cyan", "yellow"];

const RoadmapModuleCard = ({ module, onOpen }) => {
  const {
    order_index: moduleNumber,
    title,
    description,
    icon_theme: iconTheme,
    progress_pct: progressPct = 0,
    status,
    tags = [],
  } = module;
  const theme = ICON_THEMES.includes(iconTheme) ? iconTheme : "blue";

  return (
    <article className="academy-module-card" data-testid="academy-module-card">
      <div className="academy-module-card-main">
        <div className="academy-module-card-header">
          <span
            className={`academy-module-icon academy-module-icon--${theme}`}
            aria-hidden="true"
          >
            <FileOutlined />
          </span>
          <span className="academy-module-number">Module {moduleNumber}</span>
          <ProgressStatusTag status={status} />
          <Button
            className="academy-module-open"
            icon={<RightOutlined />}
            aria-label={`Open module ${moduleNumber}: ${title}`}
            onClick={() => onOpen(module)}
          />
        </div>
        <h3 className="academy-module-title">{title}</h3>
        {description && (
          <p className="academy-module-description">{description}</p>
        )}
        {tags.length > 0 && (
          <ul className="academy-tag-list" aria-label="Topics">
            {tags.map((tag) => (
              <li key={tag.id} className="academy-tag">
                #{tag.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="academy-module-card-progress">
        <span className="academy-module-progress-label">{progressPct}%</span>
        <Progress
          percent={progressPct}
          showInfo={false}
          size={["100%", 4]}
          strokeColor={ACADEMY_PRIMARY_COLOR}
          aria-label={`Module ${moduleNumber} progress: ${progressPct}%`}
        />
      </div>
    </article>
  );
};

export default RoadmapModuleCard;
