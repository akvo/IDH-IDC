const { calculateOutcomeData } = require("../scenarioOutcomeCalculations");

const questionGroups = [
  {
    id: 1,
    commodity_id: 1,
    commodity_type: "focus",
    questions: [
      { id: 1, text: "aggregator", question_type: "aggregator", childrens: [] },
    ],
  },
];

const dashboardData = [
  {
    id: 1,
    name: "Company A",
    total_current_income: 4323,
    target: 5000,
    number_of_farmers: 70,
  },
];

const scenarioData = [
  {
    key: 1,
    name: "Scenario 1",
    scenarioValues: [
      {
        segmentId: 1,
        updatedSegmentScenarioValue: {
          total_current_income: 5000,
          number_of_farmers: 70,
        },
        currentSegmentValue: {
          answers: [{ name: "current", questionId: 1, value: 4323 }],
        },
        selectedDrivers: [{ field: "driver-1-1-1", value: "1-1" }],
        allNewValues: {
          "absolute-1-1-1": 5000,
          "percentage-1-1-1": 15.66,
        },
      },
    ],
  },
];

describe("Scenario Outcome Calculations (TDD)", () => {
  it("calculates the correct income target status", () => {
    const result = calculateOutcomeData(scenarioData, dashboardData, [], []);
    const outcome = result.find((r) => r.segmentId === 1).scenarioOutcome;

    const targetReached = outcome.find((o) => o.id === "income_target_reached");
    expect(targetReached.current).toBe("not_reached");
    expect(targetReached["scenario-1"]).toBe("reached");
  });

  it("calculates the correct income increase", () => {
    const result = calculateOutcomeData(scenarioData, dashboardData, [], []);
    const outcome = result.find((r) => r.segmentId === 1).scenarioOutcome;

    const increase = outcome.find((o) => o.id === "income_increase");
    // 5000 - 4323 = 677
    expect(increase["scenario-1"]).toContain("677");
  });

  it("calculates the correct income increase percentage", () => {
    const result = calculateOutcomeData(scenarioData, dashboardData, [], []);
    const outcome = result.find((r) => r.segmentId === 1).scenarioOutcome;

    const percent = outcome.find((o) => o.id === "income_increase_percentage");
    // (677 / 4323) * 100 = 15.66%
    expect(percent["scenario-1"]).toBe("15.66%");
  });

  it("calculates the correct income drivers (legacy string format)", () => {
    const result = calculateOutcomeData(
      scenarioData,
      dashboardData,
      questionGroups,
      []
    );
    const outcome = result.find((r) => r.segmentId === 1).scenarioOutcome;

    const drivers = outcome.find((o) => o.id === "income_driver");
    // aggregator#(15.66%)
    expect(drivers["scenario-1"]).toBe("aggregator#(15.66%)");
  });
});
