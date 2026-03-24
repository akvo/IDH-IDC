/**
 * ROI Calculation Utility
 *
 * ROI = (Total Net Income improvement across all segments) / (Total Investment Cost)
 *
 * Total Net Income improvement = Sum over all segments:
 *   ( (Scenario Net Income - Baseline Net Income) * Number of Farmers in segment )
 */

export const getLandArea = (segment) => {
  if (!segment?.answers) {
    return 0;
  }

  // Handle Array format (remapped in Case.js for dashboardData)
  if (Array.isArray(segment.answers)) {
    const parentAnswer = segment.answers.find(
      (a) => a.questionId === 2 && a.name === "current"
    );
    if (parentAnswer && parseFloat(parentAnswer.value) > 0) {
      return parseFloat(parentAnswer.value);
    }

    const childAnswer = segment.answers.find(
      (a) => (a.questionId === 6 || a.questionId === 7) && a.name === "current"
    );
    return childAnswer ? parseFloat(childAnswer.value) || 0 : 0;
  }

  // Handle Object format (raw data from backend/currentCase)
  // Keys are "current-[commodity_id]-[question_id]"
  const allKeys = Object.keys(segment.answers);
  const parentKey = allKeys.find(
    (k) => k.endsWith("-2") && k.startsWith("current-")
  );

  if (parentKey && parseFloat(segment.answers[parentKey]) > 0) {
    return parseFloat(segment.answers[parentKey]);
  }

  const childKey = allKeys.find(
    (k) => (k.endsWith("-6") || k.endsWith("-7")) && k.startsWith("current-")
  );
  return childKey ? parseFloat(segment.answers[childKey]) || 0 : 0;
};

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

  if (!investmentData) {
    return null;
  }

  const costAllocationMode =
    investmentData.cost_allocation_mode ||
    (investmentData.is_roi_enabled ? "per_segment" : "no");

  if (costAllocationMode === "no") {
    return null;
  }

  let totalIncomeImprovement = 0;
  const totalFarmers = segments.reduce(
    (acc, s) => acc + (s.number_of_farmers || 0),
    0
  );

  // Iterate over scenario values (which contain segment-specific calculations)
  scenario.scenarioValues?.forEach((sv) => {
    const segmentId = sv.segmentId;
    const segment = segments.find((s) => String(s.id) === String(segmentId));
    if (!segment) {
      return;
    }

    const farmerCount = segment.number_of_farmers || 0;
    const baselineIncome = sv.currentSegmentValue?.total_current_income || 0;
    const scenarioIncome =
      sv.updatedSegmentScenarioValue?.total_current_income || 0;

    const netIncomeChange = scenarioIncome - baselineIncome;
    totalIncomeImprovement += netIncomeChange * farmerCount;
  });

  // Calculate Total Cost and Investment Configuration
  let totalCost = 0;
  let investmentPerSegment = {};
  const componentBreakdown = {};

  if (costAllocationMode === "all_farmers") {
    const allFarmersConfig = investmentData.all_farmers_config || {};
    const components = allFarmersConfig.components || [];

    if (components.length > 0) {
      totalCost = components.reduce((acc, comp) => {
        let multiplier = 1;
        if (comp.unit === "per_farmer") {
          multiplier = totalFarmers;
        } else if (comp.unit === "per_land_unit") {
          multiplier = segments.reduce(
            (sum, s) => sum + (s.number_of_farmers || 0) * getLandArea(s),
            0
          );
        }
        const compTotal = (comp.cost || 0) * multiplier;
        const name = comp.name || "Other";
        componentBreakdown[name] = (componentBreakdown[name] || 0) + compTotal;
        return acc + compTotal;
      }, 0);
    } else {
      totalCost = allFarmersConfig.investment_cost || 0;
      if (allFarmersConfig.cost_unit === "per_farmer") {
        totalCost *= totalFarmers;
      } else if (allFarmersConfig.cost_unit === "per_land_unit") {
        const totalArea = segments.reduce(
          (sum, s) => sum + (s.number_of_farmers || 0) * getLandArea(s),
          0
        );
        totalCost *= totalArea;
      }
    }

    // Distribute to segments
    segments.forEach((s) => {
      const farmerCount = s.number_of_farmers || 0;
      const ratio = totalFarmers > 0 ? farmerCount / totalFarmers : 0;
      investmentPerSegment[s.id] = {
        investment_cost: totalCost * ratio,
        cost_unit: "total",
        components: components.map((comp) => {
          // For components, we also distribute their total cost share
          let multiplier = 1;
          if (comp.unit === "per_farmer") {
            multiplier = totalFarmers;
          } else if (comp.unit === "per_land_unit") {
            multiplier = segments.reduce(
              (sum, seg) =>
                sum + (seg.number_of_farmers || 0) * getLandArea(seg),
              0
            );
          }
          const scenarioCompTotal = (comp.cost || 0) * multiplier;
          return {
            ...comp,
            cost: scenarioCompTotal * ratio,
            unit: "total",
          };
        }),
      };
    });
  } else if (investmentData.segments) {
    // Per-segment logic
    investmentPerSegment = investmentData.segments;
    Object.keys(investmentPerSegment).forEach((segmentId) => {
      const segInv = investmentPerSegment[segmentId];
      const segment = segments.find((s) => String(s.id) === String(segmentId));
      if (!segment) {
        return;
      }

      const farmerCount = segment.number_of_farmers || 0;
      const landArea = getLandArea(segment);
      let segTotal = segInv.investment_cost || 0;

      if (segInv.cost_unit === "per_farmer") {
        segTotal *= farmerCount;
      } else if (segInv.cost_unit === "per_land_unit") {
        segTotal *= farmerCount * landArea;
      }
      totalCost += segTotal;

      // Component Breakdown
      (segInv.components || []).forEach((comp) => {
        const name = comp.name || "Other";
        let multiplier = 1;
        if (comp.unit === "per_farmer") {
          multiplier = farmerCount;
        } else if (comp.unit === "per_land_unit") {
          multiplier = farmerCount * landArea;
        }
        const compTotal = (comp.cost || 0) * multiplier;
        componentBreakdown[name] = (componentBreakdown[name] || 0) + compTotal;
      });
    });
  } else {
    // Legacy/Case-wide logic (no explicit mode yet)
    totalCost = investmentData.investment_cost || 0;
    if (investmentData.cost_unit === "per_farmer") {
      totalCost *= totalFarmers;
    } else if (investmentData.cost_unit === "per_land_unit") {
      const totalArea = segments.reduce(
        (sum, s) => sum + (s.number_of_farmers || 0) * getLandArea(s),
        0
      );
      totalCost *= totalArea;
    }

    // Distribute proportionally
    segments.forEach((s) => {
      const farmerCount = s.number_of_farmers || 0;
      const ratio = totalFarmers > 0 ? farmerCount / totalFarmers : 0;
      investmentPerSegment[s.id] = {
        investment_cost: totalCost * ratio,
        cost_unit: "total",
      };
    });
  }

  if (totalCost === 0) {
    return {
      roi: 0,
      impactPercentage: 0,
      paybackPeriod: null,
      incomeImprovementPercentage: 0,
      totalIncomeImprovement,
      totalCost,
      componentBreakdown,
      investmentPerSegment,
      segmentMetrics: {},
      segmentComponentBreakdowns: {},
    };
  }

  const roi = totalIncomeImprovement / totalCost;

  // Calculate Aggregate Metrics
  const totalBaselineIncome = scenario.scenarioValues?.reduce(
    (acc, sv) =>
      acc +
      (sv.currentSegmentValue?.total_current_income || 0) *
        (segments.find((s) => String(s.id) === String(sv.segmentId))
          ?.number_of_farmers || 0),
    0
  );

  const incomeImprovementPercentage =
    totalBaselineIncome > 0
      ? (totalIncomeImprovement / totalBaselineIncome) * 100
      : 0;

  const impactPercentage =
    totalCost > 0 ? (incomeImprovementPercentage / totalCost) * 100 : 0;

  const paybackPeriod =
    totalIncomeImprovement > 0 ? totalCost / totalIncomeImprovement : null;

  // Calculate Segment Metrics
  const segmentMetrics = {};
  const segmentComponentBreakdowns = {};

  scenario.scenarioValues?.forEach((sv) => {
    const segmentId = sv.segmentId;
    const segment = segments.find((s) => String(s.id) === String(segmentId));
    const segInv = investmentPerSegment[segmentId];
    if (!segment || !segInv) {
      return;
    }

    const farmerCount = segment.number_of_farmers || 0;
    const baselineIncome = sv.currentSegmentValue?.total_current_income || 0;
    const scenarioIncome =
      sv.updatedSegmentScenarioValue?.total_current_income || 0;
    const incomeImprovement = (scenarioIncome - baselineIncome) * farmerCount;

    const compBreakdown = {};
    const totalSegCostFromComponents = (segInv.components || []).reduce(
      (acc, comp) => {
        let multiplier = 1;
        if (comp.unit === "per_farmer") {
          multiplier = farmerCount;
        } else if (comp.unit === "per_land_unit") {
          multiplier = farmerCount * getLandArea(segment);
        }
        const compTotal = (comp.cost || 0) * multiplier;
        const name = comp.name || "Other";
        compBreakdown[name] = (compBreakdown[name] || 0) + compTotal;
        return acc + compTotal;
      },
      0
    );

    const totalSegCost =
      totalSegCostFromComponents > 0
        ? totalSegCostFromComponents
        : segInv.investment_cost || 0;

    // Add dummy component if no components but cost exists (for charts)
    if (totalSegCostFromComponents === 0 && totalSegCost > 0) {
      compBreakdown["Scenario Cost"] = totalSegCost;
    }

    segmentComponentBreakdowns[segmentId] = compBreakdown;
    segmentMetrics[segmentId] = {
      incomeImprovement,
      incomeImprovementPercentage:
        baselineIncome > 0
          ? ((scenarioIncome - baselineIncome) / baselineIncome) * 100
          : 0,
      paybackPeriod:
        incomeImprovement > 0 ? totalSegCost / incomeImprovement : null,
      totalCost: totalSegCost,
      roi: totalSegCost > 0 ? incomeImprovement / totalSegCost : 0,
    };
  });

  const result = {
    roi,
    impactPercentage,
    paybackPeriod,
    incomeImprovementPercentage,
    totalIncomeImprovement,
    totalCost,
    componentBreakdown,
    investmentPerSegment,
    segmentMetrics,
    segmentComponentBreakdowns,
  };

  return result;
};
