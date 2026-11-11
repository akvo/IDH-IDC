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
  isRequestCancelled: (error) => Boolean(error?.__CANCEL__),
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
      chapter_number: page,
      module_id: 11,
      module_order_index: 1,
      module_title: "Module title 1",
      estimated_minutes: 5,
      status: "In progress",
      last_opened_at: "2026-11-10T10:00:00Z",
      completed_at: null,
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

// A pending request the test settles by hand; rejects like axios when aborted
const deferred = (signal) => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  signal?.addEventListener("abort", () => reject({ __CANCEL__: true }));
  return { promise, resolve, reject, signal };
};

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

  it("cancels the in-flight overview request on unmount", () => {
    let request;
    academyService.getOverview.mockImplementation(({ signal }) => {
      request = deferred(signal);
      return request.promise;
    });
    const { unmount } = renderPage();
    expect(request.signal.aborted).toBe(false);
    unmount();
    expect(request.signal.aborted).toBe(true);
  });

  describe("overlapping completion toggles", () => {
    let saves;
    let refreshes;

    const serverOverview = (statuses, chaptersCompleted) => {
      const base = buildOverview();
      return {
        ...base,
        metrics: { ...base.metrics, chapters_completed: chaptersCompleted },
        recently_opened: base.recently_opened.map((chapter) => ({
          ...chapter,
          status: statuses[chapter.id],
        })),
      };
    };

    beforeEach(async () => {
      saves = {};
      refreshes = [];
      academyService.updateChapterProgress.mockImplementation((id) => {
        saves[id] = deferred();
        return saves[id].promise;
      });
      await renderLoadedPage();
      academyService.getOverview.mockImplementation(({ signal }) => {
        const request = deferred(signal);
        refreshes.push(request);
        return request.promise;
      });
      // Tick 101 (In progress) and untick 104 (Completed) back to back
      fireEvent.click(getChapterCheckbox("Why living income matters"));
      fireEvent.click(getChapterCheckbox("Setting the baseline"));
    });

    it("keeps a pending tick when another chapter's refresh lands first", async () => {
      saves[101].resolve({});
      await waitFor(() => expect(refreshes).toHaveLength(1));

      // The server has saved 101 but not yet 104
      refreshes[0].resolve(
        serverOverview({ 101: "Completed", 104: "Completed" }, 7)
      );
      await screen.findByText("7 of 27");

      expect(getChapterCheckbox("Why living income matters")).toBeChecked();
      expect(getChapterCheckbox("Setting the baseline")).not.toBeChecked();
      expect(getChapterCheckbox("Setting the baseline")).toBeDisabled();
    });

    it("drops a superseded refresh so only the latest response is shown", async () => {
      saves[101].resolve({});
      await waitFor(() => expect(refreshes).toHaveLength(1));
      saves[104].resolve({});
      await waitFor(() => expect(refreshes).toHaveLength(2));

      expect(refreshes[0].signal.aborted).toBe(true);
      // A late response for the aborted request must not win
      refreshes[0].resolve(
        serverOverview({ 101: "Completed", 104: "Completed" }, 7)
      );
      refreshes[1].resolve(
        serverOverview({ 101: "Completed", 104: "In progress" }, 6)
      );

      await waitFor(() =>
        expect(getChapterCheckbox("Setting the baseline")).toBeEnabled()
      );
      expect(screen.getByText("6 of 27")).toBeInTheDocument();
      expect(screen.queryByText("7 of 27")).not.toBeInTheDocument();
      expect(getChapterCheckbox("Why living income matters")).toBeChecked();
      expect(getChapterCheckbox("Setting the baseline")).not.toBeChecked();
    });
  });

  describe("reading history", () => {
    const openHistory = async () => {
      await renderLoadedPage();
      fireEvent.click(screen.getByRole("button", { name: "View history" }));
      const dialog = await screen.findByRole("dialog");
      await within(dialog).findByText("History chapter page 1");
      return dialog;
    };

    const historyCheckbox = (dialog, title) =>
      within(
        within(dialog)
          .getByText(title)
          .closest("[data-testid='academy-chapter-row']")
      ).getByRole("checkbox");

    it("lists the first page of opened chapters as chapter rows", async () => {
      const dialog = await openHistory();
      expect(
        within(dialog).getByRole("heading", { name: "Recently opened" })
      ).toBeInTheDocument();
      expect(academyService.getHistory).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, pageSize: 10 })
      );
      const row = within(dialog).getByTestId("academy-chapter-row");
      expect(within(row).getByText("01")).toBeInTheDocument();
      expect(within(row).getByText("In progress")).toBeInTheDocument();
      expect(
        within(row).getByRole("link", { name: "History chapter page 1" })
      ).toHaveAttribute("href", "/academy/courses?chapter=100");
    });

    it("requests the next page from the pagination", async () => {
      const dialog = await openHistory();
      fireEvent.click(within(dialog).getByTitle("2"));

      expect(
        await within(dialog).findByText("History chapter page 2")
      ).toBeInTheDocument();
      expect(academyService.getHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, pageSize: 10 })
      );
    });

    it("hides the pagination when everything fits on one page", async () => {
      academyService.getHistory.mockResolvedValue(historyPage(1, 3));
      const dialog = await openHistory();
      expect(within(dialog).queryByTitle("2")).not.toBeInTheDocument();
    });

    it("saves a completion tick through the page and refreshes the KPIs", async () => {
      const dialog = await openHistory();
      fireEvent.click(historyCheckbox(dialog, "History chapter page 1"));

      expect(historyCheckbox(dialog, "History chapter page 1")).toBeChecked();
      expect(academyService.updateChapterProgress).toHaveBeenCalledWith(
        100,
        "completed"
      );
      await waitFor(() =>
        expect(academyService.getOverview).toHaveBeenCalledTimes(2)
      );
      expect(historyCheckbox(dialog, "History chapter page 1")).toBeEnabled();
      expect(historyCheckbox(dialog, "History chapter page 1")).toBeChecked();
    });

    it("reverts the tick in the modal when the save fails", async () => {
      jest.spyOn(message, "error").mockImplementation(() => {});
      academyService.updateChapterProgress.mockRejectedValue({
        status: 404,
        message: "Chapter not found",
      });
      const dialog = await openHistory();
      fireEvent.click(historyCheckbox(dialog, "History chapter page 1"));

      await waitFor(() =>
        expect(
          historyCheckbox(dialog, "History chapter page 1")
        ).not.toBeChecked()
      );
      expect(historyCheckbox(dialog, "History chapter page 1")).toBeEnabled();
      expect(message.error).toHaveBeenCalledWith("Chapter not found");
    });

    it("continues learning from the modal", async () => {
      const dialog = await openHistory();
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Continue learning" })
      );
      expect(location()).toHaveTextContent("/academy/courses?chapter=4");
    });

    it("closes with Cancel", async () => {
      const dialog = await openHistory();
      fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
    });

    it("shows the API error inside the modal", async () => {
      academyService.getHistory.mockRejectedValue({
        status: 403,
        message: "Not allowed",
      });
      await renderLoadedPage();
      fireEvent.click(screen.getByRole("button", { name: "View history" }));
      const dialog = await screen.findByRole("dialog");
      expect(
        await within(dialog).findByText("Not allowed")
      ).toBeInTheDocument();
      expect(
        within(dialog).queryByText("You haven't opened any chapters yet.")
      ).not.toBeInTheDocument();
    });

    it("shows an empty state without history", async () => {
      academyService.getHistory.mockResolvedValue({
        total: 0,
        page: 1,
        page_size: 10,
        total_pages: 0,
        data: [],
      });
      await renderLoadedPage();
      fireEvent.click(screen.getByRole("button", { name: "View history" }));
      const dialog = await screen.findByRole("dialog");
      expect(
        await within(dialog).findByText("You haven't opened any chapters yet.")
      ).toBeInTheDocument();
    });

    it("cancels a pending history request when the modal closes", async () => {
      let request;
      academyService.getHistory.mockImplementation(({ signal }) => {
        request = deferred(signal);
        return request.promise;
      });
      await renderLoadedPage();
      fireEvent.click(screen.getByRole("button", { name: "View history" }));
      const dialog = await screen.findByRole("dialog");
      fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
      expect(request.signal.aborted).toBe(true);
    });
  });
});
