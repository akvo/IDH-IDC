// handle recalculate the section total values
const handleQuestionType = (
  question,
  commodity,
  fieldName,
  values,
  fieldKey,
  flattenQuestionList,
  updateSectionTotalValues = (/*commodity_type, fieldName, value*/) => {}
) => {
  if (!question?.parent) {
    // handle aggregator and diversified questions
    if (question?.question_type === "aggregator") {
      const value = values?.[`${fieldKey}-${question.id}`] || 0;
      updateSectionTotalValues(commodity.commodity_type, fieldName, value);
    } else if (question?.question_type === "diversified") {
      const diversifiedQuestions = flattenQuestionList.filter(
        (q) => q.question_type === "diversified"
      );
      const diversifiedQids = diversifiedQuestions.map(
        (q) => `${fieldKey}-${q.id}`
      );
      const sumAllDiversifiedValues = diversifiedQids.reduce((acc, id) => {
        const value = values?.[id];
        return value ? acc + value : acc;
      }, 0);
      updateSectionTotalValues(
        commodity.commodity_type,
        fieldName,
        sumAllDiversifiedValues
      );
    }
  }
};

export { handleQuestionType };
