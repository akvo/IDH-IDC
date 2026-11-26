import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AcademyUserStats, { STATS_ENDPOINT } from "../AcademyUserStats";
import CompaniesParticipationTable from "../components/CompaniesParticipationTable";
import {
  UNIT_NUMBER,
  UNIT_PERCENTAGE,
  getChartOption,
} from "../components/ModuleDistributionChart";
import {
  buildStatsCsv,
  downloadCsv,
  formatNumber,
  getStatsCsvFilename,
} from "../utils";
import { UserState } from "../../../../store";
import { api } from "../../../../lib";

jest.mock("../../../../lib/api");

const mockGetDataURL = jest.fn();
let mockChartOption = null;

// Renders the bar values so tests can read what ECharts would draw
jest.mock("echarts-for-react", () => {
  const ReactLib = jest.requireActual("react");
  const MockChart = ReactLib.forwardRef(({ option }, ref) => {
    mockChartOption = option;
    ReactLib.useImperativeHandle(ref, () => ({
      getEchartsInstance: () => ({ getDataURL: mockGetDataURL }),
    }));
    const [series] = option.series;
    return (
      <div data-testid="echarts" data-show-label={`${series.label.show}`}>
        {series.data.map((value, index) => (
          <span key={index} data-testid="chart-bar">
            {series.label.formatter({ value })}
          </span>
        ))}
      </div>
    );
  });
  return MockChart;
});

const mockStats = {
  kpis: {
    registered_users: 1248,
    active_users_30d: 412,
    companies_count: 37,
    avg_modules_completed: 3.4,
    total_modules: 6,
  },
  module_distribution: [0, 1, 2, 3, 4, 5, 6].map((modules, index) => ({
    modules_completed: modules,
    count: [20, 23, 21, 20, 10, 11, 9][index],
    percentage: [17.5, 20.2, 18.4, 17.5, 8.8, 9.6, 7.9][index],
  })),
  companies: [
    {
      company: "Ndugu",
      users_count: 142,
      average_progress_pct: 71,
      completed_all_modules_count: 58,
    },
    {
      company: "Barry Callebaut, Ltd",
      users_count: 69,
      average_progress_pct: 61,
      completed_all_modules_count: 24,
    },
    {
      company: "Vitara",
      users_count: 96,
      average_progress_pct: 58,
      completed_all_modules_count: 33,
    },
  ],
  filter_options: {
    years: [2026, 2025],
    regions: ["East Africa", "West Africa"],
    sectors: ["Cocoa", "Coffee"],
  },
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/admin/academy-user-statistics"]}>
      <AcademyUserStats />
    </MemoryRouter>
  );

const lastParams = () => api.get.mock.calls.at(-1)[1].params;

const selectOption = async (testId, label) => {
  const select = screen.getByTestId(testId);
  fireEvent.mouseDown(select.querySelector(".ant-select-selector"));
  const option = await waitFor(() => {
    const match = Array.from(
      document.querySelectorAll(".ant-select-item-option")
    ).find((item) => item.textContent === label);
    expect(match).toBeTruthy();
    return match;
  });
  fireEvent.click(option);
};

