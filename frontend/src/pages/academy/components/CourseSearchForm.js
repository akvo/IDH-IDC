import React, { memo, useEffect, useState } from "react";
import { Button, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";

// Search box with its own draft state, so typing re-renders only the form
// and not the module list. `onSearch` runs on submit, and with "" when the
// box is cleared while a search is applied.
const CourseSearchForm = ({ search, onSearch }) => {
  const [draft, setDraft] = useState(search);

  // Keep the box in step with the URL (browser back/forward, chip clicks)
  useEffect(() => setDraft(search), [search]);

  return (
    <form
      className="academy-course-search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(draft.trim());
      }}
    >
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="Search modules, chapters and tags..."
        aria-label="Search modules, chapters and tags"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          // Clearing the box (or its clear icon) shows the full course
          if (!event.target.value && search) {
            onSearch("");
          }
        }}
      />
      <Button htmlType="submit">Search</Button>
    </form>
  );
};

export default memo(CourseSearchForm);
