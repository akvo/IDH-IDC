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

  // Calculate Total Cost
  let totalCost = 0;

  if (investmentData.segments) {
    // New per-segment logic
    Object.keys(investmentData.segments).forEach((segmentId) => {
      const segInv = investmentData.segments[segmentId];
      const segment = segments.find((s) => s.id === segmentId);
      if (!segment) {
        return;
      }

      const farmerCount = segment.number_of_farmers || 0;
      let segTotal = segInv.investment_cost || 0;

      if (segInv.cost_unit === "per_farmer") {
        segTotal *= farmerCount;
      } else if (segInv.cost_unit === "per_land_unit") {
        // Fallback or explicit land area calculation
        // For now, if no components, we assume the UI helped or we use a default
      }
      totalCost += segTotal;
    });
  } else {
    // Legacy/Case-wide logic
    totalCost = investmentData.investment_cost || 0;
    const totalFarmers = segments.reduce(
      (acc, s) => acc + (s.number_of_farmers || 0),
      0
    );

    if (investmentData.cost_unit === "per_farmer") {
      totalCost *= totalFarmers;
    }
  }

  if (totalCost === 0) {
    return {
      roi: 0,
      totalIncomeImprovement,
      totalCost,
    };
  }

  const roi = totalIncomeImprovement / totalCost;
  return {
    roi,
    totalIncomeImprovement,
    totalCost,
  };
};
