import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProgressMetricCard from "../ProgressMetricCard";
import ProgressStatusTag from "../ProgressStatusTag";
import RoadmapModuleCard from "../RoadmapModuleCard";
import RecentlyOpenedChapterCard from "../RecentlyOpenedChapterCard";
import RoadmapCtaBanner from "../RoadmapCtaBanner";

describe("ProgressMetricCard", () => {
  it.each([
    [150, "100%"],
    [-5, "0%"],
    [null, "0%"],
    [NaN, "0%"],
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

  it("defaults omitted percent to 0% in the ring", () => {
    const { container } = render(
      <ProgressMetricCard label="Academy progress" value="x" />
    );
    expect(container.querySelector(".ant-progress-text")).toHaveTextContent(
      "0%"
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

describe("RoadmapModuleCard", () => {
  const baseModule = {
    id: 11,
    order_index: 2,
    title: "Measure actual income",
    description: "Collect farmer income data.",
    icon_theme: "green",
    progress_pct: 65,
    status: "In progress",
    tags: [{ id: 1, name: "Measurement" }],
  };

  it("renders module details, theme, tags, progress, and triggers onOpen", () => {
    const onOpen = jest.fn();
    const { container } = render(
      <RoadmapModuleCard module={baseModule} onOpen={onOpen} />
    );

    expect(screen.getByText("Module 2")).toBeInTheDocument();
    expect(screen.getByText("Measure actual income")).toBeInTheDocument();
    expect(screen.getByText("Collect farmer income data.")).toBeInTheDocument();
    expect(screen.getByText("#Measurement")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("65%")).toBeInTheDocument();
    expect(
      container.querySelector(".academy-module-icon--green")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Module 2 progress: 65%")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open module 2: Measure actual income",
      })
    );
    expect(onOpen).toHaveBeenCalledWith(baseModule);
  });

  it("falls back to blue icon theme and 0% when optional fields are missing", () => {
    const { container } = render(
      <RoadmapModuleCard
        module={{
          id: 12,
          order_index: 3,
          title: "Assess income gap",
          icon_theme: "unknown",
        }}
        onOpen={jest.fn()}
      />
    );

    expect(
      container.querySelector(".academy-module-icon--blue")
    ).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("Not started")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Topics" })).toBeNull();
  });
});

describe("RecentlyOpenedChapterCard", () => {
  const renderCard = (props) =>
    render(
      <MemoryRouter>
        <ul>
          <RecentlyOpenedChapterCard {...props} />
        </ul>
      </MemoryRouter>
    );

  it("renders chapter link, zero-padded number, status, and handles toggle", () => {
    const onToggleComplete = jest.fn();
    const chapter = {
      id: 101,
      chapter_number: 1,
      title: "Why living income matters",
      status: "In progress",
    };
    renderCard({ chapter, onToggleComplete, pending: false });

    expect(screen.getByText("01")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Why living income matters" })
    ).toHaveAttribute("href", "/academy/courses?chapter=101");
    expect(screen.getByText("In progress")).toBeInTheDocument();

    const checkbox = screen.getByRole("checkbox", {
      name: 'Mark "Why living income matters" as completed',
    });
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toBeEnabled();

    fireEvent.click(checkbox);
    expect(onToggleComplete).toHaveBeenCalledWith(chapter, true);
  });

  it("renders checked and disabled state when completed and pending", () => {
    const chapter = {
      id: 104,
      chapter_number: 12,
      title: "Setting the baseline",
      status: "Completed",
    };
    renderCard({ chapter, onToggleComplete: jest.fn(), pending: true });

    expect(screen.getByText("12")).toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox", {
      name: 'Mark "Setting the baseline" as not completed',
    });
    expect(checkbox).toBeChecked();
    expect(checkbox).toBeDisabled();
  });
});

describe("RoadmapCtaBanner", () => {
  it("renders copy and triggers onLearnMore when clicked", () => {
    const onLearnMore = jest.fn();
    render(<RoadmapCtaBanner onLearnMore={onLearnMore} />);

    expect(
      screen.getByRole("heading", {
        name: "Learn more about the living income roadmap",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Discover living income roadmap with IDH")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Learn more" }));
    expect(onLearnMore).toHaveBeenCalledTimes(1);
  });
});
