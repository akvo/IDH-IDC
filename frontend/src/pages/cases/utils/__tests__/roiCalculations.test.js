const { calculateScenarioROI } = require("../roiCalculations");

describe("ROI Calculation Utility (Pseudocode Alignment)", () => {
  const segments = [
    {
      id: 1,
      number_of_farmers: 70,
      answers: { "current-1-2": 10 }, // 10 Ha land size for Segment A
    },
    {
      id: 2,
      number_of_farmers: 30,
      answers: { "current-1-2": 5 }, // 5 Ha land size for Segment B
    },
  ];

  const scenario = {
    key: "scenario1",
    scenarioValues: [
      {
        segmentId: 1,
        currentSegmentValue: { total_current_income: 1000 },
        updatedSegmentScenarioValue: { total_current_income: 1200 }, // +200 per farmer
      },
      {
        segmentId: 2,
        currentSegmentValue: { total_current_income: 1000 },
        updatedSegmentScenarioValue: { total_current_income: 1100 }, // +100 per farmer
      },
    ],
  };

  test("All Farmers - Total Cost (distributed by farmer ratio)", () => {
    const investmentAnalysis = {
      is_enabled: true,
      scenarios: {
        scenario1: {
          cost_allocation_mode: "all_farmers",
          all_farmers_config: { investment_cost: 10000, cost_unit: "total" },
        },
      },
    };

    const result = calculateScenarioROI(scenario, investmentAnalysis, segments);

    // Segment 1 (70/100) should get 7,000
    // Segment 2 (30/100) should get 3,000
    expect(result.investmentPerSegment[1].investment_cost).toBe(7000);
    expect(result.investmentPerSegment[2].investment_cost).toBe(3000);
    expect(result.totalCost).toBe(10000);
  });

  test("All Farmers - Per Land Unit (direct area-based calculation)", () => {
    const investmentAnalysis = {
      is_enabled: true,
      scenarios: {
        scenario1: {
          cost_allocation_mode: "all_farmers",
          all_farmers_config: {
            investment_cost: 10,
            cost_unit: "per_land_unit",
          },
        },
      },
    };

    const result = calculateScenarioROI(scenario, investmentAnalysis, segments);

    // Segment A Area = 70 * 10 = 700 units. Cost = 700 * 10 = 7,000
    // Segment B Area = 30 * 5 = 150 units. Cost = 150 * 10 = 1,500
    expect(result.investmentPerSegment[1].investment_cost).toBe(7000);
    expect(result.investmentPerSegment[2].investment_cost).toBe(1500);
    expect(result.totalCost).toBe(8500);
  });

  test("Impact of Investment (ROI) calculation formula", () => {
    const investmentAnalysis = {
      is_enabled: true,
      scenarios: {
        scenario1: {
          cost_allocation_mode: "all_farmers",
          all_farmers_config: { investment_cost: 10000, cost_unit: "total" },
        },
      },
    };

    const result = calculateScenarioROI(scenario, investmentAnalysis, segments);

    // totalImprovement = (200 * 70) + (100 * 30) = 14000 + 3000 = 17,000
    // totalBaseline = (1000 * 70) + (1000 * 30) = 70000 + 30000 = 100,000
    // incomeIncreasePercentage = 17,000 / 100,000 * 100 = 17%
    // Impact = (17% / 10,000) * 100 = 0.17
    expect(result.totalIncomeImprovement).toBe(17000);
    expect(result.incomeImprovementPercentage).toBe(17);
    expect(result.totalCost).toBe(10000);
    expect(result.impactPercentage).toBeCloseTo(0.17, 5);
  });
});
