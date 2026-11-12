import React from "react";
import { Checkbox } from "antd";
import { Link } from "react-router-dom";
import ProgressStatusTag from "./ProgressStatusTag";
import HighlightedText from "./HighlightedText";
import { PROGRESS_STATUS, getChapterPath, getModulePath } from "../utils";
import "./ChapterRow.scss";

const formatChapterNumber = (number) => String(number ?? "").padStart(2, "0");

// One chapter: number, title link to the chapter on the module learning
// page, status and completion toggle. `highlight` marks the search term.
const ChapterRow = ({ chapter, onToggleComplete, pending, highlight }) => {
  const {
    id,
    module_id: moduleId,
    chapter_number: chapterNumber,
    title,
    status,
  } = chapter;
  // Without a module id, Course Overview resolves the chapter's module
  const to = moduleId ? getModulePath(moduleId, id) : getChapterPath(id);
  const isCompleted = status === PROGRESS_STATUS.completed;

  return (
    <li className="academy-chapter-row" data-testid="academy-chapter-row">
      <span className="academy-chapter-number">
        {formatChapterNumber(chapterNumber)}
      </span>
      <Link className="academy-chapter-title" to={to}>
        <HighlightedText text={title} highlight={highlight} />
      </Link>
      <ProgressStatusTag status={status} />
      <Checkbox
        className="academy-chapter-check"
        checked={isCompleted}
        disabled={pending}
        aria-label={
          isCompleted
            ? `Mark "${title}" as not completed`
            : `Mark "${title}" as completed`
        }
        onChange={(e) => onToggleComplete(chapter, e.target.checked)}
      />
    </li>
  );
};

export default ChapterRow;
