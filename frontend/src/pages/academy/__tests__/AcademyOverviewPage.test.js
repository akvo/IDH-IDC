import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { message } from "antd";
import AcademyOverviewPage from "../AcademyOverviewPage";
import academyService from "../services/academy";

jest.mock("../services/academy", () => ({
  __esModule: true,
  default: {
    getOverview: jest.fn(),
    updateChapterProgress: jest.fn(),
    getHistory: jest.fn(),
  },
}));

const tags = [
  { id: 1, name: "Income measurement", slug: "income-measurement" },
  { id: 2, name: "Income gap", slug: "income-gap" },
];

const moduleStatuses = [
  ["Completed", 100],
  ["In progress", 10],
  ["Not started", 0],
  ["Not started", 0],
  ["Not started", 0],
  ["Not started", 0],
];

const buildOverview = (overrides = {}) => ({
  greeting_name: "Wayan Galih",
  continue_chapter_id: 4,
  metrics: {
    academy_progress_pct: 35,
    modules_completed: 2,
    total_modules: 6,
    modules_completed_pct: 33,
    chapters_completed: 6,
    total_chapters: 27,
    chapters_completed_pct: 22,
  },
  modules: moduleStatuses.map(([status, progress], index) => ({
    id: index + 11,
    order_index: index + 1,
    title: `Module title ${index + 1}`,
    description: "Establish a solid foundation to act on living income.",
    estimated_minutes: 30,
    icon_theme: index === 5 ? "unknown" : "blue",
    progress_pct: progress,
    status,
    tags,
  })),
  recently_opened: [
    {
      id: 101,
      module_id: 11,
      module_order_index: 1,
      module_title: "Module title 1",
      chapter_number: 1,
      title: "Why living income matters",
      estimated_minutes: 5,
      status: "In progress",
      last_opened_at: "2026-11-10T10:00:00Z",
      tags: [],
    },
    {
      id: 104,
      module_id: 11,
      module_order_index: 1,
      module_title: "Module title 1",
      chapter_number: 4,
      title: "Setting the baseline",
      estimated_minutes: 5,
      status: "Completed",
      last_opened_at: "2026-11-09T10:00:00Z",
      tags: [],
    },
  ],
  ...overrides,
});

const historyPage = (page, total = 12) => ({
  total,
  page,
  page_size: 10,
  total_pages: Math.ceil(total / 10),
  data: [
    {
      chapter_id: page * 100,
      chapter_title: `History chapter page ${page}`,
      chapter_number: 1,
      module_id: 11,
      module_order_index: 1,
      module_title: "Module title 1",
      estimated_minutes: 5,
      status: "Completed",
      last_opened_at: "2026-11-10T10:00:00Z",
      completed_at: page === 1 ? "2026-11-11T09:00:00Z" : null,
    },
  ],
});

const LocationDisplay = () => {
  const location = useLocation();
  return (
    <div data-testid="location">
      {`${location.pathname}${location.search}${location.hash}`}
    </div>
  );
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/academy/overview"]}>
      <Routes>
        <Route path="*" element={<AcademyOverviewPage />} />
      </Routes>
      <LocationDisplay />
    </MemoryRouter>
  );

const renderLoadedPage = async () => {
  renderPage();
  await screen.findByTestId("academy-overview");
};

const location = () => screen.getByTestId("location");

const getChapterCheckbox = (title) =>
  within(
    screen.getByText(title).closest("[data-testid='academy-chapter-row']")
  ).getByRole("checkbox");

