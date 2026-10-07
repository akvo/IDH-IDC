import {
  determineScenarioBarColor,
  generateScenarioModelingChartData,
  formatTooltipContent,
} from "../ChartSegmentsIncomeGapScenarioModeling";

describe("ChartSegmentsIncomeGapScenarioModeling Helper Calculations", () => {
  describe("determineScenarioBarColor", () => {
    it("returns light green (#49D985) when scenario income increases", () => {
      expect(determineScenarioBarColor(1000, 1500)).toBe("#49D985");
    });

    it("returns red (#FF4D4F) when scenario income decreases", () => {
      expect(determineScenarioBarColor(2000, 1200)).toBe("#FF4D4F");
    });

    it("returns teal (#9CC2C1) when scenario income is unchanged", () => {
      expect(determineScenarioBarColor(1500, 1500)).toBe("#9CC2C1");
    });
  });

  describe("generateScenarioModelingChartData", () => {
    const segments = [
      {
        id: 1,
        name: "Segment Growth",
        total_current_income: 3000,
        target: 5000,
      },
      { id: 2, name: "Segment Loss", total_current_income: 4000, target: 5000 },
      { id: 3, name: "Segment Same", total_current_income: 3500, target: 5000 },
      {
        id: 4,
        name: "Segment Negative",
        total_current_income: -500,
        target: 4000,
      },
    ];

    const scenarioValues = [
      {
        segmentId: 1,
        currentSegmentValue: { total_current_income: 3000, target: 5000 },
        updatedSegmentScenarioValue: { total_current_income: 4500 },
      },
      {
        segmentId: 2,
        currentSegmentValue: { total_current_income: 4000, target: 5000 },
        updatedSegmentScenarioValue: { total_current_income: 2800 },
      },
      {
        segmentId: 3,
        currentSegmentValue: { total_current_income: 3500, target: 5000 },
        updatedSegmentScenarioValue: { total_current_income: 3500 },
      },
      {
        segmentId: 4,
        currentSegmentValue: { total_current_income: -500, target: 4000 },
        updatedSegmentScenarioValue: { total_current_income: -1000 },
      },
    ];

    it("includes ALL segments without filtering out income decreases", () => {
      const result = generateScenarioModelingChartData(
        scenarioValues,
        segments,
        "USD"
      );
      expect(result.segmentData.length).toBe(4);
      expect(result.segmentData.map((s) => s.name)).toEqual([
        "Segment Growth",
        "Segment Loss",
        "Segment Same",
        "Segment Negative",
      ]);
    });

    it("orders segments by ID to match the segment tab order even if segments array is disordered", () => {
      const disorderedSegments = [
        {
          id: 4,
          name: "Segment Negative",
          total_current_income: -500,
          target: 4000,
        },
        {
          id: 2,
          name: "Segment Loss",
          total_current_income: 4000,
          target: 5000,
        },
        {
          id: 1,
          name: "Segment Growth",
          total_current_income: 3000,
          target: 5000,
        },
        {
          id: 3,
          name: "Segment Same",
          total_current_income: 3500,
          target: 5000,
        },
      ];
      const result = generateScenarioModelingChartData(
        scenarioValues,
        disorderedSegments,
        "USD"
      );
      expect(result.segmentData.map((s) => s.name)).toEqual([
        "Segment Growth",
        "Segment Loss",
        "Segment Same",
        "Segment Negative",
      ]);
    });

    it("correctly computes deltas and preserves negative values without 0-flooring", () => {
      const result = generateScenarioModelingChartData(
        scenarioValues,
        segments,
        "USD"
      );

      // Segment Growth
      expect(result.segmentData[0].currentIncome).toBe(3000);
      expect(result.segmentData[0].scenarioIncome).toBe(4500);
      expect(result.segmentData[0].incomeChange).toBe(1500);
      expect(result.segmentData[0].gap).toBe(500); // 5000 - 4500
      expect(result.segmentData[0].scenarioColor).toBe("#49D985");

      // Segment Loss
      expect(result.segmentData[1].currentIncome).toBe(4000);
      expect(result.segmentData[1].scenarioIncome).toBe(2800);
      expect(result.segmentData[1].incomeChange).toBe(-1200);
      expect(result.segmentData[1].gap).toBe(2200); // 5000 - 2800
      expect(result.segmentData[1].scenarioColor).toBe("#FF4D4F");

      // Segment Same
      expect(result.segmentData[2].currentIncome).toBe(3500);
      expect(result.segmentData[2].scenarioIncome).toBe(3500);
      expect(result.segmentData[2].incomeChange).toBe(0);
      expect(result.segmentData[2].gap).toBe(1500);
      expect(result.segmentData[2].scenarioColor).toBe("#9CC2C1");

      // Segment Negative
      expect(result.segmentData[3].currentIncome).toBe(-500);
      expect(result.segmentData[3].scenarioIncome).toBe(-1000);
      expect(result.segmentData[3].incomeChange).toBe(-500);
      expect(result.segmentData[3].gap).toBe(5000); // 4000 - (-1000) = 5000
      expect(result.segmentData[3].scenarioColor).toBe("#FF4D4F");
    });

    it("generates series data with legend helper series for outcome states", () => {
      const result = generateScenarioModelingChartData(
        scenarioValues,
        segments,
        "USD"
      );
      expect(result.series.length).toBe(6);

      const [currentSeries, scenarioSeries] = result.series;
      const targetSeries = result.series[5];

      expect(currentSeries.name).toBe("Current total household income");
      expect(currentSeries.type).toBe("bar");
      expect(currentSeries.data[0].value).toBe(3000);

      expect(scenarioSeries.name).toBe("Scenario income");
      expect(scenarioSeries.type).toBe("bar");
      expect(scenarioSeries.data[0].value).toBe(4500);
      expect(scenarioSeries.data[0].itemStyle.color).toBe("#49D985");
      expect(scenarioSeries.data[1].itemStyle.color).toBe("#FF4D4F");

      expect(targetSeries.name).toBe("Income Target");
      expect(targetSeries.type).toBe("line");
      expect(targetSeries.symbol).toBe("diamond");
      expect(targetSeries.data[0].value).toBe(5000);
    });
  });

  describe("formatTooltipContent", () => {
    it("formats tooltip with positive delta and formatted currencies", () => {
      const item = {
        name: "Smallholders A",
        currentIncome: 2000,
        scenarioIncome: 3500,
        incomeChange: 1500,
        target: 4000,
        gap: 500,
        scenarioColor: "#49D985",
      };
      const html = formatTooltipContent(item, "USD");

      expect(html).toContain("Smallholders A");
      expect(html).toContain("2,000 USD");
      expect(html).toContain("3,500 USD");
      expect(html).toContain("+1,500 USD");
      expect(html).toContain("4,000 USD");
      expect(html).toContain("500 USD");
    });

    it("formats tooltip with negative delta prefix (-)", () => {
      const item = {
        name: "Smallholders B",
        currentIncome: 4000,
        scenarioIncome: 2500,
        incomeChange: -1500,
        target: 5000,
        gap: 2500,
        scenarioColor: "#FF4D4F",
      };
      const html = formatTooltipContent(item, "KES");

      expect(html).toContain("Smallholders B");
      expect(html).toContain("4,000 KES");
      expect(html).toContain("2,500 KES");
      expect(html).toContain("-1,500 KES");
      expect(html).toContain("5,000 KES");
      expect(html).toContain("2,500 KES");
    });

    it("formats tooltip when scenario income exceeds benchmark (0 gap)", () => {
      const item = {
        name: "High Performers",
        currentIncome: 4000,
        scenarioIncome: 6500,
        incomeChange: 2500,
        target: 5000,
        gap: 0,
        scenarioColor: "#49D985",
      };
      const html = formatTooltipContent(item, "USD");

      expect(html).toContain("0 USD");
    });
  });

  describe("getScenarioModelingChartOptions", () => {
    it("includes legend entries for current income, increase, decrease, no-change, and target", () => {
      const {
        getScenarioModelingChartOptions,
      } = require("../ChartSegmentsIncomeGapScenarioModeling");
      const segmentData = [
        { name: "Seg 1", currentIncome: 100, scenarioIncome: 150, target: 200 },
        { name: "Seg 2", currentIncome: 200, scenarioIncome: 150, target: 250 },
      ];
      const options = getScenarioModelingChartOptions({
        segmentData,
        series: [],
        currency: "USD",
      });
      const legendNames = options.legend.data.map((item) => item.name);

      expect(legendNames).toContain("Current total household income");
      expect(legendNames).toContain("Scenario income (increase)");
      expect(legendNames).toContain("Scenario income (decrease)");
      expect(legendNames).toContain("Scenario income (no change)");
      expect(legendNames).toContain("Income Target");
    });
  });
});
