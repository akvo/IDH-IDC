import React, { useMemo } from "react";
import { Checkbox, Select, Tag } from "antd";
import { commodityNameOptions } from "../../../store/static";

// Fixed commodity list with a checkbox per option; selected commodities
// show as tags that can be removed while editing. Saved values missing
// from the list stay selectable so nothing is lost.
const CommodityTagSelector = ({
  value = [],
  onChange,
  disabled = false,
  ...rest
}) => {
  const selected = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  const options = useMemo(() => {
    const names = commodityNameOptions.map((option) => option.value);
    const legacy = selected.filter((item) => !names.includes(item));
    return [...legacy, ...names].map((name) => ({
      value: name,
      label: (
        <Checkbox checked={selected.includes(name)} tabIndex={-1}>
          {name}
        </Checkbox>
      ),
    }));
  }, [selected]);

  return (
    <Select
      {...rest}
      mode="multiple"
      value={selected}
      onChange={onChange}
      disabled={disabled}
      options={options}
      optionLabelProp="value"
      optionFilterProp="value"
      menuItemSelectedIcon={null}
      showSearch
      placeholder="Select commodities"
      className="commodity-tag-selector"
      popupClassName="commodity-tag-selector-dropdown"
      data-testid="commodity-tag-selector"
      tagRender={({ value: item, closable, onClose }) => (
        <Tag
          closable={closable && !disabled}
          onClose={onClose}
          onMouseDown={(e) => {
            // Keep the dropdown closed when removing a tag
            e.preventDefault();
            e.stopPropagation();
          }}
          className="commodity-tag"
          data-testid={`commodity-tag-${item}`}
        >
          {item}
        </Tag>
      )}
    />
  );
};

export default CommodityTagSelector;
