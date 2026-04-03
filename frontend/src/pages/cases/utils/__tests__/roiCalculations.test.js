const { calculateScenarioROI } = require("../roiCalculations");

describe("ROI Calculation Utility (Spreadsheet Benchmark #757)", () => {
  const segments = [
    { id: "A", name: "Company A", number_of_farmers: 200, answers: {} },
    { id: "B", name: "Company B", number_of_farmers: 305, answers: {} },
    { id: "F", name: "Female", number_of_farmers: 190, answers: {} },
    { id: "M", name: "Male", number_of_farmers: 360, answers: {} },
  ];

  const scenario = {
    key: "scenario1",
    scenarioValues: [
      {
        segmentId: "A",
        currentSegmentValue: { total_current_income: 274857.2 },
        updatedSegmentScenarioValue: { total_current_income: 276804.0 }, // Delta 1946.8
      },
      {
        segmentId: "B",
        currentSegmentValue: { total_current_income: 264328.2 },
        updatedSegmentScenarioValue: { total_current_income: 265561.0 }, // Delta 1232.8
      },
      {
        segmentId: "F",
        currentSegmentValue: { total_current_income: 273732.2 },
        updatedSegmentScenarioValue: { total_current_income: 274808.0 }, // Delta 1075.8
      },
      {
        segmentId: "M",
        currentSegmentValue: { total_current_income: 266432.5 },
        updatedSegmentScenarioValue: { total_current_income: 267519.0 }, // Delta 1086.5
      },
    ],
  };

  test("Direct Cost Benchmark (Table 1 from Spreadsheet)", () => {
    const investmentAnalysis = {
      is_enabled: true,
      scenarios: {
        scenario1: {
          cost_allocation_mode: "per_segment",
          segments: {
            A: { investment_cost: 13000, cost_unit: "total" },
            B: { investment_cost: 6500, cost_unit: "total" },
            F: { investment_cost: 7200, cost_unit: "total" },
            M: { investment_cost: 9000, cost_unit: "total" },
          },
        },
      },
    };

    const result = calculateScenarioROI(scenario, investmentAnalysis, segments);

    // Benchmarks from Spreadsheet Table 1
    // Company A: ROI 0.00005448
    // Company B: ROI 0.00007175
    // Female: ROI 0.00005458
    // Male: ROI 0.00004531

    expect(result.segmentMetrics["A"].roi).toBeCloseTo(0.00005448, 8);
    expect(result.segmentMetrics["B"].roi).toBeCloseTo(0.00007175, 8);
    expect(result.segmentMetrics["F"].roi).toBeCloseTo(0.00005458, 8);
    expect(result.segmentMetrics["M"].roi).toBeCloseTo(0.00004531, 8);
  });

  test("Proportional Cost Benchmark (Table 2 from Spreadsheet)", () => {
    const investmentAnalysis = {
      is_enabled: true,
      scenarios: {
        scenario1: {
          cost_allocation_mode: "all_farmers",
          all_farmers_config: {
            investment_cost: 35700,
            cost_unit: "total",
          },
        },
      },
    };

    const result = calculateScenarioROI(scenario, investmentAnalysis, segments);

    // Total Farmers = 200 + 305 + 190 + 360 = 1,055
    // Company A Cost = (200 / 1055) * 35700 = 6,767.7725
    // Company B Cost = (305 / 1055) * 35700 = 10,320.8530
    // Female Cost = (190 / 1055) * 35700 = 6,429.3838
    // Male Cost = (360 / 1055) * 35700 = 12,181.9905

    expect(result.investmentPerSegment["A"].investment_cost).toBeCloseTo(
      6767.77,
      2
    );
    expect(result.investmentPerSegment["B"].investment_cost).toBeCloseTo(
      10320.85,
      2
    );

    // ROI Benchmarks from Spreadsheet Table 2
    // Company A: 0.000104657
    // Company B: 0.000045189
    // Female: 0.000061127
    // Male: 0.000033475

    expect(result.segmentMetrics["A"].roi).toBeCloseTo(0.000104657, 9);
    expect(result.segmentMetrics["B"].roi).toBeCloseTo(0.000045189, 9);
    expect(result.segmentMetrics["F"].roi).toBeCloseTo(0.000061127, 9);
    expect(result.segmentMetrics["M"].roi).toBeCloseTo(0.000033475, 9);
  });
});
