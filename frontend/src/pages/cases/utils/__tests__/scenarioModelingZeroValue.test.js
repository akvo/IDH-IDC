describe("Scenario Modeling Zero and Negative Percentage Driver Handling", () => {
  const computeFromPercentage = (current, percentage) => {
    const numNewVal =
      typeof percentage === "number" ? percentage : parseFloat(percentage);
    if (!isNaN(numNewVal)) {
      const valueTmp = current * (numNewVal / 100);
      return current + valueTmp;
    }
    return current;
  };

  const computeFromAbsolute = (current, absolute) => {
    const numNewVal =
      typeof absolute === "number" ? absolute : parseFloat(absolute);
    if (!isNaN(numNewVal)) {
      const calculatedPercentage = current
        ? ((numNewVal - current) / current) * 100
        : 0;
      return {
        absoluteValue: numNewVal,
        percentageValue: calculatedPercentage,
      };
    }
    return {
      absoluteValue: current,
      percentageValue: 0,
    };
  };

  test("entering -100% percentage change computes absolute value of 0", () => {
    const current = 1500;
    const newAbsolute = computeFromPercentage(current, -100);
    expect(newAbsolute).toBe(0);
  });

  test("entering 0% percentage change preserves baseline current value", () => {
    const current = 2500;
    const newAbsolute = computeFromPercentage(current, 0);
    expect(newAbsolute).toBe(2500);
  });

  test("entering +50% percentage change increases value by 50%", () => {
    const current = 2000;
    const newAbsolute = computeFromPercentage(current, 50);
    expect(newAbsolute).toBe(3000);
  });

  test("entering 0 as absolute value computes -100% percentage change and preserves 0", () => {
    const current = 1200;
    const result = computeFromAbsolute(current, 0);
    expect(result.absoluteValue).toBe(0);
    expect(result.percentageValue).toBe(-100);
  });

  test("entering double the current value computes +100% percentage change", () => {
    const current = 500;
    const result = computeFromAbsolute(current, 1000);
    expect(result.absoluteValue).toBe(1000);
    expect(result.percentageValue).toBe(100);
  });

  test("numeric filter correctly preserves 0 in array of driver values", () => {
    const absoluteValues = [0, 500, null, undefined];
    const filtered = absoluteValues.filter(
      (x) => typeof x === "number" && !isNaN(x)
    );
    expect(filtered).toEqual([0, 500]);
    expect(filtered.length).toBe(2);
  });
});
