const { calculateModellingDriver } = require("../incomeCalculations");

describe("Modelling Calculation Fixes", () => {
  const drivers = { land: 2, volume: 100, price: 5, cop: 10 };

  test("price result can be negative if target is extremely negative", () => {
    const result = calculateModellingDriver(-5000, drivers, "price", "Crop");
    expect(result).toBeLessThan(0);
  });

  test("volume result can be negative if target is extremely negative", () => {
    const result = calculateModellingDriver(-5000, drivers, "volume", "Crop");
    expect(result).toBeLessThan(0);
  });

  test("cop result can be negative if target is very high", () => {
    const result = calculateModellingDriver(10000, drivers, "cop", "Crop");
    expect(result).toBeLessThan(0);
  });

  test("Aquaculture results show raw values", () => {
    const aquaDrivers = { land: 2, volume: 100, price: 5, cop: 1 };
    const priceResult = calculateModellingDriver(
      -5000,
      aquaDrivers,
      "price",
      "Aquaculture"
    );
    expect(priceResult).toBeLessThan(0);

    const volResult = calculateModellingDriver(
      -5000,
      aquaDrivers,
      "volume",
      "Aquaculture"
    );
    expect(volResult).toBeLessThan(0);

    const copResult = calculateModellingDriver(
      10000,
      aquaDrivers,
      "cop",
      "Aquaculture"
    );
    expect(copResult).toBeLessThan(0);
  });
});
