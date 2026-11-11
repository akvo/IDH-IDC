import React from "react";
import { Checkbox } from "antd";
import { Link } from "react-router-dom";
import ProgressStatusTag from "./ProgressStatusTag";
import { PROGRESS_STATUS, getChapterPath } from "../utils";

const formatChapterNumber = (number) => String(number ?? "").padStart(2, "0");

const RecentlyOpenedChapterCard = ({ chapter, onToggleComplete, pending }) => {
  const { id, chapter_number: chapterNumber, title, status } = chapter;
  const isCompleted = status === PROGRESS_STATUS.completed;

  return (
    <li className="academy-chapter-row" data-testid="academy-chapter-row">
      <span className="academy-chapter-number">
        {formatChapterNumber(chapterNumber)}
      </span>
      <Link className="academy-chapter-title" to={getChapterPath(id)}>
        {title}
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

export default RecentlyOpenedChapterCard;
