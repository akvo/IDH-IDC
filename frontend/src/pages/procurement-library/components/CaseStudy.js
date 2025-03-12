import React from "react";
import { ClockIcon } from "../../../lib/icon";

const CaseStudy = ({ study }) => {
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  return (
    <div className="case-study" key={study.id}>
      <div className="thumbnail-container">
        <img src={study.image} alt={study.title} className="thumbnail" />
      </div>

      <h3>{study.title}</h3>
      <p>{study.summary}</p>
      <div className="publication-info">
        <span className="date">{formatDate(study.published_at)}</span>
        <span className="divider" />
        <span className="read">
          <span>
            <ClockIcon />
          </span>
          <span className="read-time">{study.read_time}</span>
        </span>
      </div>
    </div>
  );
};

export default CaseStudy;
