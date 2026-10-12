import { checkNoPrimaryProfit } from "../../utils";

describe("Step 3 Income Gating Logic (checkNoPrimaryProfit)", () => {
  const currentCase = {
    case_commodities: [
      { id: 101, commodity_type: "focus", name: "Cocoa" },
      { id: 102, commodity_type: "secondary", name: "Maize" },
    ],
  };

  it("returns true when primary commodity current profit is negative", () => {
    const dashboardData = {
      id: 1,
      name: "Segment A",
      total_current_income: 1500,
      target: 4000,
      answers: [
        {
          caseCommodityId: 101,
          name: "current",
          value: -500,
          question: { question_type: "aggregator", parent: null },
        },
      ],
    };

    expect(checkNoPrimaryProfit(currentCase, dashboardData)).toBe(true);
  });

  it("returns true when primary commodity current profit is exactly zero", () => {
    const dashboardData = {
      id: 1,
      name: "Segment A",
      total_current_income: 1500,
      target: 4000,
      answers: [
        {
          caseCommodityId: 101,
          name: "current",
          value: 0,
          question: { question_type: "aggregator", parent: null },
        },
      ],
    };

    expect(checkNoPrimaryProfit(currentCase, dashboardData)).toBe(true);
  });

  it("returns false when primary commodity current profit is positive", () => {
    const dashboardData = {
      id: 1,
      name: "Segment A",
      total_current_income: 3500,
      target: 4000,
      answers: [
        {
          caseCommodityId: 101,
          name: "current",
          value: 2000,
          question: { question_type: "aggregator", parent: null },
        },
      ],
    };

    expect(checkNoPrimaryProfit(currentCase, dashboardData)).toBe(false);
  });

  it("returns false when case has no focus commodity", () => {
    const caseWithoutFocus = {
      case_commodities: [{ id: 102, commodity_type: "secondary" }],
    };
    const dashboardData = {
      id: 1,
      answers: [
        {
          caseCommodityId: 102,
          name: "current",
          value: -100,
          question: { question_type: "aggregator", parent: null },
        },
      ],
    };

    expect(checkNoPrimaryProfit(caseWithoutFocus, dashboardData)).toBe(false);
  });

  it("returns false when dashboardData or answers are missing/empty", () => {
    expect(checkNoPrimaryProfit(currentCase, null)).toBe(false);
    expect(checkNoPrimaryProfit(currentCase, { id: 1, answers: [] })).toBe(
      false
    );
    expect(checkNoPrimaryProfit(null, null)).toBe(false);
  });
});