describe("AcademyOverviewPage", () => {
  beforeEach(() => {
    academyService.getOverview.mockResolvedValue(buildOverview());
    academyService.updateChapterProgress.mockResolvedValue({});
    academyService.getHistory.mockImplementation(({ page }) =>
      Promise.resolve(historyPage(page))
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it("shows a skeleton while the overview loads", async () => {
    renderPage();
    expect(screen.getByTestId("academy-overview-loading")).toBeInTheDocument();
    await screen.findByTestId("academy-overview");
  });

  it("greets the learner by first name", async () => {
    await renderLoadedPage();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /^Good (morning|afternoon|evening), Wayan$/,
      })
    ).toBeInTheDocument();
  });

  it("greets without a name when the API has none", async () => {
    academyService.getOverview.mockResolvedValue(
      buildOverview({ greeting_name: "" })
    );
    await renderLoadedPage();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /^Good (morning|afternoon|evening)$/,
      })
    ).toBeInTheDocument();
  });

  it("renders the three KPI cards", async () => {
    await renderLoadedPage();
    const cards = screen.getAllByTestId("academy-metric-card");
    expect(cards.map((card) => card.textContent)).toEqual([
      expect.stringContaining("Academy progress35%"),
      expect.stringContaining("Modules completed2/6"),
      expect.stringContaining("Chapters completed6 of 27"),
    ]);
  });

  it("renders the six roadmap modules with status, tags and progress", async () => {
    await renderLoadedPage();
    const cards = screen.getAllByTestId("academy-module-card");
    expect(cards).toHaveLength(6);

    const first = within(cards[0]);
    expect(first.getByText("Module 1")).toBeInTheDocument();
    expect(first.getByText("Completed")).toBeInTheDocument();
    expect(first.getByText("#Income measurement")).toBeInTheDocument();
    expect(first.getByText("100%")).toBeInTheDocument();
    expect(within(cards[1]).getByText("In progress")).toBeInTheDocument();
    // Unknown icon themes fall back to blue
    expect(
      cards[5].querySelector(".academy-module-icon--blue")
    ).toBeInTheDocument();
  });

  it("opens a module from its arrow button", async () => {
    await renderLoadedPage();
    fireEvent.click(
      screen.getByRole("button", { name: "Open module 2: Module title 2" })
    );
    expect(location()).toHaveTextContent("/academy/courses?module=12");
  });

  it("continues learning from the recommended chapter", async () => {
    await renderLoadedPage();
    fireEvent.click(screen.getByRole("button", { name: "Continue learning" }));
    expect(location()).toHaveTextContent("/academy/courses?chapter=4");
  });

  it("falls back to the course overview without a recommended chapter", async () => {
    academyService.getOverview.mockResolvedValue(
      buildOverview({ continue_chapter_id: null })
    );
    await renderLoadedPage();
    fireEvent.click(screen.getByRole("button", { name: "Continue learning" }));
    expect(location()).toHaveTextContent(/^\/academy\/courses$/);
  });

  it("links to the full course overview", async () => {
    await renderLoadedPage();
    fireEvent.click(
      screen.getByRole("button", { name: "Full course overview" })
    );
    expect(location()).toHaveTextContent(/^\/academy\/courses$/);
  });

  it("sends Learn more to the roadmap on the landing page", async () => {
    await renderLoadedPage();
    fireEvent.click(screen.getByRole("button", { name: "Learn more" }));
    expect(location()).toHaveTextContent("/academy#academy-roadmap");
  });

  it("lists recently opened chapters with links to the reader", async () => {
    await renderLoadedPage();
    const rows = screen.getAllByTestId("academy-chapter-row");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("01")).toBeInTheDocument();
    expect(
      within(rows[0]).getByRole("link", { name: "Why living income matters" })
    ).toHaveAttribute("href", "/academy/courses?chapter=101");
    expect(getChapterCheckbox("Why living income matters")).not.toBeChecked();
    expect(getChapterCheckbox("Setting the baseline")).toBeChecked();
  });

  it("shows an empty message when no chapters were opened", async () => {
    academyService.getOverview.mockResolvedValue(
      buildOverview({ recently_opened: [] })
    );
    await renderLoadedPage();
    expect(
      screen.getByText(/haven't opened any chapters yet/i)
    ).toBeInTheDocument();
  });

  it("marks a chapter complete optimistically and refreshes the KPIs", async () => {
    let resolveUpdate;
    academyService.updateChapterProgress.mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      })
    );
    await renderLoadedPage();

    fireEvent.click(getChapterCheckbox("Why living income matters"));

    // Ticked and locked before the API answers
    expect(getChapterCheckbox("Why living income matters")).toBeChecked();
    expect(getChapterCheckbox("Why living income matters")).toBeDisabled();
    expect(academyService.updateChapterProgress).toHaveBeenCalledWith(
      101,
      "completed"
    );

    academyService.getOverview.mockResolvedValue(
      buildOverview({
        metrics: { ...buildOverview().metrics, chapters_completed: 7 },
      })
    );
    resolveUpdate({});

    await screen.findByText("7 of 27");
    expect(academyService.getOverview).toHaveBeenCalledTimes(2);
    expect(getChapterCheckbox("Why living income matters")).toBeEnabled();
  });

  it("moves an unticked chapter back to in progress", async () => {
    await renderLoadedPage();
    fireEvent.click(getChapterCheckbox("Setting the baseline"));
    expect(academyService.updateChapterProgress).toHaveBeenCalledWith(
      104,
      "in_progress"
    );
    await waitFor(() =>
      expect(academyService.getOverview).toHaveBeenCalledTimes(2)
    );
  });

  it("reverts the toggle and shows the API message on a 4xx error", async () => {
    const errorToast = jest
      .spyOn(message, "error")
      .mockImplementation(() => {});
    academyService.updateChapterProgress.mockRejectedValue({
      status: 404,
      message: "Chapter not found",
    });
    await renderLoadedPage();

    fireEvent.click(getChapterCheckbox("Why living income matters"));

    await waitFor(() =>
      expect(getChapterCheckbox("Why living income matters")).not.toBeChecked()
    );
    expect(errorToast).toHaveBeenCalledWith("Chapter not found");
    expect(getChapterCheckbox("Why living income matters")).toBeEnabled();
    expect(academyService.getOverview).toHaveBeenCalledTimes(1);
  });

  it("reverts without a second toast on server errors", async () => {
    const errorToast = jest
      .spyOn(message, "error")
      .mockImplementation(() => {});
    academyService.updateChapterProgress.mockRejectedValue({
      status: 500,
      message: "Server error",
    });
    await renderLoadedPage();

    fireEvent.click(getChapterCheckbox("Why living income matters"));

    await waitFor(() =>
      expect(getChapterCheckbox("Why living income matters")).toBeEnabled()
    );
    expect(getChapterCheckbox("Why living income matters")).not.toBeChecked();
    expect(errorToast).not.toHaveBeenCalled();
  });

  it("keeps the current KPIs when the background refresh fails", async () => {
    await renderLoadedPage();
    academyService.getOverview.mockRejectedValue({ message: "Offline" });

    fireEvent.click(getChapterCheckbox("Why living income matters"));

    await waitFor(() =>
      expect(academyService.getOverview).toHaveBeenCalledTimes(2)
    );
    expect(screen.getByTestId("academy-overview")).toBeInTheDocument();
    expect(screen.getByText("6 of 27")).toBeInTheDocument();
  });

  it("shows an error with a retry when the overview fails to load", async () => {
    academyService.getOverview.mockRejectedValueOnce({
      status: 500,
      message: "Something went wrong. Please try again.",
    });
    renderPage();

    expect(
      await screen.findByText("We couldn't load your overview")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await screen.findByTestId("academy-overview");
    expect(academyService.getOverview).toHaveBeenCalledTimes(2);
  });

  it("does not update state after unmounting", async () => {
    let resolveOverview;
    academyService.getOverview.mockReturnValue(
      new Promise((resolve) => {
        resolveOverview = resolve;
      })
    );
    const errorSpy = jest.spyOn(console, "error");
    const { unmount } = renderPage();
    unmount();
    resolveOverview(buildOverview());
    await Promise.resolve();
    expect(errorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("unmounted component")
    );
  });

  describe("reading history", () => {
    const openHistory = async () => {
      await renderLoadedPage();
      fireEvent.click(screen.getByRole("button", { name: "View history" }));
      return screen.findByRole("dialog");
    };

    it("loads the first page when View history is clicked", async () => {
      const dialog = await openHistory();
      expect(within(dialog).getByText("Reading history")).toBeInTheDocument();
      expect(
        await within(dialog).findByText("History chapter page 1")
      ).toBeInTheDocument();
      expect(academyService.getHistory).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
      });
      expect(
        within(dialog).getByText("Module 1 · Module title 1")
      ).toBeInTheDocument();
      expect(within(dialog).getByText("10 Nov 2026")).toBeInTheDocument();
      expect(within(dialog).getByText("11 Nov 2026")).toBeInTheDocument();
    });

    it("requests the next page from the pagination", async () => {
      const dialog = await openHistory();
      await within(dialog).findByText("History chapter page 1");

      fireEvent.click(within(dialog).getByTitle("2"));

      expect(
        await within(dialog).findByText("History chapter page 2")
      ).toBeInTheDocument();
      expect(academyService.getHistory).toHaveBeenLastCalledWith({
        page: 2,
        pageSize: 10,
      });
      // Not completed yet
      expect(within(dialog).getByText("—")).toBeInTheDocument();
    });

    it("shows the API error inside the modal", async () => {
      academyService.getHistory.mockRejectedValue({
        status: 403,
        message: "Not allowed",
      });
      const dialog = await openHistory();
      expect(
        await within(dialog).findByText("Not allowed")
      ).toBeInTheDocument();
    });

    it("shows an empty state without history", async () => {
      academyService.getHistory.mockResolvedValue({
        total: 0,
        page: 1,
        page_size: 10,
        total_pages: 0,
        data: [],
      });
      const dialog = await openHistory();
      expect(
        await within(dialog).findByText("You haven't opened any chapters yet.")
      ).toBeInTheDocument();
    });

    it("closes the modal", async () => {
      await openHistory();
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
    });
  });
});
