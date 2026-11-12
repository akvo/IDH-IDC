import React from "react";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Wraps case-insensitive matches of `highlight` in <mark>
const HighlightedText = ({ text = "", highlight }) => {
  const term = highlight?.trim();
  if (!term) {
    return text;
  }
  // A capturing group keeps the matches in the split result at odd indexes
  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, "gi"));
  return parts.map((part, index) =>
    index % 2 ? (
      <mark key={index} className="academy-highlight">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

export default HighlightedText;
