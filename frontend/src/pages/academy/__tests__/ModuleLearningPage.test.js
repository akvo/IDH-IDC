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

const buildModules = ({ chapters = chapterTitles } = {}) => ({
  total_modules: 2,
  modules: [
    {
      id: 11,
      order_index: 1,
      title: "The concept of living income",
      estimated_minutes: 30,
      chapters: chapters.map((title, index) => ({
        id: 101 + index,
        chapter_number: index + 1,
        title,
        estimated_minutes: 5,
        status: "Not started",
      })),
    },
    { id: 12, order_index: 2, title: "Second module", chapters: [] },
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
const title = () => screen.getByRole("heading", { level: 1 });

describe("ModuleLearningPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    academyService.getModules.mockResolvedValue(buildModules());
    academyService.updateChapterProgress.mockResolvedValue({});
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

  it("completes the chapter and moves on with Next step", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Next step" }));

    expect(academyService.updateChapterProgress).toHaveBeenCalledWith(
      101,
      "completed"
    );
    expect(location()).toHaveTextContent("/academy/modules/11?chapter=102");
    expect(title()).toHaveTextContent("Defining the benchmark");
  });

  it("moves on without saving progress with Skip", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Skip" }));

    expect(academyService.updateChapterProgress).not.toHaveBeenCalled();
    expect(location()).toHaveTextContent("?chapter=102");
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
    expect(academyService.updateChapterProgress).toHaveBeenCalledWith(
      103,
      "completed"
    );
    expect(location()).toHaveTextContent("/academy/overview");
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

    await waitFor(() =>
      expect(academyService.updateChapterProgress).toHaveBeenCalled()
    );
    await Promise.resolve();
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
