import React, { memo, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "antd";
import { sanitizeHtml } from "../utils";

// "There are N modules in this course" with the course summary, clamped to a
// few lines. "Read more" only appears when the summary is actually cut off.
const CourseSummaryCard = ({ totalModules, summaryHtml }) => {
  const summaryRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const html = useMemo(() => sanitizeHtml(summaryHtml), [summaryHtml]);

  useLayoutEffect(() => {
    const node = summaryRef.current;
    if (node && !expanded) {
      setClamped(node.scrollHeight > node.clientHeight);
    }
  }, [summaryHtml, expanded]);

  return (
    <section
      className="academy-course-summary"
      aria-labelledby="course-summary-title"
    >
      <h2 id="course-summary-title" className="academy-course-summary-title">
        There{" "}
        {totalModules === 1 ? "is 1 module" : `are ${totalModules} modules`} in
        this course
      </h2>
      {summaryHtml && (
        <div
          ref={summaryRef}
          id="course-summary-text"
          className={`academy-course-summary-text${
            expanded ? "" : " academy-course-summary-text--clamped"
          }`}
          // Sanitised: the summary is authored HTML from the API
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
      {(clamped || expanded) && (
        <Button
          type="link"
          className="academy-course-summary-toggle"
          aria-expanded={expanded}
          aria-controls="course-summary-text"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Read less" : "Read more"}
        </Button>
      )}
    </section>
  );
};

export default memo(CourseSummaryCard);
