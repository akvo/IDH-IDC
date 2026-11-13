import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Button, Dropdown, Input, Tooltip } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { ACADEMY_TOOLTIP_CLASS } from "../utils";
// Figma toolbar icons; currentColor, so they follow the button's colour
import { ReactComponent as SortIcon } from "../../../assets/icons/academy/sort.svg";
import { ReactComponent as FilterIcon } from "../../../assets/icons/academy/filter-lines.svg";
import { ReactComponent as SearchIcon } from "../../../assets/icons/academy/search.svg";

const SEARCH_DEBOUNCE_MS = 300;

// Icon toolbar above the resources/glossary tables (Figma): sort, type
// filter and a search box that opens from its icon. The search draft is
// local and debounced, so typing re-renders only the toolbar and sends one
// request per pause rather than per keystroke.
const TableToolbar = ({
  search,
  onSearch,
  searchLabel,
  sortOptions,
  sortValue,
  onSort,
  typeOptions,
  typeValue,
  onType,
}) => {
  const [draft, setDraft] = useState(search);
  const [searchOpen, setSearchOpen] = useState(Boolean(search));
  const inputRef = useRef(null);
  // Only a click on the icon focuses the box, never a search from the URL
  const focusOnOpen = useRef(false);

  // Keep the box in step with the URL (tab switch, back/forward, clear).
  // A draft that already matches is kept as typed, so applying "road " as
  // `road` does not swallow the space the learner is still typing after.
  useEffect(() => {
    setDraft((current) => (current.trim() === search ? current : search));
    if (search) {
      setSearchOpen(true);
    }
  }, [search]);

  useEffect(() => {
    const term = draft.trim();
    if (term === search) {
      return;
    }
    const timer = setTimeout(() => onSearch(term), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, search, onSearch]);

  useEffect(() => {
    if (searchOpen && focusOnOpen.current) {
      focusOnOpen.current = false;
      inputRef.current?.focus();
    }
  }, [searchOpen]);

  // Stable menus: typing re-renders the toolbar, not the dropdowns' items
  const typeItems = useMemo(
    () => [{ key: "", label: "All types" }, ...typeOptions],
    [typeOptions]
  );
  const sortMenu = useMemo(
    () => ({
      items: sortOptions,
      selectable: true,
      selectedKeys: [sortValue],
      onClick: ({ key }) => onSort(key),
    }),
    [sortOptions, sortValue, onSort]
  );
  const typeMenu = useMemo(
    () => ({
      items: typeItems,
      selectable: true,
      selectedKeys: [typeValue || ""],
      onClick: ({ key }) => onType(key || null),
    }),
    [typeItems, typeValue, onType]
  );
  const activeSort = sortOptions.find(({ key }) => key === sortValue);
  const activeType = typeItems.find(({ key }) => key === (typeValue || ""));

  return (
    <div className="academy-table-toolbar">
      {searchOpen && (
        <Input
          ref={inputRef}
          allowClear
          className="academy-table-search"
          prefix={<SearchOutlined />}
          placeholder={searchLabel}
          aria-label={searchLabel}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Escape closes an empty box
            if (event.key === "Escape" && !draft) {
              setSearchOpen(false);
            }
          }}
        />
      )}
      <Dropdown trigger={["click"]} menu={sortMenu}>
        <Tooltip
          overlayClassName={ACADEMY_TOOLTIP_CLASS}
          title={`Sort: ${activeSort?.label}`}
        >
          <Button
            type="text"
            className="academy-toolbar-button"
            icon={
              <SortIcon
                className="anticon academy-toolbar-icon"
                aria-hidden="true"
              />
            }
            aria-label={`Sort, currently ${activeSort?.label}`}
          />
        </Tooltip>
      </Dropdown>
      <Dropdown trigger={["click"]} menu={typeMenu}>
        <Tooltip
          overlayClassName={ACADEMY_TOOLTIP_CLASS}
          title={`Type: ${activeType?.label}`}
        >
          <Button
            type="text"
            className={`academy-toolbar-button${
              typeValue ? " academy-toolbar-button--active" : ""
            }`}
            icon={
              <FilterIcon
                className="anticon academy-toolbar-icon"
                aria-hidden="true"
              />
            }
            aria-label={`Filter by type, currently ${activeType?.label}`}
          />
        </Tooltip>
      </Dropdown>
      <Tooltip
        overlayClassName={ACADEMY_TOOLTIP_CLASS}
        title={searchOpen ? "Close search" : "Search"}
      >
        <Button
          type="text"
          className={`academy-toolbar-button${
            search ? " academy-toolbar-button--active" : ""
          }`}
          icon={
            <SearchIcon
              className="anticon academy-toolbar-icon"
              aria-hidden="true"
            />
          }
          aria-label={searchOpen ? "Close search" : "Search"}
          aria-expanded={searchOpen}
          onClick={() => {
            if (!searchOpen) {
              focusOnOpen.current = true;
            } else {
              // Closing clears the search, so nothing stays filtered unseen
              setDraft("");
              if (search) {
                onSearch("");
              }
            }
            setSearchOpen((open) => !open);
          }}
        />
      </Tooltip>
    </div>
  );
};

export default memo(TableToolbar);
