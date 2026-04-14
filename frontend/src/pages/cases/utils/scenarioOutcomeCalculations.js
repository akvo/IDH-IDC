import { thousandFormatter } from "../../../components/chart/options/common";
import { flatten } from "../../../lib";
import { uniqBy, isEmpty, orderBy } from "lodash";

export const outcomeIndicator = [
  {
    key: "number_of_farmers",
    name: "How many farmers are in this segment?",
  },
  {
    key: "income_driver",
    name: "What income drivers have changed?",
  },
  {
    key: "income_gap",
    name: "How big is the income gap?",
  },
  {
    key: "income_target_reached",
    name: "Is the income target reached?",
  },
  {
    key: "income_increase",
    name: "What is the income increase?",
  },
  {
    key: "income_increase_percentage",
    name: "What is the % income increase?",
  },
  {
    key: "monetary_value_income_gap",
    name: "What is the monetary value of the income gap?",
  },
];

export const calculateOutcomeData = (
  scenarioData = [],
  dashboardData = [],
  questionGroups = []
) => {
  const allQuestions = uniqBy(
    questionGroups.flatMap((qg) => flatten(qg.questions)),
    "id"
  );

  const allScenarioOutcomes = dashboardData.map((currentDashboardData) => {
    const data = outcomeIndicator.map((ind) => {
      const res = { id: ind.key, title: ind.name };

      // 1. Number of Farmers
      if (ind.key === "number_of_farmers") {
        res.current = currentDashboardData?.number_of_farmers || "-";
        scenarioData.forEach((sd) => {
          const scenarioKey = `scenario-${sd.key}`;
          const scenarioSegment =
            sd.scenarioValues.find(
              (sv) => sv.segmentId === currentDashboardData.id
            ) || {};
          res[scenarioKey] =
            scenarioSegment?.updatedSegmentScenarioValue?.number_of_farmers ||
            res.current;
        });
      }

      // 2. Income Driver (Note: In the utility we store raw data, the Table component handles rendering Space/Tags)
      if (ind.key === "income_driver") {
        res.current = "-";
        scenarioData.forEach((sd) => {
          const scenarioKey = `scenario-${sd.key}`;
          const scenarioSegment =
            sd.scenarioValues.find(
              (sv) => sv.segmentId === currentDashboardData.id
            ) || {};
          const scenarioDriverValues = scenarioSegment?.selectedDrivers
            ?.filter((d) => d.value)
            ?.map((driver) => {
              const [, , , index] = driver.field.split("-");
              const fieldKey = `${sd.key}-${scenarioSegment.segmentId}-${index}`;
              const absoluteField = `absolute-${fieldKey}`;
              const percentageField = `percentage-${fieldKey}`;

              const [, questionId] = driver.value.split("-");

              const findQuestion = allQuestions.find(
                (q) => q.id === parseInt(questionId)
              );
              const currentValue =
                scenarioSegment?.currentSegmentValue?.answers?.find(
                  (a) =>
                    a.name === "current" &&
                    a.questionId === parseInt(questionId)
                )?.value;

              return {
                questionId: findQuestion?.id,
                questionText: findQuestion?.text,
                questionType: findQuestion?.question_type,
                absolute: scenarioSegment?.allNewValues?.[absoluteField] || 0,
                percentage:
                  scenarioSegment?.allNewValues?.[percentageField] || 0,
                currentValue: currentValue || 0,
                index,
              };
            })
            .filter((sdv) => sdv && sdv.questionId);

          if (isEmpty(scenarioDriverValues)) {
            res[scenarioKey] = "-";
          } else {
            // Return legacy string format for UI compatibility: "Text#(Percent)|Text2#(Percent2)"
            res[scenarioKey] = orderBy(
              uniqBy(scenarioDriverValues, "questionId"),
              "questionId"
            )
              .map((sdv) => {
                let percentChange = "~";
                // Only use percentage if it was explicitly provided in allNewValues
                const hasPercentage =
                  typeof scenarioSegment?.allNewValues?.[
                    `percentage-${sd.key}-${scenarioSegment.segmentId}-${sdv.index}`
                  ] !== "undefined";

                if (hasPercentage) {
                  percentChange = `${parseFloat(sdv.percentage)?.toFixed(2)}%`;
                } else if (sdv.absolute !== 0 && sdv.currentValue !== 0) {
                  percentChange =
                    (
                      ((sdv.absolute - sdv.currentValue) / sdv.currentValue) *
                      100
                    ).toFixed(2) + "%";
                }

                const text =
                  sdv.questionType === "diversified" || !sdv.questionText
                    ? "Diversified Income"
                    : sdv.questionText;
                return `${text}#(${percentChange})`;
              })
              .join("|");
          }
        });
      }

      // 3. Income Target Reached
      if (ind.key === "income_target_reached") {
        res.current =
          currentDashboardData.target <=
          currentDashboardData.total_current_income
            ? "reached"
            : "not_reached";
        scenarioData.forEach((sd) => {
          const scenarioKey = `scenario-${sd.key}`;
          const scenarioSegment =
            sd.scenarioValues.find(
              (sv) => sv.segmentId === currentDashboardData.id
            ) || {};
          const newTotalIncome =
            scenarioSegment?.updatedSegmentScenarioValue
              ?.total_current_income ??
            currentDashboardData.total_current_income;
          res[scenarioKey] =
            currentDashboardData.target <= newTotalIncome
              ? "reached"
              : "not_reached";
        });
      }

      // 4. Income Gap
      if (ind.key === "income_gap") {
        const currentGap =
          currentDashboardData.target -
          currentDashboardData.total_current_income;
        res.current =
          currentGap <= 0 ? "-" : thousandFormatter(currentGap.toFixed(2));
        scenarioData.forEach((sd) => {
          const scenarioKey = `scenario-${sd.key}`;
          const scenarioSegment =
            sd.scenarioValues.find(
              (sv) => sv.segmentId === currentDashboardData.id
            ) || {};
          const segmentValue =
            scenarioSegment?.updatedSegmentScenarioValue
              ?.total_current_income ??
            currentDashboardData.total_current_income;
          const segmentGap = currentDashboardData.target - segmentValue;
          res[scenarioKey] =
            segmentGap <= 0 ? "-" : thousandFormatter(segmentGap.toFixed(2));
        });
      }

      // 5. Income Increase
      if (ind.key === "income_increase") {
        res.current = "-";
        scenarioData.forEach((sd) => {
          const scenarioKey = `scenario-${sd.key}`;
          const scenarioSegment =
            sd.scenarioValues.find(
              (sv) => sv.segmentId === currentDashboardData.id
            ) || {};
          const segmentValue =
            scenarioSegment?.updatedSegmentScenarioValue
              ?.total_current_income ??
            currentDashboardData.total_current_income;
          const incomeIncrease =
            segmentValue - currentDashboardData.total_current_income;
          res[scenarioKey] =
            Math.abs(incomeIncrease) < 0.01
              ? "-"
              : thousandFormatter(incomeIncrease.toFixed(2));
        });
      }

      // 6. Income Increase %
      if (ind.key === "income_increase_percentage") {
        res.current = "-";
        scenarioData.forEach((sd) => {
          const scenarioKey = `scenario-${sd.key}`;
          const scenarioSegment =
            sd.scenarioValues.find(
              (sv) => sv.segmentId === currentDashboardData.id
            ) || {};
          const segmentValue =
            scenarioSegment?.updatedSegmentScenarioValue
              ?.total_current_income ??
            currentDashboardData.total_current_income;
          const incomeIncrease =
            segmentValue - currentDashboardData.total_current_income;
          let incomeIncreasePercent = "-";
          if (
            currentDashboardData.total_current_income > 0 &&
            Math.abs(incomeIncrease) >= 0.01
          ) {
            incomeIncreasePercent =
              (
                (incomeIncrease / currentDashboardData.total_current_income) *
                100
              ).toFixed(2) + "%";
          }
          res[scenarioKey] = incomeIncreasePercent;
        });
      }

      // 7. Monetary Gap
      if (ind.key === "monetary_value_income_gap") {
        const currentGap =
          currentDashboardData.target -
          currentDashboardData.total_current_income;
        const currentMonetary =
          currentGap * (currentDashboardData?.number_of_farmers || 0);
        res.current =
          currentMonetary > 0
            ? thousandFormatter(currentMonetary.toFixed(2))
            : "-";
        scenarioData.forEach((sd) => {
          const scenarioKey = `scenario-${sd.key}`;
          const scenarioSegment =
            sd.scenarioValues.find(
              (sv) => sv.segmentId === currentDashboardData.id
            ) || {};
          const segmentValue =
            scenarioSegment?.updatedSegmentScenarioValue
              ?.total_current_income ??
            currentDashboardData.total_current_income;
          const segmentGap = currentDashboardData.target - segmentValue;
          const segmentFarmers =
            scenarioSegment?.updatedSegmentScenarioValue?.number_of_farmers ??
            currentDashboardData.number_of_farmers ??
            0;
          const segmentMonetary = segmentGap * segmentFarmers;
          res[scenarioKey] =
            segmentMonetary > 0
              ? thousandFormatter(segmentMonetary.toFixed(2))
              : "-";
        });
      }

      return res;
    });
    return {
      segmentId: currentDashboardData.id,
      segmentName: currentDashboardData.name,
      scenarioOutcome: data,
    };
  });

  return allScenarioOutcomes;
};
