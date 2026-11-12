import React from "react";
import { Progress } from "antd";
import { ArrowRightOutlined, DownOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import ChapterRow from "./ChapterRow";
import HighlightedText from "./HighlightedText";
import ProgressStatusTag from "./ProgressStatusTag";
import TagFilterChips from "./TagFilterChips";
import { ACADEMY_PRIMARY_COLOR, getModulePath } from "../utils";

// One collapsible curriculum module: progress header, chapter rows and, in
// search results, the module's tags
const ModuleAccordion = ({
  module,
  expanded,
  onToggle,
  highlight,
  showTags = false,
  onTagSelect,
  pendingChapterIds = [],
  onToggleComplete,
}) => {
  const {
    id,
    order_index: moduleNumber,
    title,
    estimated_minutes: minutes,
    progress_pct: progressPct = 0,
    status,
    chapters = [],
    tags = [],
  } = module;
  const panelId = `academy-module-panel-${id}`;
  const toggle = () => onToggle(id);

  return (
    <section
      className="academy-accordion"
      data-testid="academy-module-accordion"
    >
      <div className="academy-accordion-header">
        <button
          type="button"
          className="academy-accordion-trigger"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={toggle}
        >
          <span className="academy-accordion-heading">
            <span className="academy-accordion-title">
              <HighlightedText text={title} highlight={highlight} />
            </span>
            <span className="academy-accordion-meta">
              Module {moduleNumber} • {minutes} minutes to complete
            </span>
          </span>
          <span className="academy-accordion-progress">
            <span className="academy-accordion-percent">{progressPct}%</span>
            <Progress
              percent={progressPct}
              showInfo={false}
              size={["100%", 2]}
              strokeColor={ACADEMY_PRIMARY_COLOR}
              aria-label={`Module ${moduleNumber} progress`}
            />
          </span>
          <ProgressStatusTag status={status} />
        </button>
        {expanded && (
          <Link
            className="academy-accordion-go"
            to={getModulePath(id)}
            aria-label={`Go to module ${moduleNumber}: ${title}`}
          >
            Go <ArrowRightOutlined />
          </Link>
        )}
        {/* Mouse shortcut for the trigger; keyboard users use the trigger */}
        <button
          type="button"
          className={`academy-accordion-chevron${
            expanded ? " academy-accordion-chevron--open" : ""
          }`}
          tabIndex={-1}
          aria-hidden="true"
          onClick={toggle}
        >
          <DownOutlined />
        </button>
      </div>

      {expanded && (
        <div id={panelId} className="academy-accordion-panel">
          {chapters.length ? (
            <ul className="academy-chapter-list">
              {chapters.map((chapter) => (
                <ChapterRow
                  key={chapter.id}
                  chapter={{ ...chapter, module_id: id }}
                  highlight={highlight}
                  pending={pendingChapterIds.includes(chapter.id)}
                  onToggleComplete={onToggleComplete}
                />
              ))}
            </ul>
          ) : (
            <p className="academy-accordion-empty">
              No chapters in this module yet.
            </p>
          )}
          {showTags && tags.length > 0 && (
            <TagFilterChips
              label="Matching tags"
              items={tags.map((tag) => ({
                value: tag.slug,
                label: `#${tag.name}`,
              }))}
              onSelect={onTagSelect}
            />
          )}
        </div>
      )}
    </section>
  );
};

export default ModuleAccordion;
