import React from "react";
import { render, screen } from "@testing-library/react";
import ProgressMetricCard from "../ProgressMetricCard";
import ProgressStatusTag from "../ProgressStatusTag";
import { formatDate, parseApiDate } from "../ChapterHistoryModal";

describe("ProgressMetricCard", () => {
  it.each([
    [150, "100%"],
    [-5, "0%"],
    [null, "0%"],
    [42, "42%"],
  ])("clamps a %p percentage to %s in the ring", (percent, text) => {
    const { container } = render(
      <ProgressMetricCard
        label="Academy progress"
        value="x"
        percent={percent}
      />
    );
    expect(container.querySelector(".ant-progress-text")).toHaveTextContent(
      text
    );
  });
});

describe("ProgressStatusTag", () => {
  it.each([
    ["Completed", "academy-status-tag--completed"],
    ["In progress", "academy-status-tag--in-progress"],
    ["Not started", "academy-status-tag--not-started"],
  ])("styles %s", (status, className) => {
    render(<ProgressStatusTag status={status} />);
    expect(screen.getByText(status)).toHaveClass(className);
  });

  it("falls back to Not started for a missing status", () => {
    render(<ProgressStatusTag />);
    expect(screen.getByText("Not started")).toHaveClass(
      "academy-status-tag--not-started"
    );
  });
});

describe("history dates", () => {
  it("reads zone-less API timestamps as UTC", () => {
    expect(parseApiDate("2026-11-10T23:30:00").toISOString()).toBe(
      "2026-11-10T23:30:00.000Z"
    );
    expect(parseApiDate("2026-11-10T23:30:00+05:30").toISOString()).toBe(
      "2026-11-10T18:00:00.000Z"
    );
    expect(parseApiDate("2026-11-10T23:30:00Z").toISOString()).toBe(
      "2026-11-10T23:30:00.000Z"
    );
  });

  it("formats dates and shows a dash when missing", () => {
    expect(formatDate("2026-11-10T12:00:00")).toBe("10 Nov 2026");
    expect(formatDate(null)).toBe("—");
  });
});
