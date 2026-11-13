import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import AcademyResourcesPage from "../AcademyResourcesPage";
import { getResourceLink } from "../components/ResourcesTable";
import academyService from "../services/academy";

jest.mock("../services/academy", () => ({
  __esModule: true,
  isRequestCancelled: (error) => Boolean(error?.__CANCEL__),
  default: {
    getResources: jest.fn(),
    getGlossary: jest.fn(),
  },
}));

const resources = [
  {
    id: 1,
    name: "Roadmap overview",
    type: "Guidance",
    url: "/assets/academy/resources/roadmap.pdf",
    created_at: "2026-11-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Global Living Wage Coalition",
    type: "Organisation",
    url: "https://www.globallivingwage.org",
    created_at: "2026-11-02T00:00:00Z",
  },
  {
    id: 3,
    name: "Suspicious link",
    type: "Tool",
    url: "javascript:alert(1)",
    created_at: "2026-11-03T00:00:00Z",
  },
];

const terms = [
  {
    id: 11,
    term: "Actual income",
    type: "Core",
    definition: "Total household income from all sources over a year.",
    created_at: "2026-11-01T00:00:00Z",
  },
  {
    id: 12,
    term: "Median income",
    type: "Finance",
    definition: "The middle value of household incomes.",
    created_at: "2026-11-02T00:00:00Z",
  },
];

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

const renderPage = (path = "/academy/resources") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/academy/resources"
          element={
            <>
              <AcademyResourcesPage />
              <LocationDisplay />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );

const location = () => screen.getByTestId("location");
// Waits for the request a URL change triggered
const settled = () =>
  waitFor(() =>
    expect(document.querySelector(".ant-spin-spinning")).not.toBeInTheDocument()
  );
const table = () => screen.getByRole("table");
const rowTexts = () =>
  within(table())
    .getAllByRole("row")
    .slice(1)
    .map((row) => row.textContent);
const openMenu = async (name) => {
  fireEvent.click(screen.getByRole("button", { name }));
  return screen.findByRole("menu");
};

