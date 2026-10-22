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
    const missingValue = {}.unassigned;
    const absoluteValues = [0, 500, null, missingValue];
    const filtered = absoluteValues.filter(
      (x) => typeof x === "number" && !isNaN(x)
    );
    expect(filtered).toEqual([0, 500]);
    expect(filtered.length).toBe(2);
  });

  describe("Question component currentIncrease calculation logic", () => {
    const computeQuestionIncrease = ({ percentage, currentValue, val }) => {
      const numVal = typeof val === "number" ? val : parseFloat(val);
      const hasInput =
        typeof val !== "undefined" &&
        val !== null &&
        val !== "" &&
        !isNaN(numVal);

      if (!hasInput) {
        return 0;
      }

      if (percentage) {
        const value = currentValue * (numVal / 100);
        return currentValue + value;
      }

      const percent = currentValue
        ? ((numVal - currentValue) / currentValue) * 100
        : 0;
      return isNaN(percent)
        ? 0
        : percent % 1 === 0
        ? percent.toFixed(0)
        : percent.toFixed(2);
    };

    test("Case 1: absolute mode with new value 0 computes -100% change", () => {
      const result = computeQuestionIncrease({
        percentage: false,
        currentValue: 2.1,
        val: 0,
      });
      expect(result).toBe("-100");
    });

    test("Case 1: absolute mode with new value equal to current computes 0% change", () => {
      const result = computeQuestionIncrease({
        percentage: false,
        currentValue: 2.1,
        val: 2.1,
      });
      expect(result).toBe("0");
    });

    test("Case 2: percentage mode with change 0 returns current value (2.1)", () => {
      const result = computeQuestionIncrease({
        percentage: true,
        currentValue: 2.1,
        val: 0,
      });
      expect(result).toBe(2.1);
    });

    test("Case 2: percentage mode with change 10% returns increased value (2.31)", () => {
      const result = computeQuestionIncrease({
        percentage: true,
        currentValue: 2.1,
        val: 10,
      });
      expect(result).toBeCloseTo(2.31, 2);
    });

    test("unfilled / empty input returns 0", () => {
      const emptyResult = computeQuestionIncrease({
        percentage: true,
        currentValue: 2.1,
        val: null,
      });
      expect(emptyResult).toBe(0);
    });
  });

  describe("Total Income equivalence and rounding when no change happened", () => {
    test("Math.round displays identical figure for Current and Scenario total income", () => {
      const currentDashboardIncome = 274857.24;
      const scenarioIncomeUnchanged = 274857.24;

      expect(Math.round(currentDashboardIncome)).toBe(
        Math.round(scenarioIncomeUnchanged)
      );
      expect(Math.round(currentDashboardIncome)).toBe(274857);
    });
  });

  describe("Driver change detection (hasActualDriverChange)", () => {
    const checkDriverChange = ({
      isPercentageApproach,
      driverVal,
      pVal,
      aVal,
      baselineVal,
    }) => {
      let hasActualDriverChange = false;
      if (driverVal) {
        if (isPercentageApproach) {
          const numPVal = typeof pVal === "number" ? pVal : parseFloat(pVal);
          if (
            typeof pVal !== "undefined" &&
            pVal !== null &&
            pVal !== "" &&
            !isNaN(numPVal) &&
            Math.abs(numPVal) > 0.0001
          ) {
            hasActualDriverChange = true;
          }
        } else {
          const numAVal = typeof aVal === "number" ? aVal : parseFloat(aVal);
          if (
            typeof aVal !== "undefined" &&
            aVal !== null &&
            aVal !== "" &&
            !isNaN(numAVal) &&
            typeof baselineVal === "number" &&
            !isNaN(baselineVal) &&
            Math.abs(numAVal - baselineVal) > 0.0001
          ) {
            hasActualDriverChange = true;
          }
        }
      }
      return hasActualDriverChange;
    };

    test("Value change: entering 3.0 when baseline is 2.1 triggers change", () => {
      expect(
        checkDriverChange({
          isPercentageApproach: false,
          driverVal: "2-4",
          aVal: 3.0,
          baselineVal: 2.1,
        })
      ).toBe(true);
    });

    test("Value change: entering 0 when baseline is 2.1 triggers change (-100%)", () => {
      expect(
        checkDriverChange({
          isPercentageApproach: false,
          driverVal: "2-4",
          aVal: 0,
          baselineVal: 2.1,
        })
      ).toBe(true);
    });

    test("Value change: entering 2.1 when baseline is 2.1 does NOT trigger change", () => {
      expect(
        checkDriverChange({
          isPercentageApproach: false,
          driverVal: "2-4",
          aVal: 2.1,
          baselineVal: 2.1,
        })
      ).toBe(false);
    });

    test("Value change: empty/unfilled input does NOT trigger change", () => {
      expect(
        checkDriverChange({
          isPercentageApproach: false,
          driverVal: "2-4",
          aVal: null,
          baselineVal: 2.1,
        })
      ).toBe(false);
    });

    test("Percentage change: entering 0% does NOT trigger change", () => {
      expect(
        checkDriverChange({
          isPercentageApproach: true,
          driverVal: "2-4",
          pVal: 0,
        })
      ).toBe(false);
    });

    test("Percentage change: entering 10% triggers change", () => {
      expect(
        checkDriverChange({
          isPercentageApproach: true,
          driverVal: "2-4",
          pVal: 10,
        })
      ).toBe(true);
    });

    test("Percentage change: entering -100% triggers change", () => {
      expect(
        checkDriverChange({
          isPercentageApproach: true,
          driverVal: "2-4",
          pVal: -100,
        })
      ).toBe(true);
    });
  });
});
