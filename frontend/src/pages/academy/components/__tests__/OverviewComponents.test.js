import React from "react";
import { render, screen } from "@testing-library/react";
import ProgressMetricCard from "../ProgressMetricCard";
import ProgressStatusTag from "../ProgressStatusTag";

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