describe("AcademyUserStats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChartOption = null;
    // CRA resets mock implementations before each test
    mockGetDataURL.mockReturnValue("data:image/png;base64,chart");
    UserState.update((s) => {
      s.role = "super_admin";
    });
    api.get.mockResolvedValue({ data: mockStats });
  });

  it("loads the statistics without filters", async () => {
    renderPage();

    await screen.findByTestId("kpi-registered-users");
    expect(api.get).toHaveBeenCalledWith(
      STATS_ENDPOINT,
      expect.objectContaining({ params: {} })
    );
  });

  it("shows the 4 key figures", async () => {
    renderPage();

    expect(await screen.findByTestId("kpi-registered-users")).toHaveTextContent(
      "Registered Academy users1,248"
    );
    expect(screen.getByTestId("kpi-active-users")).toHaveTextContent(
      "Active users (last 30 days)412"
    );
    expect(screen.getByTestId("kpi-companies")).toHaveTextContent(
      "Companies taking part37"
    );
    expect(screen.getByTestId("kpi-avg-modules")).toHaveTextContent(
      "Average modules completed3.4 / 6"
    );
  });

  it.each([
    ["filter-year", "2025", { year: 2025 }],
    ["filter-region", "West Africa", { region: "West Africa" }],
    ["filter-sector", "Cocoa", { sector: "Cocoa" }],
  ])("re-fetches when %s changes", async (testId, label, params) => {
    renderPage();
    await screen.findByTestId("kpi-registered-users");

    await selectOption(testId, label);

    await waitFor(() => expect(lastParams()).toEqual(params));
  });

  it("combines filters and drops cleared ones", async () => {
    renderPage();
    await screen.findByTestId("kpi-registered-users");

    await selectOption("filter-year", "2026");
    await selectOption("filter-sector", "Coffee");
    await waitFor(() =>
      expect(lastParams()).toEqual({ year: 2026, sector: "Coffee" })
    );

    const year = screen.getByTestId("filter-year");
    fireEvent.mouseDown(year.querySelector(".ant-select-clear"));
    await waitFor(() => expect(lastParams()).toEqual({ sector: "Coffee" }));
  });

  it("shows the filter placeholders", async () => {
    renderPage();
    await screen.findByTestId("kpi-registered-users");

    ["All years", "All regions", "All sectors"].forEach((text) =>
      expect(screen.getByText(text)).toBeInTheDocument()
    );
  });

  it("shows an error when the statistics fail to load", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    api.get.mockRejectedValueOnce(new Error("boom"));
    renderPage();

    expect(await screen.findByTestId("academy-stats-error")).toHaveTextContent(
      "Could not load the Academy user statistics."
    );
    expect(screen.getByTestId("btn-export-csv")).toBeDisabled();
    console.error.mockRestore();
  });

  describe("module completion chart", () => {
    it("shows percentages with labels by default", async () => {
      renderPage();
      await screen.findByTestId("echarts");

      expect(
        screen.getAllByTestId("chart-bar").map((bar) => bar.textContent)
      ).toEqual(["17.5%", "20.2%", "18.4%", "17.5%", "8.8%", "9.6%", "7.9%"]);
      expect(screen.getByTestId("echarts")).toHaveAttribute(
        "data-show-label",
        "true"
      );
      expect(mockChartOption.xAxis.data).toEqual([
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
      ]);
    });

    it("switches to numbers", async () => {
      renderPage();
      await screen.findByTestId("echarts");

      fireEvent.click(screen.getByText("Number"));

      expect(
        screen.getAllByTestId("chart-bar").map((bar) => bar.textContent)
      ).toEqual(["20", "23", "21", "20", "10", "11", "9"]);
    });

    it("hides the labels", async () => {
      renderPage();
      await screen.findByTestId("echarts");

      fireEvent.click(screen.getByTestId("chart-show-label"));

      expect(screen.getByTestId("echarts")).toHaveAttribute(
        "data-show-label",
        "false"
      );
    });

    it("downloads the chart as a PNG", async () => {
      const click = jest
        .spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation(() => {});
      renderPage();
      await screen.findByTestId("echarts");

      fireEvent.click(screen.getByTestId("btn-download-chart"));

      expect(mockGetDataURL).toHaveBeenCalledWith(
        expect.objectContaining({ type: "png", pixelRatio: 2 })
      );
      const link = click.mock.instances[0];
      expect(link.download).toBe("li_academy_modules_completed.png");
      expect(link.href).toBe("data:image/png;base64,chart");
      click.mockRestore();
    });

    it("builds the tooltip with users and percentage", () => {
      const option = getChartOption({
        distribution: mockStats.module_distribution,
        unit: UNIT_NUMBER,
        showLabel: false,
      });
      expect(option.tooltip.formatter([{ dataIndex: 1 }])).toBe(
        "1 module: 23 users (20.2%)"
      );
      expect(option.tooltip.formatter([{ dataIndex: 3 }])).toBe(
        "3 modules: 20 users (17.5%)"
      );
      expect(option.series[0].itemStyle).toEqual({
        color: "#01625f",
        borderRadius: [4, 4, 0, 0],
      });
    });

    it("formats large counts", () => {
      const option = getChartOption({
        distribution: [],
        unit: UNIT_PERCENTAGE,
        showLabel: true,
      });
      expect(option.series[0].label.formatter({ value: 12 })).toBe("12%");
      expect(formatNumber(1248)).toBe("1,248");
    });
  });

  describe("companies table", () => {
    const companyNames = () =>
      within(screen.getByTestId("companies-participation-table"))
        .getAllByRole("row")
        .slice(1)
        .map((row) => row.cells[0].textContent);

    it("lists the companies with formatted progress", async () => {
      renderPage();
      const table = await screen.findByTestId("companies-participation-table");

      expect(table).toHaveTextContent("Companies taking part");
      expect(within(table).getByText("Completed all 6")).toBeInTheDocument();
      expect(within(table).getByText("71%")).toBeInTheDocument();
      expect(companyNames()).toEqual([
        "Ndugu",
        "Barry Callebaut, Ltd",
        "Vitara",
      ]);
    });

    it.each([
      ["Company", ["Barry Callebaut, Ltd", "Ndugu", "Vitara"]],
      ["Users", ["Barry Callebaut, Ltd", "Vitara", "Ndugu"]],
      ["Average progress", ["Vitara", "Barry Callebaut, Ltd", "Ndugu"]],
      ["Completed all 6", ["Barry Callebaut, Ltd", "Vitara", "Ndugu"]],
    ])("sorts by %s", async (column, order) => {
      renderPage();
      const table = await screen.findByTestId("companies-participation-table");

      fireEvent.click(within(table).getByText(column));

      expect(companyNames()).toEqual(order);
    });

    it("pages after 10 companies", () => {
      const companies = Array.from({ length: 12 }, (_, i) => ({
        company: `Company ${i + 1}`,
        users_count: 1,
        average_progress_pct: 0,
        completed_all_modules_count: 0,
      }));
      render(<CompaniesParticipationTable companies={companies} />);

      expect(screen.getAllByRole("row")).toHaveLength(11);
      expect(screen.getByTitle("2")).toBeInTheDocument();
    });
  });

  describe("CSV export", () => {
    it("downloads the filtered statistics", async () => {
      const createObjectURL = jest.fn(() => "blob:stats");
      const revokeObjectURL = jest.fn();
      Object.assign(window.URL, { createObjectURL, revokeObjectURL });
      const click = jest
        .spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation(() => {});
      renderPage();
      await screen.findByTestId("kpi-registered-users");
      await selectOption("filter-region", "East Africa");
      await waitFor(() =>
        expect(lastParams()).toEqual({ region: "East Africa" })
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("btn-export-csv"));
      });

      const [blob] = createObjectURL.mock.calls[0];
      expect(blob.type).toBe("text/csv;charset=utf-8");
      expect(click.mock.instances[0].download).toMatch(
        /^li_academy_user_statistics_\d{4}-\d{2}-\d{2}\.csv$/
      );
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:stats");
      click.mockRestore();
    });

    it("writes filters, key figures, distribution and companies", () => {
      const csv = buildStatsCsv(mockStats, { region: "East Africa" });
      const lines = csv.split("\r\n");

      expect(lines.slice(0, 4)).toEqual([
        "Applied filters",
        "Year,All years",
        "Region,East Africa",
        "Sector,All sectors",
      ]);
      expect(csv).toContain("Registered Academy users,1248");
      expect(csv).toContain("Average modules completed,3.4 / 6");
      expect(csv).toContain("Modules completed,Users,Percentage\r\n0,20,17.5%");
      expect(csv).toContain(
        "Company,Users,Average progress %,Completed all modules\r\nNdugu,142,71,58"
      );
      // Commas and quotes in names are escaped
      expect(csv).toContain('"Barry Callebaut, Ltd",69,61,24');
      expect(buildStatsCsv({ companies: [{ company: 'A "B"' }] })).toContain(
        '"A ""B""",,,'
      );
    });

    it("handles missing data", () => {
      expect(buildStatsCsv(null)).toContain("Average modules completed,0 / 6");
    });

    it("names the file by date", () => {
      expect(getStatsCsvFilename(new Date("2026-11-26T10:00:00Z"))).toBe(
        "li_academy_user_statistics_2026-11-26.csv"
      );
    });

    it("prefixes a BOM so Excel reads UTF-8", async () => {
      let blob = null;
      Object.assign(window.URL, {
        createObjectURL: jest.fn((b) => {
          blob = b;
          return "blob:x";
        }),
        revokeObjectURL: jest.fn(),
      });
      const click = jest
        .spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation(() => {});
      downloadCsv("a,b", "x.csv");
      const bytes = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(new Uint8Array(reader.result));
        reader.readAsArrayBuffer(blob);
      });
      // UTF-8 BOM, then the content
      expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
      expect(String.fromCharCode(...bytes.slice(3))).toBe("a,b");
      click.mockRestore();
    });
  });
});
