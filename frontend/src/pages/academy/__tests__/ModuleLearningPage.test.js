import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { message } from "antd";
import ModuleLearningPage from "../ModuleLearningPage";
import academyService from "../services/academy";

jest.mock("../services/academy", () => ({
  __esModule: true,
  isRequestCancelled: (error) => Boolean(error?.__CANCEL__),
  default: {
    getModules: jest.fn(),
    updateChapterProgress: jest.fn(),
  },
}));

const chapterTitles = [
  "Why living income matters",
  "Defining the benchmark",
  "Measuring actual income",
];

const buildModules = ({ chapters = chapterTitles, statuses = {} } = {}) => ({
  total_modules: 2,
  course_summary_html: "<p>Course summary</p>",
  modules: [
    {
      id: 11,
      order_index: 1,
      title: "The concept of living income",
      description: "Understand what a living income means.",
      estimated_minutes: 30,
      icon_theme: "blue",
      progress_pct: 0,
      status: "Not started",
      tags: [{ id: 1, name: "Living income", slug: "living-income" }],
      chapters: chapters.map((title, index) => ({
        id: 101 + index,
        chapter_number: index + 1,
        title,
        estimated_minutes: 5,
        status: statuses[101 + index] || "Not started",
        tags: [],
      })),
    },
    {
      id: 12,
      order_index: 2,
      title: "Second module",
      description: "Second module description.",
      estimated_minutes: 20,
      icon_theme: "green",
      progress_pct: 0,
      status: "Not started",
      tags: [],
      chapters: [],
    },
  ],
});

const LocationDisplay = () => {
  const location = useLocation();
  return (
    <div data-testid="location">{`${location.pathname}${location.search}`}</div>
  );
};

const renderPage = (path = "/academy/modules/11") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/academy/modules/:moduleId"
          element={
            <>
              <ModuleLearningPage />
              <LocationDisplay />
            </>
          }
        />
        <Route path="*" element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>
  );

const location = () => screen.getByTestId("location");

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const saveResponse = (id, status) => ({
  chapter_id: id,
  status: status === "completed" ? "Completed" : "In progress",
  last_opened_at: "2026-11-10T10:00:00Z",
  completed_at: status === "completed" ? "2026-11-10T10:05:00Z" : null,
  module_id: 11,
  module_progress_pct: status === "completed" ? 33 : 0,
  module_status: "In progress",
  course_progress_pct: status === "completed" ? 10 : 0,
  modules_completed: 0,
  chapters_completed: status === "completed" ? 1 : 0,
});

// Completion saves carry no options; view records pass { markOpened: true }
const completionCalls = () =>
  academyService.updateChapterProgress.mock.calls.filter(
    (call) => call.length === 2
  );
const viewCall = (id, status) => [id, status, { markOpened: true }];
const title = () => screen.getByRole("heading", { level: 1 });

