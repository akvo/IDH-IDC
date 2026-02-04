const {
  getTargetPrimaryIncome,
  calculateBreakdownDriver,
} = require("../incomeCalculations");

describe("incomeCalculations", () => {
  const drivers = {
    d2: 2,
    d3: 100,
    d4: 5,
    d5: 10,
  };
  // Primary Income = d2 * (d3 * d4 - d5) = 2 * (100 * 5 - 10) = 2 * 490 = 980

  test("getTargetPrimaryIncome", () => {
    expect(getTargetPrimaryIncome(2000, 500, 200, 100)).toBe(1200);
  });

  describe("calculateBreakdownDriver", () => {
    const targetIncome = 1200;

    test("calculates d2 correctly", () => {
      // d2 = Target / (d3 * d4 - d5) = 1200 / (100 * 5 - 10) = 1200 / 490
      expect(calculateBreakdownDriver(targetIncome, drivers, 2)).toBeCloseTo(
        1200 / 490
      );
    });

    test("calculates d3 correctly", () => {
      // d3 = (Target + d5 * d2) / (d2 * d4) = (1200 + 10 * 2) / (2 * 5) = 1220 / 10 = 122
      expect(calculateBreakdownDriver(targetIncome, drivers, 3)).toBe(122);
    });

    test("calculates d4 correctly", () => {
      // d4 = (Target + d5 * d2) / (d2 * d3) = (1200 + 10 * 2) / (2 * 100) = 1220 / 200 = 6.1
      expect(calculateBreakdownDriver(targetIncome, drivers, 4)).toBe(6.1);
    });

    test("calculates d5 correctly", () => {
      // d5 = (d2 * d3 * d4 - Target) / d2 = (2 * 100 * 5 - 1200) / 2 = (1000 - 1200) / 2 = -100
      expect(calculateBreakdownDriver(targetIncome, drivers, 5)).toBe(-100);
    });

    test("handles division by zero", () => {
      const zeroDrivers = { d2: 0, d3: 0, d4: 0, d5: 0 };
      expect(calculateBreakdownDriver(targetIncome, zeroDrivers, 2)).toBe(0);
      expect(calculateBreakdownDriver(targetIncome, zeroDrivers, 3)).toBe(0);
      expect(calculateBreakdownDriver(targetIncome, zeroDrivers, 5)).toBe(0);
    });
  });
});
