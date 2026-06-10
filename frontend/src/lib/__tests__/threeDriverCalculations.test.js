// Mock formula and index BEFORE requiring the module
jest.doMock("../formula", () => ({
  yAxisFormula: {
    "#1": "DUMMY",
  },
}));

jest.doMock("../index", () => ({
  getFunctionDefaultValue: () => 1.6,
}));

const {
  calculateRequiredThirdDriver,
  generateCombinations,
} = require("../threeDriverCalculations");

describe("threeDriverCalculations", () => {
  const xAxisDriver = { qid: 2, name: "X", current: 10, feasible: 20 };
  const yAxisDriver = { qid: 3, name: "Y", current: 30, feasible: 40 };
  const thirdDriver = { qid: 1, name: "Z", current: 5, feasible: 15 };
  const driverMap = {
    1: { ...thirdDriver },
    2: { ...xAxisDriver },
    3: { ...yAxisDriver },
  };

  test("calculateRequiredThirdDriver calculates value and feasibility correctly", () => {
    const result = calculateRequiredThirdDriver({
      driverMap,
      xAxisDriver,
      yAxisDriver,
      thirdDriver,
      target: 100,
      diversified: 20,
      xVal: 15, // Feasible (10-20)
      yVal: 35, // Feasible (30-40)
    });

    expect(result).not.toBeNull();
    expect(result.thirdValue).toBe(1.6);
    expect(result.isXFeasible).toBe(true);
    expect(result.isYFeasible).toBe(true);
    expect(result.isThirdFeasible).toBe(false);
    expect(result.feasibleCount).toBe(2);
  });

  test("generateCombinations creates correct grid size", () => {
    const segmentData = {
      target: 100,
      total_current_diversified_income: 20,
      answers: [
        {
          question: { id: 1, parent_id: 1, text: "Z" },
          commodityFocus: true,
          name: "current",
          value: 5,
        },
        { question: { id: 1 }, name: "feasible", value: 15 },
        {
          question: { id: 2, parent_id: 1, text: "X" },
          commodityFocus: true,
          name: "current",
          value: 10,
        },
        { question: { id: 2 }, name: "feasible", value: 20 },
        {
          question: { id: 3, parent_id: 1, text: "Y" },
          commodityFocus: true,
          name: "current",
          value: 30,
        },
        { question: { id: 3 }, name: "feasible", value: 40 },
      ],
    };
    const sensitivityAnalysis = { config: {} };

    const combinations = generateCombinations({
      thirdDriver,
      xAxisDriver,
      yAxisDriver,
      segmentData,
      sensitivityAnalysis,
      selectedSegment: "seg1",
      xSteps: 3,
      ySteps: 2,
    });

    expect(combinations.length).toBe(2);
    expect(combinations[0].isYFeasible).toBe(true);
    expect(combinations[0].cols.length).toBe(3);
    expect(combinations[0].cols[0].thirdValue).toBe(1.6);
  });
});
