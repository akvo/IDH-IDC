import { calculateScenarioROI } from "../roiCalculations";

describe("roiCalculations - calculateScenarioROI", () => {
  const segments = [
    { id: "seg-1", number_of_farmers: 70, answers: { "current-1-2": 2 } }, // 2 acres per farmer
    { id: "seg-2", number_of_farmers: 30, answers: { "current-1-2": 1 } }, // 1 acre per farmer
  ];

  const scenario = {
    key: "scenario-1",
    scenarioValues: [
      {
        segmentId: "seg-1",
        currentSegmentValue: { total_current_income: 1000 },
        updatedSegmentScenarioValue: { total_current_income: 1100 },
      },
      {
        segmentId: "seg-2",
        currentSegmentValue: { total_current_income: 500 },
        updatedSegmentScenarioValue: { total_current_income: 600 },
      },
    ],
  };

  test("Per Segment mode - calculates ROI correctly", () => {
    const investmentAnalysis = {
      is_enabled: true,
      scenarios: {
        "scenario-1": {
          cost_allocation_mode: "per_segment",
          segments: {
            "seg-1": {
              investment_cost: 700,
              cost_unit: "total",
              components: [{ name: "Training", cost: 700, unit: "total" }],
            },
            "seg-2": {
              investment_cost: 300,
              cost_unit: "total",
              components: [{ name: "Training", cost: 300, unit: "total" }],
            },
          },
        },
      },
    };

    const result = calculateScenarioROI(scenario, investmentAnalysis, segments);

    // Total Income Improvement = (100 * 70) + (100 * 30) = 7000 + 3000 = 10000
    // Total Cost = 700 + 300 = 1000
    // ROI = 10000 / 1000 = 10
    expect(result.totalIncomeImprovement).toBe(10000);
    expect(result.totalCost).toBe(1000);
    expect(result.roi).toBe(10);
    expect(result.segmentMetrics["seg-1"].totalCost).toBe(700);
    expect(result.segmentMetrics["seg-2"].totalCost).toBe(300);
  });

  test("All Farmers mode - distributes total cost proportionally", () => {
    const investmentAnalysis = {
      is_enabled: true,
      scenarios: {
        "scenario-1": {
          cost_allocation_mode: "all_farmers",
          all_farmers_config: {
            investment_cost: 1000,
            cost_unit: "total",
            components: [{ name: "Training", cost: 1000, unit: "total" }],
          },
        },
      },
    };

    const result = calculateScenarioROI(scenario, investmentAnalysis, segments);

    // Total Cost = 1000
    // Ratio Seg-1 = 70/100 = 0.7
    // Ratio Seg-2 = 30/100 = 0.3
    // Seg-1 Cost = 700
    // Seg-2 Cost = 300
    expect(result.totalCost).toBe(1000);
    expect(result.segmentMetrics["seg-1"].totalCost).toBe(700);
    expect(result.segmentMetrics["seg-2"].totalCost).toBe(300);
    expect(result.segmentComponentBreakdowns["seg-1"]["Training"]).toBe(700);
    expect(result.segmentComponentBreakdowns["seg-2"]["Training"]).toBe(300);
  });

  test("All Farmers mode - per_farmer unit multiplies by total farmers", () => {
    const investmentAnalysis = {
      is_enabled: true,
      scenarios: {
        "scenario-1": {
          cost_allocation_mode: "all_farmers",
          all_farmers_config: {
            investment_cost: 10,
            cost_unit: "per_farmer",
            components: [{ name: "Inputs", cost: 10, unit: "per_farmer" }],
          },
        },
      },
    };

    const result = calculateScenarioROI(scenario, investmentAnalysis, segments);

    // Total Farmers = 100
    // Total Cost = 10 * 100 = 1000
    // Seg-1 Cost (70 farmers) = 10 * 70 = 700
    // Seg-2 Cost (30 farmers) = 10 * 30 = 300
    expect(result.totalCost).toBe(1000);
    expect(result.segmentMetrics["seg-1"].totalCost).toBe(700);
    expect(result.segmentMetrics["seg-2"].totalCost).toBe(300);
  });
});