describe("ModuleLearningPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    academyService.getModules.mockResolvedValue(buildModules());
    academyService.updateChapterProgress.mockImplementation((id, status) =>
      Promise.resolve(saveResponse(id, status))
    );
  });

  it("shows a skeleton while the module loads", async () => {
    renderPage();
    expect(
      screen.getByTestId("academy-module-learning-loading")
    ).toBeInTheDocument();
    expect(await screen.findByRole("heading", { level: 1 })).toBeVisible();
  });

  it("opens the first chapter with breadcrumb and placeholder content", async () => {
    renderPage();

    expect(
      await screen.findByText("Why living income matters", {
        selector: "h1",
      })
    ).toBeInTheDocument();
    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(breadcrumb).toHaveTextContent("Course overview");
    expect(breadcrumb).toHaveTextContent(
      "Module 1 · The concept of living income"
    );
    expect(screen.getByText(/being prepared/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Back to the overview" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Chapter 1 of 3/ })
    ).toHaveAttribute("aria-current", "step");
  });

  it("opens the chapter given in the URL", async () => {
    renderPage("/academy/modules/11?chapter=102");
    await waitFor(() => expect(title()).toHaveTextContent("Defining"));
    expect(screen.getByRole("button", { name: "Previous" })).toBeVisible();
  });

  it("falls back to the first chapter for an unknown chapter id", async () => {
    renderPage("/academy/modules/11?chapter=999");
    await waitFor(() => expect(title()).toHaveTextContent("Why living"));
  });

  it("records the opened chapter as viewed", async () => {
    renderPage();
    await waitFor(() =>
      expect(academyService.updateChapterProgress).toHaveBeenCalledWith(
        ...viewCall(101, "in_progress")
      )
    );
  });

  it("keeps a completed chapter completed when recording its view", async () => {
    academyService.getModules.mockResolvedValue(
      buildModules({ statuses: { 101: "Completed" } })
    );
    renderPage();
    await waitFor(() =>
      expect(academyService.updateChapterProgress).toHaveBeenCalledWith(
        ...viewCall(101, "completed")
      )
    );
  });

  it("completes the chapter and moves on with Next step", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Next step" }));

    await waitFor(() =>
      expect(location()).toHaveTextContent("/academy/modules/11?chapter=102")
    );
    expect(completionCalls()).toEqual([[101, "completed"]]);
    expect(title()).toHaveTextContent("Defining the benchmark");
    await waitFor(() =>
      expect(academyService.updateChapterProgress).toHaveBeenCalledWith(
        ...viewCall(102, "in_progress")
      )
    );
  });

  it("sends completed when revisiting a chapter completed on this page", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Next step" }));
    await waitFor(() => expect(location()).toHaveTextContent("?chapter=102"));
    academyService.updateChapterProgress.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    await waitFor(() =>
      expect(academyService.updateChapterProgress).toHaveBeenCalledWith(
        ...viewCall(101, "completed")
      )
    );
  });

  it("locks the footer until the save lands, then moves on", async () => {
    const save = deferred();
    renderPage();
    const next = await screen.findByRole("button", { name: "Next step" });
    academyService.updateChapterProgress.mockReturnValueOnce(save.promise);

    fireEvent.click(next);
    await waitFor(() => expect(completionCalls()).toHaveLength(1));
    expect(next).toHaveClass("ant-btn-loading");
    expect(screen.getByRole("button", { name: "Skip" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Back to the overview" })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Chapter 2 of 3/ })
    ).toBeDisabled();
    fireEvent.click(next);
    expect(completionCalls()).toHaveLength(1);
    expect(location()).toHaveTextContent("/academy/modules/11");
    expect(location()).not.toHaveTextContent("chapter=102");

    save.resolve(saveResponse(101, "completed"));
    await waitFor(() => expect(location()).toHaveTextContent("?chapter=102"));
  });

  it("waits for the chapter's view record before completing it", async () => {
    const view = deferred();
    academyService.updateChapterProgress.mockReturnValueOnce(view.promise);
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Next step" }));
    await Promise.resolve();
    expect(completionCalls()).toHaveLength(0);

    view.resolve(saveResponse(101, "in_progress"));
    await waitFor(() =>
      expect(completionCalls()).toEqual([[101, "completed"]])
    );
  });

  it("still completes and advances with Next step if recording the view fails", async () => {
    const view = deferred();
    academyService.updateChapterProgress.mockReturnValueOnce(view.promise);
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Next step" }));
    view.reject({ status: 500, message: "Boom" });

    await waitFor(() =>
      expect(location()).toHaveTextContent("/academy/modules/11?chapter=102")
    );
    expect(completionCalls()).toEqual([[101, "completed"]]);
  });

  it("does not pull the learner back when they leave during a save", async () => {
    const save = deferred();
    renderPage();
    const next = await screen.findByRole("button", { name: "Next step" });
    await waitFor(() =>
      expect(academyService.updateChapterProgress).toHaveBeenCalledTimes(1)
    );
    academyService.updateChapterProgress.mockReturnValueOnce(save.promise);

    fireEvent.click(next);
    await waitFor(() => expect(completionCalls()).toHaveLength(1));
    fireEvent.click(screen.getByRole("link", { name: "Course overview" }));
    expect(location()).toHaveTextContent("/academy/courses");

    save.resolve(saveResponse(101, "completed"));
    await Promise.resolve();
    await Promise.resolve();
    expect(location()).toHaveTextContent("/academy/courses");
  });

  it("suppresses client error toasts when a save rejects after leaving", async () => {
    const error = jest.spyOn(message, "error").mockImplementation(() => {});
    const save = deferred();
    renderPage();
    const next = await screen.findByRole("button", { name: "Next step" });
    await waitFor(() =>
      expect(academyService.updateChapterProgress).toHaveBeenCalledTimes(1)
    );
    academyService.updateChapterProgress.mockReturnValueOnce(save.promise);

    fireEvent.click(next);
    await waitFor(() => expect(completionCalls()).toHaveLength(1));
    fireEvent.click(screen.getByRole("link", { name: "Course overview" }));
    expect(location()).toHaveTextContent("/academy/courses");

    save.reject({ status: 404, message: "Chapter not found" });
    await Promise.resolve();
    await Promise.resolve();
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("moves on and records the next view without completing on Skip", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Skip" }));

    expect(location()).toHaveTextContent("?chapter=102");
    await waitFor(() =>
      expect(academyService.updateChapterProgress).toHaveBeenCalledWith(
        ...viewCall(102, "in_progress")
      )
    );
    expect(completionCalls()).toHaveLength(0);
  });

  it("goes back a step with Previous", async () => {
    renderPage("/academy/modules/11?chapter=102");
    fireEvent.click(await screen.findByRole("button", { name: "Previous" }));
    expect(location()).toHaveTextContent("?chapter=101");
  });

  it("jumps to a chapter from the step dots", async () => {
    renderPage();
    fireEvent.click(
      await screen.findByRole("button", { name: /Chapter 3 of 3/ })
    );
    expect(location()).toHaveTextContent("?chapter=103");
  });

  it("returns to the overview from the first step", async () => {
    renderPage();
    fireEvent.click(
      await screen.findByRole("button", { name: "Back to the overview" })
    );
    expect(location()).toHaveTextContent("/academy/overview");
  });

  it("finishes the module on the last step", async () => {
    renderPage("/academy/modules/11?chapter=103");
    const finish = await screen.findByRole("button", {
      name: "Finish module",
    });
    expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();

    fireEvent.click(finish);
    // Only after the save, so the overview loads the new KPIs
    expect(location()).toHaveTextContent("/academy/modules/11");
    await waitFor(() =>
      expect(location()).toHaveTextContent("/academy/overview")
    );
    expect(completionCalls()).toEqual([[103, "completed"]]);
  });

  it("waits for the completion save before navigating on Finish module", async () => {
    const save = deferred();
    renderPage("/academy/modules/11?chapter=103");
    const finish = await screen.findByRole("button", {
      name: "Finish module",
    });
    await waitFor(() =>
      expect(academyService.updateChapterProgress).toHaveBeenCalledWith(
        ...viewCall(103, "in_progress")
      )
    );
    academyService.updateChapterProgress.mockReturnValueOnce(save.promise);

    fireEvent.click(finish);
    await waitFor(() => expect(completionCalls()).toHaveLength(1));
    expect(finish).toHaveClass("ant-btn-loading");
    expect(location()).toHaveTextContent("/academy/modules/11?chapter=103");

    save.resolve(saveResponse(103, "completed"));
    await waitFor(() =>
      expect(location()).toHaveTextContent("/academy/overview")
    );
  });

  it("renders Back to the overview and Finish module without Skip for a single-chapter module", async () => {
    academyService.getModules.mockResolvedValue(
      buildModules({ chapters: ["Only chapter"] })
    );
    renderPage();

    const finish = await screen.findByRole("button", {
      name: "Finish module",
    });
    expect(
      screen.getByRole("button", { name: "Back to the overview" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();

    fireEvent.click(finish);
    await waitFor(() =>
      expect(location()).toHaveTextContent("/academy/overview")
    );
    expect(completionCalls()).toEqual([[101, "completed"]]);
  });

  it("shows a client error from saving progress", async () => {
    const error = jest.spyOn(message, "error").mockImplementation(() => {});
    academyService.updateChapterProgress.mockRejectedValue({
      status: 404,
      message: "Chapter not found",
    });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Next step" }));

    await waitFor(() =>
      expect(error).toHaveBeenCalledWith("Chapter not found")
    );
    // Stays on the step so the learner can try again
    expect(location()).not.toHaveTextContent("chapter=102");
    expect(screen.getByRole("button", { name: "Next step" })).toBeEnabled();
    error.mockRestore();
  });

  it("leaves server errors from saving to the global toast", async () => {
    const error = jest.spyOn(message, "error").mockImplementation(() => {});
    academyService.updateChapterProgress.mockRejectedValue({
      status: 500,
      message: "Boom",
    });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Next step" }));

    await waitFor(() => expect(completionCalls()).toHaveLength(1));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Next step" })).not.toHaveClass(
        "ant-btn-loading"
      )
    );
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("shows not found for an unknown module", async () => {
    renderPage("/academy/modules/999");
    expect(await screen.findByText("Module not found")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("shows an empty state for a module without chapters", async () => {
    renderPage("/academy/modules/12");
    expect(
      await screen.findByText("This module has no chapters yet")
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Back to the overview" })
    );
    expect(location()).toHaveTextContent("/academy/overview");
  });

  it("shows the error and retries", async () => {
    academyService.getModules
      .mockRejectedValueOnce({ status: null, message: "Network Error" })
      .mockResolvedValueOnce(buildModules());
    renderPage();

    expect(
      await screen.findByText("We couldn't load this module")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(title()).toHaveTextContent("Why living"));
    expect(academyService.getModules).toHaveBeenCalledTimes(2);
  });

  it("cancels the request when leaving the page", () => {
    let signal;
    academyService.getModules.mockImplementation((options) => {
      signal = options.signal;
      return new Promise((resolve, reject) =>
        signal.addEventListener("abort", () => reject({ __CANCEL__: true }))
      );
    });
    const { unmount } = renderPage();

    unmount();
    expect(signal.aborted).toBe(true);
  });
});
