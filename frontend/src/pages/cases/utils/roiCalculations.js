/**
 * ROI Calculation Utility
 *
 * ROI = (Total Net Income improvement across all segments) / (Total Investment Cost)
 *
 * Total Net Income improvement = Sum over all segments:
 *   ( (Scenario Net Income - Baseline Net Income) * Number of Farmers in segment )
 */

export const calculateScenarioROI = (
  scenario,
  investmentAnalysis,
  segments = []
) => {
  if (!scenario || !investmentAnalysis?.is_enabled) {
    return null;
  }

  const scenarioKey = scenario.key;
  const investmentData = investmentAnalysis.scenarios?.[scenarioKey];

  if (!investmentData || !investmentData.investment_cost) {
    return null;
  }

  let totalIncomeImprovement = 0;

  // Iterate over scenario values (which contain segment-specific calculations)
  scenario.scenarioValues?.forEach((sv) => {
    const segmentId = sv.segmentId;
    const segment = segments.find((s) => s.id === segmentId);
    if (!segment) {
      return;
    }

    const farmerCount = segment.number_of_farmers || 0;
    const baselineIncome = sv.currentSegmentValue?.total_current_income || 0;
    const scenarioIncome =
      sv.updatedSegmentScenarioValue?.total_feasible_income || 0;

    const netIncomeChange = scenarioIncome - baselineIncome;
    totalIncomeImprovement += netIncomeChange * farmerCount;
  });

  // Calculate Total Cost based on unit
  let totalCost = investmentData.investment_cost;
  const totalFarmers = segments.reduce(
    (acc, s) => acc + (s.number_of_farmers || 0),
    0
  );

  if (investmentData.cost_unit === "per_farmer") {
    totalCost = investmentData.investment_cost * totalFarmers;
  } else if (investmentData.cost_unit === "per_land_unit") {
    // Note: This requires summing land units across focus commodities in all segments
    // For now, if per_land_unit is selected, we expect the UI to have helped calculate totalCost
    // Or we stick to the provided investment_cost if it was already entered as a total.
    // In our UI, investment_cost is the value entered by the user.
  }

  if (totalCost === 0) {
    return 0;
  }

  const roi = totalIncomeImprovement / totalCost;
  return {
    roi,
    totalIncomeImprovement,
    totalCost,
  };
};
