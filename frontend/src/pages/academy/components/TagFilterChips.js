import React from "react";

// A labelled row of pill buttons: the tag filter, matching tags, search
// suggestions and popular topics. `items` are { value, label }. With
// `selectable`, the item whose value equals `activeValue` is pressed.
const TagFilterChips = ({
  label,
  items,
  onSelect,
  selectable = false,
  activeValue = null,
}) => {
  const isToggle = selectable;
  return (
    <div className="academy-chip-row" role="group" aria-label={label}>
      <span className="academy-chip-row-label">{label}</span>
      {items.map(({ value, label: itemLabel }) => {
        const active = isToggle && value === activeValue;
        return (
          <button
            key={value ?? "all"}
            type="button"
            className={`academy-chip${active ? " academy-chip--active" : ""}`}
            aria-pressed={isToggle ? active : null}
            onClick={() => onSelect(value)}
          >
            {itemLabel}
          </button>
        );
      })}
    </div>
  );
};

export default TagFilterChips;
