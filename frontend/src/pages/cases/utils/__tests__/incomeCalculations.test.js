const { getTargetPrimaryIncome } = require("../incomeCalculations");

describe("incomeCalculations", () => {
  // Primary Income = d2 * (d3 * d4 - d5) = 2 * (100 * 5 - 10) = 2 * 490 = 980

  test("getTargetPrimaryIncome", () => {
    expect(getTargetPrimaryIncome(2000, 500, 200, 100)).toBe(1200);
  });

  describe("calculateModellingDriver", () => {
    const { calculateModellingDriver } = require("../incomeCalculations");
    const drivers = { land: 2, volume: 100, price: 5, cop: 10 };

    describe("Crop/Livestock", () => {
      const targetIncome = 1200;
      test("calculates price correctly", () => {
        // P = (Income / L + C) / V = (1200 / 2 + 10) / 100 = 610 / 100 = 6.1
        expect(
          calculateModellingDriver(targetIncome, drivers, "price", "Crop")
        ).toBe(6.1);
      });

      test("calculates volume correctly", () => {
        // V = (Income / L + C) / P = (1200 / 2 + 10) / 5 = 610 / 5 = 122
        expect(
          calculateModellingDriver(targetIncome, drivers, "volume", "Crop")
        ).toBe(122);
      });

      test("calculates cop correctly", () => {
        // C = V * P - Income / L = 100 * 5 - 1200 / 2 = 500 - 600 = -100
        expect(
          calculateModellingDriver(targetIncome, drivers, "cop", "Crop")
        ).toBe(-100);
      });
    });

    describe("Aquaculture", () => {
      const targetIncome = 802; // (401 * 2)
      const aquaDrivers = { land: 2, volume: 100, price: 5, cop: 1 };
      test("calculates price correctly", () => {
        // P = (Income / L - 1) / V + C = (802 / 2 - 1) / 100 + 1 = 400 / 100 + 1 = 5
        expect(
          calculateModellingDriver(
            targetIncome,
            aquaDrivers,
            "price",
            "Aquaculture"
          )
        ).toBe(5);
      });

      test("calculates volume correctly", () => {
        // V = (Income / L - 1) / (P - C) = (802 / 2 - 1) / (5 - 1) = 400 / 4 = 100
        expect(
          calculateModellingDriver(
            targetIncome,
            aquaDrivers,
            "volume",
            "Aquaculture"
          )
        ).toBe(100);
      });

      test("calculates cop correctly", () => {
        const targetForCop = 602;
        // C = P - (Income / L - 1) / V = 5 - (602 / 2 - 1) / 100 = 5 - 300 / 100 = 2
        expect(
          calculateModellingDriver(
            targetForCop,
            aquaDrivers,
            "cop",
            "Aquaculture"
          )
        ).toBe(2);
      });
    });

    test("handles division by zero", () => {
      const zeroDrivers = { land: 0, volume: 0, price: 0, cop: 0 };
      expect(calculateModellingDriver(1000, zeroDrivers, "price", "Crop")).toBe(
        0
      );
      const noVol = { land: 2, volume: 0, price: 5, cop: 2 };
      expect(calculateModellingDriver(1000, noVol, "price", "Crop")).toBe(0);
    });
  });
});
