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
import CourseOverviewPage from "../CourseOverviewPage";
import academyService from "../services/academy";

jest.mock("../services/academy", () => ({
  __esModule: true,
  isRequestCancelled: (error) => Boolean(error?.__CANCEL__),
  default: {
    getTags: jest.fn(),
    getModules: jest.fn(),
    getChapter: jest.fn(),
    getOverview: jest.fn(),
    updateChapterProgress: jest.fn(),
  },
}));

const tags = [
  {
    id: 1,
    name: "Income measurement",
    slug: "income-measurement",
    chapter_count: 2,
  },
  { id: 2, name: "Benchmark", slug: "benchmark", chapter_count: 9 },
  { id: 3, name: "Due diligence", slug: "due-diligence", chapter_count: 5 },
  { id: 4, name: "Gender", slug: "gender", chapter_count: 1 },
  { id: 5, name: "Procurement", slug: "procurement", chapter_count: 4 },
  { id: 6, name: "Income gap", slug: "income-gap", chapter_count: 7 },
];

const chapter = (id, number, title, status = "Not started") => ({
  id,
  chapter_number: number,
  title,
  estimated_minutes: 5,
  status,
  tags: [],
});

const buildCourse = (overrides = {}) => ({
  total_modules: 3,
  course_summary_html: "<p>Explore the living income roadmap.</p>",
  modules: [
    {
      id: 11,
      order_index: 1,
      title: "The concept of living income",
      estimated_minutes: 16,
      progress_pct: 100,
      status: "Completed",
      tags: [tags[1]],
      chapters: [chapter(101, 1, "Why living income matters", "Completed")],
    },
    {
      id: 12,
      order_index: 2,
      title: "Measuring & Analysis",
      estimated_minutes: 16,
      progress_pct: 50,
      status: "In progress",
      tags: [tags[0], tags[5]],
      chapters: [
        chapter(201, 1, "Measuring actual income", "Completed"),
        chapter(202, 2, "Choosing a living income benchmark", "In progress"),
      ],
    },
    {
      id: 13,
      order_index: 3,
      title: "Building the Business Case",
      estimated_minutes: 16,
      progress_pct: 0,
      status: "Not started",
      tags: [],
      chapters: [chapter(301, 1, "The business case")],
    },
  ],
  ...overrides,
});

const buildChapter = (overrides = {}) => ({
  id: 202,
  module_id: 12,
  module_title: "Measuring & Analysis",
  chapter_number: 2,
  title: "Choosing a living income benchmark",
  content_html:
    '<h2>Benchmarks</h2><p>Use a credible benchmark.</p><img src="x" onerror="window.__xss = true"><script>window.__xss = true</script>',
  estimated_minutes: 5,
  status: "In progress",
  tags: [],
  prev_chapter_id: 201,
  next_chapter_id: 301,
  ...overrides,
});

const progressResponse = (overrides = {}) => ({
  chapter_id: 202,
  status: "Completed",
  module_id: 12,
  module_progress_pct: 100,
  module_status: "Completed",
  course_progress_pct: 60,
  modules_completed: 2,
  chapters_completed: 3,
  ...overrides,
});

const deferred = (signal) => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  signal?.addEventListener("abort", () => reject({ __CANCEL__: true }));
  return { promise, resolve, reject };
};

const LocationDisplay = () => {
  const location = useLocation();
  return (
    <div data-testid="location">{`${location.pathname}${location.search}`}</div>
  );
};

const renderPage = (path = "/academy/courses") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/academy/courses"
          element={
            <>
              <CourseOverviewPage />
              <LocationDisplay />
            </>
          }
        />
        <Route path="*" element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>
  );

const renderLoadedPage = async (path) => {
  const view = renderPage(path);
  await screen.findAllByTestId("academy-module-accordion");
  return view;
};

const location = () => screen.getByTestId("location");
// Waits for the module request a URL change triggered
const settled = () =>
  waitFor(() =>
    expect(
      screen.queryByTestId("academy-courses-loading")
    ).not.toBeInTheDocument()
  );
// Titles can be split by search highlights, so match on textContent
const accordion = (title) =>
  screen
    .getAllByTestId("academy-module-accordion")
    .find(
      (section) =>
        section.querySelector(".academy-accordion-title").textContent === title
    );
