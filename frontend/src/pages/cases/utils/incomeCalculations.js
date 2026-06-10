/**
 * Utility functions for income driver calculations.
 *
 * The basic equation is:
 * Total Income = PrimaryIncome + SecondaryIncome + TertiaryIncome + DiversifiedIncome
 *
 * where:
 * PrimaryIncome = Primary2 * (Primary3 * Primary4 - Primary5)
 * SecondaryIncome (if breakdown) = Secondary2 * (Secondary3 * Secondary4 - Secondary5)
 * SecondaryIncome (if no breakdown) = Secondary1
 * TertiaryIncome = Tertiary1
 * DiversifiedIncome = Sum of all diversified questions
 */

/**
 * Calculates Target Primary Income
 */
const getTargetPrimaryIncome = (
  incomeTarget,
  secondaryIncome,
  tertiaryIncome,
  diversifiedIncome
) => {
  return incomeTarget - secondaryIncome - tertiaryIncome - diversifiedIncome;
};

/**
 * Calculates Target Secondary Income
 */
const getTargetSecondaryIncome = (
  incomeTarget,
  primaryIncome,
  tertiaryIncome,
  diversifiedIncome
) => {
  return incomeTarget - primaryIncome - tertiaryIncome - diversifiedIncome;
};

/**
 * Calculates Target Tertiary Income
 */
const getTargetTertiaryIncome = (
  incomeTarget,
  primaryIncome,
  secondaryIncome,
  diversifiedIncome
) => {
  return incomeTarget - primaryIncome - secondaryIncome - diversifiedIncome;
};

/**
 * Calculates Target Diversified Income
 */
const getTargetDiversifiedIncome = (
  incomeTarget,
  primaryIncome,
  secondaryIncome,
  tertiaryIncome
) => {
  return incomeTarget - primaryIncome - secondaryIncome - tertiaryIncome;
};

/**
 * Common formulas for any commodity with breakdown (Primary or Secondary)
 * @param {number} targetIncomeForCommodity - The income this commodity needs to generate
 * @param {Object} drivers - Current values of d2, d3, d4, d5
 * @param {number} qid - The driver ID being calculated (2, 3, 4, or 5)
 */
const calculateBreakdownDriver = (targetIncomeForCommodity, drivers, qid) => {
  const { d2, d3, d4, d5 } = drivers;

  switch (qid) {
    case 2: {
      // d2 * (d3 * d4 - d5) = Target
      // d2 = Target / (d3 * d4 - d5)
      const denom2 = d3 * d4 - d5;
      return denom2 !== 0 ? targetIncomeForCommodity / denom2 : 0;
    }
    case 3: {
      // d2 * (d3 * d4 - d5) = Target
      // d3 * d4 - d5 = Target / d2
      // d3 * d4 = Target / d2 + d5
      // d3 = (Target / d2 + d5) / d4 = (Target + d5 * d2) / (d2 * d4)
      const denom3 = d2 * d4;
      return denom3 !== 0 ? (targetIncomeForCommodity + d5 * d2) / denom3 : 0;
    }
    case 4: {
      // d4 = (Target / d2 + d5) / d3 = (Target + d5 * d2) / (d2 * d3)
      const denom4 = d2 * d3;
      return denom4 !== 0 ? (targetIncomeForCommodity + d5 * d2) / denom4 : 0;
    }
    case 5:
      // d5 = d3 * d4 - Target / d2 = (d2 * d3 * d4 - Target) / d2
      return d2 !== 0 ? (d2 * d3 * d4 - targetIncomeForCommodity) / d2 : 0;
    default:
      return 0;
  }
};

/**
 * Specialized calculation for Advanced Modelling Tool
 * @param {number} targetIncome - The target income level (benchmark - diversified)
 * @param {Object} drivers - Current values of land, volume, price, cop
 * @param {string} qKey - The driver key being calculated ('price', 'volume', 'cop')
 * @param {string} category - Commodity category (Crop, Aquaculture, Livestock)
 */
const calculateModellingDriver = (targetIncome, drivers, qKey, category) => {
  const { land, volume, price, cop } = drivers;
  const isAquaculture = category === "Aquaculture";

  if (land === 0) {
    return 0;
  }

  if (isAquaculture) {
    switch (qKey) {
      case "price": {
        // Income = L * (V * (P - C) + 1)
        // (Income / L - 1) / V + C = P
        return volume !== 0 ? (targetIncome / land - 1) / volume + cop : 0;
      }
      case "volume": {
        // V = (Income / L - 1) / (P - C)
        const denomV = price - cop;
        return denomV !== 0 ? (targetIncome / land - 1) / denomV : 0;
      }
      case "cop": {
        // C = P - (Income / L - 1) / V
        return volume !== 0 ? price - (targetIncome / land - 1) / volume : 0;
      }
      default:
        return 0;
    }
  } else {
    // Crop/Livestock: Income = L * (V * P - C)
    switch (qKey) {
      case "price": {
        // P = (Income / L + C) / V
        return volume !== 0 ? (targetIncome / land + cop) / volume : 0;
      }
      case "volume": {
        // V = (Income / L + C) / P
        return price !== 0 ? (targetIncome / land + cop) / price : 0;
      }
      case "cop": {
        // C = V * P - Income / L
        return volume * price - targetIncome / land;
      }
      default:
        return 0;
    }
  }
};

export {
  getTargetPrimaryIncome,
  getTargetSecondaryIncome,
  getTargetTertiaryIncome,
  getTargetDiversifiedIncome,
  calculateBreakdownDriver,
  calculateModellingDriver,
};