describe("AcademyResourcesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    academyService.getResources.mockResolvedValue({
      total: resources.length,
      data: resources,
    });
    academyService.getGlossary.mockResolvedValue({
      total: terms.length,
      data: terms,
    });
  });

  describe("resources tab", () => {
    it("is the default tab, sorted by name", async () => {
      renderPage();
      expect(
        screen.getByRole("heading", { name: "Technical Resources & Glossary" })
      ).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "Resources" })).toBeChecked();

      expect(await screen.findByText("Roadmap overview")).toBeInTheDocument();
      expect(academyService.getResources).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "",
          type: null,
          sortBy: "name",
          sortOrder: "asc",
        })
      );
      expect(academyService.getGlossary).not.toHaveBeenCalled();
      expect(
        within(table())
          .getAllByRole("columnheader")
          .map((header) => header.textContent)
      ).toEqual(["Name", "Type", "Actions"]);
      expect(rowTexts()[0]).toContain("Guidance");
    });

    it("downloads files and opens websites in a new tab", async () => {
      renderPage();
      const download = await screen.findByRole("link", {
        name: "Download Roadmap overview",
      });
      expect(download).toHaveAttribute(
        "href",
        "/assets/academy/resources/roadmap.pdf"
      );
      expect(download).toHaveAttribute("download");

      const open = screen.getByRole("link", {
        name: "Open Global Living Wage Coalition (opens in a new tab)",
      });
      expect(open).toHaveAttribute("href", "https://www.globallivingwage.org");
      expect(open).toHaveAttribute("target", "_blank");
      expect(open).toHaveAttribute("rel", "noopener noreferrer");

      // No link for anything that is not a site path or http(s) URL
      expect(
        screen.queryByRole("link", { name: /Suspicious link/ })
      ).toBeNull();
    });

    it("falls back to resources for an unknown tab", async () => {
      renderPage("/academy/resources?tab=nope");
      expect(await screen.findByText("Roadmap overview")).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "Resources" })).toBeChecked();
    });
  });

  describe("glossary tab", () => {
    it("opens from the URL with term, type and definition", async () => {
      renderPage("/academy/resources?tab=glossary");
      expect(await screen.findByText("Actual income")).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "Glossary" })).toBeChecked();
      expect(
        within(table())
          .getAllByRole("columnheader")
          .map((header) => header.textContent)
      ).toEqual(["Name", "Type", "Definition"]);
      expect(rowTexts()[1]).toBe(
        "Median incomeFinanceThe middle value of household incomes."
      );
      expect(academyService.getResources).not.toHaveBeenCalled();
    });

    it("switches tabs through the URL and starts unfiltered", async () => {
      renderPage("/academy/resources?search=road&type=Guidance");
      // The name is split by the search highlight, so match the row text
      await waitFor(() => expect(rowTexts()[0]).toContain("Roadmap overview"));

      fireEvent.click(screen.getByRole("radio", { name: "Glossary" }));
      expect(location()).toHaveTextContent(/\?tab=glossary$/);
      expect(await screen.findByText("Actual income")).toBeInTheDocument();
      expect(academyService.getGlossary).toHaveBeenCalledWith(
        expect.objectContaining({ search: "", type: null })
      );

      fireEvent.click(screen.getByRole("radio", { name: "Resources" }));
      expect(location()).toHaveTextContent(/^\/academy\/resources$/);
      expect(await screen.findByText("Roadmap overview")).toBeInTheDocument();
    });

    it("never shows the previous tab's rows while the next tab loads", async () => {
      renderPage();
      await screen.findByText("Roadmap overview");
      const request = deferred();
      academyService.getGlossary.mockReturnValueOnce(request.promise);

      fireEvent.click(screen.getByRole("radio", { name: "Glossary" }));
      expect(screen.queryByText("Roadmap overview")).not.toBeInTheDocument();

      request.resolve({ total: 2, data: terms });
      expect(await screen.findByText("Actual income")).toBeInTheDocument();
    });
  });

  describe("toolbar", () => {
    it("searches after a pause, highlights matches and closes clean", async () => {
      renderPage();
      await screen.findByText("Roadmap overview");

      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      const box = screen.getByRole("textbox", { name: "Search resources" });
      expect(box).toHaveFocus();

      fireEvent.change(box, { target: { value: "r" } });
      fireEvent.change(box, { target: { value: "road " } });
      // Debounced: nothing sent per keystroke
      expect(academyService.getResources).toHaveBeenCalledTimes(1);

      await waitFor(() =>
        expect(location()).toHaveTextContent(/\?search=road$/)
      );
      await waitFor(() =>
        expect(academyService.getResources).toHaveBeenLastCalledWith(
          expect.objectContaining({ search: "road" })
        )
      );
      expect(academyService.getResources).toHaveBeenCalledTimes(2);
      await waitFor(() =>
        expect(
          document.querySelector("mark.academy-highlight")
        ).toHaveTextContent("Road")
      );

      fireEvent.click(screen.getByRole("button", { name: "Close search" }));
      expect(location()).toHaveTextContent(/^\/academy\/resources$/);
      expect(
        screen.queryByRole("textbox", { name: "Search resources" })
      ).not.toBeInTheDocument();
      await settled();
    });

    it("keeps what the learner is typing when the search applies", async () => {
      renderPage();
      await screen.findByText("Roadmap overview");
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      const box = screen.getByRole("textbox", { name: "Search resources" });

      fireEvent.change(box, { target: { value: "road " } });
      await waitFor(() =>
        expect(location()).toHaveTextContent(/\?search=road$/)
      );
      // The trailing space survives, so "road map" can still be typed
      expect(box).toHaveValue("road ");
      await settled();
    });

    it("does not take focus on load when the URL has a search", async () => {
      renderPage("/academy/resources?search=road");
      const box = await screen.findByRole("textbox", {
        name: "Search resources",
      });
      expect(box).not.toHaveFocus();
      await settled();
    });

    it("closes an empty search box with Escape", async () => {
      renderPage();
      await screen.findByText("Roadmap overview");
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      const box = screen.getByRole("textbox", { name: "Search resources" });

      fireEvent.change(box, { target: { value: "x" } });
      fireEvent.keyDown(box, { key: "Escape" });
      // Not while it has text
      expect(box).toBeInTheDocument();

      fireEvent.change(box, { target: { value: "" } });
      fireEvent.keyDown(box, { key: "Escape" });
      expect(
        screen.queryByRole("textbox", { name: "Search resources" })
      ).not.toBeInTheDocument();
    });

    it("opens with the search from the URL", async () => {
      renderPage("/academy/resources?tab=glossary&search=income");
      expect(
        await screen.findByRole("textbox", {
          name: "Search terms and definitions",
        })
      ).toHaveValue("income");
      expect(academyService.getGlossary).toHaveBeenCalledWith(
        expect.objectContaining({ search: "income" })
      );
      await settled();
    });

    it("filters by type and back to all types", async () => {
      renderPage();
      await screen.findByText("Roadmap overview");

      const menu = await openMenu(/Filter by type, currently All types/);
      expect(
        within(menu)
          .getAllByRole("menuitem")
          .map((item) => item.textContent)
      ).toEqual(["All types", "Guidance", "Organisation", "Template", "Tool"]);
      fireEvent.click(within(menu).getByText("Template"));

      expect(location()).toHaveTextContent(/\?type=Template$/);
      await waitFor(() =>
        expect(academyService.getResources).toHaveBeenLastCalledWith(
          expect.objectContaining({ type: "Template" })
        )
      );

      const again = await openMenu(/currently Template/);
      fireEvent.click(within(again).getByText("All types"));
      expect(location()).toHaveTextContent(/^\/academy\/resources$/);
      await settled();
    });

    it("ignores a type that does not belong to the tab", async () => {
      renderPage("/academy/resources?tab=glossary&type=Template");
      await screen.findByText("Actual income");
      expect(academyService.getGlossary).toHaveBeenCalledWith(
        expect.objectContaining({ type: null })
      );
    });

    it("sorts through the menu; the default sort leaves the URL clean", async () => {
      renderPage();
      await screen.findByText("Roadmap overview");

      fireEvent.click(
        within(await openMenu(/Sort, currently Name \(A–Z\)/)).getByText(
          "Newest first"
        )
      );
      expect(location()).toHaveTextContent("?sort=created_at%3Adesc");
      await waitFor(() =>
        expect(academyService.getResources).toHaveBeenLastCalledWith(
          expect.objectContaining({ sortBy: "created_at", sortOrder: "desc" })
        )
      );

      fireEvent.click(
        within(await openMenu(/currently Newest first/)).getByText("Name (A–Z)")
      );
      expect(location()).toHaveTextContent(/^\/academy\/resources$/);
      await settled();
    });
  });

  describe("states", () => {
    it("offers to clear filters when nothing matches", async () => {
      academyService.getResources.mockResolvedValue({ total: 0, data: [] });
      renderPage("/academy/resources?search=zzz&type=Tool&sort=name%3Adesc");

      expect(
        await screen.findByText("No resources match your search or filter.")
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
      expect(location()).toHaveTextContent(/\?sort=name%3Adesc$/);
      await settled();
    });

    it("shows an empty list without filters", async () => {
      academyService.getGlossary.mockResolvedValue({ total: 0, data: [] });
      renderPage("/academy/resources?tab=glossary");
      expect(await screen.findByText("No terms yet.")).toBeInTheDocument();
    });

    it("shows the error and retries", async () => {
      academyService.getResources
        .mockRejectedValueOnce({ status: null, message: "Network Error" })
        .mockResolvedValueOnce({ total: 3, data: resources });
      renderPage();

      expect(
        await screen.findByText("We couldn't load the resources")
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
      expect(await screen.findByText("Roadmap overview")).toBeInTheDocument();
    });

    it("cancels a superseded request and the request on leaving", async () => {
      const signals = [];
      academyService.getResources.mockImplementation(({ signal }) => {
        signals.push(signal);
        return deferred(signal).promise;
      });
      const { unmount } = renderPage();

      fireEvent.click(
        await openMenu(/Filter by type/).then((menu) =>
          within(menu).getByText("Tool")
        )
      );
      await waitFor(() => expect(signals).toHaveLength(2));
      expect(signals[0].aborted).toBe(true);

      unmount();
      expect(signals[1].aborted).toBe(true);
    });
  });
});

describe("getResourceLink", () => {
  it("accepts site paths and http(s) URLs only", () => {
    expect(getResourceLink("/files/a.pdf")).toEqual({
      href: "/files/a.pdf",
      external: false,
    });
    expect(getResourceLink("HTTPS://example.org")).toEqual({
      href: "HTTPS://example.org",
      external: true,
    });
    expect(getResourceLink("//evil.example")).toBeNull();
    expect(getResourceLink("javascript:alert(1)")).toBeNull();
    expect(getResourceLink()).toBeNull();
  });
});