const trigger = (title) =>
  accordion(title).querySelector(".academy-accordion-trigger");
const chapterCheckbox = (title) =>
  within(
    screen
      .getByRole("link", { name: title })
      .closest("[data-testid='academy-chapter-row']")
  ).getByRole("checkbox");
const search = (term) => {
  fireEvent.change(
    screen.getByRole("textbox", { name: "Search modules, chapters and tags" }),
    { target: { value: term } }
  );
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
};

describe("CourseOverviewPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    academyService.getTags.mockResolvedValue(tags);
    academyService.getModules.mockResolvedValue(buildCourse());
    academyService.getChapter.mockResolvedValue(buildChapter());
    academyService.getOverview.mockResolvedValue({ continue_chapter_id: 202 });
    academyService.updateChapterProgress.mockImplementation((id, status) =>
      Promise.resolve(
        progressResponse({
          chapter_id: id,
          status: status === "completed" ? "Completed" : "In progress",
        })
      )
    );
  });

  describe("full course", () => {
    it("shows a skeleton, then the summary, tags and modules", async () => {
      renderPage();
      expect(screen.getByTestId("academy-courses-loading")).toBeInTheDocument();

      expect(
        await screen.findByRole("heading", {
          name: "There are 3 modules in this course",
        })
      ).toBeInTheDocument();
      expect(
        screen.getByText("Explore the living income roadmap.")
      ).toBeInTheDocument();
      expect(screen.getAllByTestId("academy-module-accordion")).toHaveLength(3);
      expect(academyService.getModules).toHaveBeenCalledWith(
        expect.objectContaining({ search: "", tag: "" })
      );

      const filter = screen.getByRole("group", { name: "Browse by tag" });
      expect(
        within(filter).getByRole("button", { name: "All" })
      ).toHaveAttribute("aria-pressed", "true");
      expect(
        within(filter).getByRole("button", { name: "#Benchmark" })
      ).toHaveAttribute("aria-pressed", "false");
    });

    it("opens the first unfinished module with its chapters and Go link", async () => {
      await renderLoadedPage();

      expect(trigger("The concept of living income")).toHaveAttribute(
        "aria-expanded",
        "false"
      );
      expect(trigger("Measuring & Analysis")).toHaveAttribute(
        "aria-expanded",
        "true"
      );
      const open = within(accordion("Measuring & Analysis"));
      expect(open.getAllByTestId("academy-chapter-row")).toHaveLength(2);
      expect(open.getByText("Module 2 • 16 minutes to complete")).toBeVisible();
      expect(open.getByText("50%")).toBeVisible();
      expect(
        open.getByRole("link", { name: "Go to module 2: Measuring & Analysis" })
      ).toHaveAttribute("href", "/academy/modules/12");
      // Tags only show in search results
      expect(
        screen.queryByRole("group", { name: "Matching tags" })
      ).not.toBeInTheDocument();
    });

    it("toggles modules from the header", async () => {
      await renderLoadedPage();
      fireEvent.click(trigger("Building the Business Case"));
      expect(
        screen.getByRole("link", { name: "The business case" })
      ).toBeVisible();

      fireEvent.click(trigger("Measuring & Analysis"));
      expect(
        screen.queryByRole("link", { name: "Measuring actual income" })
      ).not.toBeInTheDocument();

      fireEvent.click(
        accordion("Measuring & Analysis").querySelector(
          ".academy-accordion-chevron"
        )
      );
      expect(trigger("Measuring & Analysis")).toHaveAttribute(
        "aria-expanded",
        "true"
      );
    });

    it("links chapters to their step on the module learning page", async () => {
      await renderLoadedPage("/academy/courses?tag=benchmark");
      expect(
        screen.getByRole("link", { name: "Why living income matters" })
      ).toHaveAttribute("href", "/academy/modules/11?chapter=101");
    });

    it("offers Read more only when the summary is cut off", async () => {
      const scrollHeight = jest
        .spyOn(HTMLElement.prototype, "scrollHeight", "get")
        .mockReturnValue(120);
      const clientHeight = jest
        .spyOn(HTMLElement.prototype, "clientHeight", "get")
        .mockReturnValue(60);
      await renderLoadedPage();

      const readMore = screen.getByRole("button", { name: "Read more" });
      fireEvent.click(readMore);
      expect(screen.getByRole("button", { name: "Read less" })).toHaveAttribute(
        "aria-expanded",
        "true"
      );
      scrollHeight.mockRestore();
      clientHeight.mockRestore();
    });

    it("hides Read more for a short summary", async () => {
      await renderLoadedPage();
      expect(
        screen.queryByRole("button", { name: "Read more" })
      ).not.toBeInTheDocument();
    });

    it("hides the tag filter when tags fail to load", async () => {
      academyService.getTags.mockRejectedValue({ status: 500, message: "x" });
      await renderLoadedPage();
      expect(
        screen.queryByRole("group", { name: "Browse by tag" })
      ).not.toBeInTheDocument();
    });

    it("shows an empty state for a course without modules", async () => {
      academyService.getModules.mockResolvedValue(
        buildCourse({ total_modules: 0, modules: [] })
      );
      renderPage();
      expect(
        await screen.findByText("The course has no modules yet.")
      ).toBeInTheDocument();
    });

    it("shows the error and retries", async () => {
      academyService.getModules
        .mockRejectedValueOnce({ status: null, message: "Network Error" })
        .mockResolvedValueOnce(buildCourse());
      renderPage();

      expect(
        await screen.findByText("We couldn't load the course")
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
      expect(
        await screen.findAllByTestId("academy-module-accordion")
      ).toHaveLength(3);
    });
  });

  describe("search and tags", () => {
    it("searches through the URL and shows the results", async () => {
      await renderLoadedPage();
      academyService.getModules.mockResolvedValue(
        buildCourse({ modules: buildCourse().modules.slice(0, 2) })
      );

      search("  living income ");

      expect(location()).toHaveTextContent(
        "/academy/courses?search=living+income"
      );
      expect(
        await screen.findByRole("heading", {
          name: "Showing 5 results for ‘living income’",
        })
      ).toBeInTheDocument();
      expect(screen.getByText("2 modules · 3 chapters")).toBeInTheDocument();
      expect(academyService.getModules).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "living income", tag: "" })
      );
      // Results open every module and replace the summary
      expect(trigger("The concept of living income")).toHaveAttribute(
        "aria-expanded",
        "true"
      );
      expect(
        screen.queryByText("Explore the living income roadmap.")
      ).not.toBeInTheDocument();
      // Matches are highlighted in module and chapter titles
      const marks = Array.from(
        document.querySelectorAll("mark.academy-highlight")
      ).map((mark) => mark.textContent);
      expect(marks.length).toBeGreaterThanOrEqual(2);
      expect(
        marks.every((text) => text.toLowerCase() === "living income")
      ).toBe(true);
    });

    it("filters by a tag chip and back to All", async () => {
      await renderLoadedPage();
      const filter = screen.getByRole("group", { name: "Browse by tag" });

      fireEvent.click(
        within(filter).getByRole("button", { name: "#Benchmark" })
      );
      expect(location()).toHaveTextContent("?tag=benchmark");
      await waitFor(() =>
        expect(academyService.getModules).toHaveBeenLastCalledWith(
          expect.objectContaining({ tag: "benchmark" })
        )
      );
      expect(
        await screen.findByRole("heading", { name: /results for ‘#Benchmark’/ })
      ).toBeInTheDocument();
      expect(
        within(filter).getByRole("button", { name: "#Benchmark" })
      ).toHaveAttribute("aria-pressed", "true");

      fireEvent.click(within(filter).getByRole("button", { name: "All" }));
      expect(location()).toHaveTextContent(/^\/academy\/courses$/);
      await settled();
    });

    it("filters by a module's matching tag in the results", async () => {
      await renderLoadedPage("/academy/courses?search=income");
      const matching = within(accordion("Measuring & Analysis")).getByRole(
        "group",
        { name: "Matching tags" }
      );
      fireEvent.click(
        within(matching).getByRole("button", { name: "#Income gap" })
      );
      expect(location()).toHaveTextContent(/\?tag=income-gap$/);
      await settled();
    });

    it("shows the full course again when the search box is cleared", async () => {
      await renderLoadedPage("/academy/courses?search=income&tag=benchmark");
      expect(
        screen.getByRole("textbox", {
          name: "Search modules, chapters and tags",
        })
      ).toHaveValue("income");

      fireEvent.change(
        screen.getByRole("textbox", {
          name: "Search modules, chapters and tags",
        }),
        { target: { value: "" } }
      );
      expect(location()).toHaveTextContent(/\?tag=benchmark$/);
      await settled();
    });

    it("ignores a slower response for an older filter", async () => {
      const requests = [];
      academyService.getModules.mockImplementation(({ signal }) => {
        const request = deferred(signal);
        requests.push(request);
        return request.promise;
      });
      const signals = [];
      academyService.getModules.mockImplementation(({ signal }) => {
        signals.push(signal);
        const request = deferred(signal);
        requests.push(request);
        return request.promise;
      });
      renderPage();
      search("gap");

      expect(signals[0].aborted).toBe(true);
      requests[requests.length - 1].resolve(
        buildCourse({ modules: buildCourse().modules.slice(1, 2) })
      );
      expect(
        await screen.findByRole("heading", { name: /results for ‘gap’/ })
      ).toBeInTheDocument();
    });

    it("suggests searches and popular topics when nothing matches", async () => {
      academyService.getModules.mockResolvedValue(buildCourse({ modules: [] }));
      renderPage("/academy/courses?search=cocoa+pricing");

      expect(
        await screen.findByRole("heading", {
          name: "No results for ‘cocoa pricing’",
        })
      ).toBeInTheDocument();
      const empty = within(screen.getByTestId("academy-no-results"));
      const topics = empty.getByRole("group", { name: "Popular topics" });
      // Top five by chapter count
      expect(
        within(topics)
          .getAllByRole("button")
          .map((button) => button.textContent)
      ).toEqual([
        "#Benchmark",
        "#Income gap",
        "#Due diligence",
        "#Procurement",
        "#Income measurement",
      ]);

      fireEvent.click(
        within(
          empty.getByRole("group", { name: "Try searching for" })
        ).getByRole("button", { name: "Income gap" })
      );
      expect(location()).toHaveTextContent(/\?search=Income\+gap$/);

      await settled();
      fireEvent.click(
        within(screen.getByRole("group", { name: "Popular topics" })).getByRole(
          "button",
          { name: "#Benchmark" }
        )
      );
      expect(location()).toHaveTextContent(/\?tag=benchmark$/);
      await settled();
    });
  });

  describe("completion toggle", () => {
    it("ticks a chapter optimistically and applies the module progress", async () => {
      const save = deferred();
      academyService.updateChapterProgress.mockReturnValueOnce(save.promise);
      await renderLoadedPage();

      fireEvent.click(chapterCheckbox("Choosing a living income benchmark"));
      expect(
        chapterCheckbox("Choosing a living income benchmark")
      ).toBeChecked();
      expect(
        chapterCheckbox("Choosing a living income benchmark")
      ).toBeDisabled();
      expect(academyService.updateChapterProgress).toHaveBeenCalledWith(
        202,
        "completed"
      );

      save.resolve(progressResponse());
      await waitFor(() =>
        expect(
          within(accordion("Measuring & Analysis")).getByText("100%")
        ).toBeVisible()
      );
      expect(
        within(accordion("Measuring & Analysis")).getAllByText("Completed")
      ).toHaveLength(3);
      expect(
        chapterCheckbox("Choosing a living income benchmark")
      ).toBeEnabled();
    });

    it("reverts the tick and shows a client error", async () => {
      const toast = jest.spyOn(message, "error").mockImplementation(() => {});
      academyService.updateChapterProgress.mockRejectedValue({
        status: 404,
        message: "Chapter not found",
      });
      await renderLoadedPage();

      fireEvent.click(chapterCheckbox("Measuring actual income"));
      await waitFor(() =>
        expect(chapterCheckbox("Measuring actual income")).toBeChecked()
      );
      expect(academyService.updateChapterProgress).toHaveBeenCalledWith(
        201,
        "in_progress"
      );
      expect(toast).toHaveBeenCalledWith("Chapter not found");
      toast.mockRestore();
    });

    it("leaves server errors to the global toast", async () => {
      const toast = jest.spyOn(message, "error").mockImplementation(() => {});
      academyService.updateChapterProgress.mockRejectedValue({
        status: 500,
        message: "Boom",
      });
      await renderLoadedPage();

      fireEvent.click(chapterCheckbox("Measuring actual income"));
      await waitFor(() =>
        expect(chapterCheckbox("Measuring actual income")).toBeEnabled()
      );
      expect(chapterCheckbox("Measuring actual income")).toBeChecked();
      expect(toast).not.toHaveBeenCalled();
      toast.mockRestore();
    });

    it("handles null progress gracefully without crashing", async () => {
      academyService.updateChapterProgress.mockResolvedValueOnce(null);
      await renderLoadedPage();

      fireEvent.click(chapterCheckbox("Measuring actual income"));
      await waitFor(() =>
        expect(chapterCheckbox("Measuring actual income")).toBeEnabled()
      );
      expect(chapterCheckbox("Measuring actual income")).toBeChecked();
    });
  });

  describe("chapter links", () => {
    it("opens ?chapter= on its module learning page", async () => {
      renderPage("/academy/courses?chapter=202");
      await waitFor(() =>
        expect(location()).toHaveTextContent("/academy/modules/12?chapter=202")
      );
      expect(academyService.getChapter).toHaveBeenCalledWith(
        "202",
        expect.objectContaining({ signal: expect.anything() })
      );
    });

    it("drops an unknown chapter and shows the list", async () => {
      const toast = jest.spyOn(message, "error").mockImplementation(() => {});
      academyService.getChapter.mockRejectedValue({
        status: 404,
        message: "Chapter not found",
      });
      renderPage("/academy/courses?tag=benchmark&chapter=999");

      await waitFor(() =>
        expect(location()).toHaveTextContent(/\?tag=benchmark$/)
      );
      expect(toast).toHaveBeenCalledWith("Chapter not found");
      await settled();
      toast.mockRestore();
    });

    it("leaves server errors to the global toast", async () => {
      const toast = jest.spyOn(message, "error").mockImplementation(() => {});
      academyService.getChapter.mockRejectedValue({
        status: 500,
        message: "x",
      });
      renderPage("/academy/courses?chapter=202");

      await waitFor(() =>
        expect(location()).toHaveTextContent(/^\/academy\/courses$/)
      );
      expect(toast).not.toHaveBeenCalled();
      await settled();
      toast.mockRestore();
    });

    it("continues learning from the backend's resume chapter", async () => {
      const overview = deferred();
      academyService.getOverview.mockReturnValueOnce(overview.promise);
      await renderLoadedPage();
      const button = screen.getByRole("button", { name: "Continue learning" });

      fireEvent.click(button);
      expect(button).toHaveClass("ant-btn-loading");
      overview.resolve({ continue_chapter_id: 202 });

      await waitFor(() =>
        expect(location()).toHaveTextContent("/academy/modules/12?chapter=202")
      );
    });

    it("stays put when there is nothing to continue, or it fails", async () => {
      const toast = jest.spyOn(message, "error").mockImplementation(() => {});
      academyService.getOverview
        .mockResolvedValueOnce({ continue_chapter_id: null })
        .mockRejectedValueOnce({ status: 403, message: "Not allowed" });
      await renderLoadedPage();
      const button = screen.getByRole("button", { name: "Continue learning" });

      fireEvent.click(button);
      await waitFor(() => expect(button).not.toHaveClass("ant-btn-loading"));
      fireEvent.click(button);
      await waitFor(() => expect(toast).toHaveBeenCalledWith("Not allowed"));
      expect(location()).toHaveTextContent(/^\/academy\/courses$/);
      toast.mockRestore();
    });
  });

  it("cancels its requests when leaving the page", () => {
    const signals = [];
    academyService.getTags.mockImplementation(({ signal }) => {
      signals.push(signal);
      return deferred(signal).promise;
    });
    academyService.getModules.mockImplementation(({ signal }) => {
      signals.push(signal);
      return deferred(signal).promise;
    });
    const { unmount } = renderPage();
    unmount();
    expect(signals.every((signal) => signal.aborted)).toBe(true);
  });
});
