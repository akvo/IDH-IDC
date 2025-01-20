import React, { useMemo } from "react";
import { Select } from "antd";
import { selectProps } from "../../../lib";
import { uniqBy, capitalize } from "lodash";

const otherCommodities = ["secondary", "tertiary"];

const IncomeDriversDropdown = ({
  selectedSegmentData,
  options = [],
  value,
  onChange,
}) => {
  const driverOptionsDropdown = useMemo(() => {
    if (!selectedSegmentData) {
      return [];
    }
    const focusCommodityAnswers = selectedSegmentData.answers.filter(
      (a) => a.commodityFocus && a.question.question_type !== "diversified"
    );
    const driverQuestions =
      uniqBy(
        focusCommodityAnswers.map((a) => a.question),
        "id"
      ).find((q) => !q.parent)?.childrens || [];
    const focusRes = driverQuestions
      .map((q) => ({
        label: q.text,
        type: "focus",
        value: q.id,
        childrens: q.childrens.map((q) => ({ ...q, type: "focus" })),
      }))
      .filter((x) => x.value !== 2); // remove land driver from dropdown
    // add secondary - tertiary value
    const additonalCommodities = otherCommodities
      .map((x) => {
        const commodity = selectedSegmentData.answers.find(
          (a) =>
            a.commodityType === x && a.question.question_type !== "diversified"
        );
        if (!commodity) {
          return false;
        }
        return {
          text: `Total ${capitalize(x)} / Non Primary - ${
            commodity.commodityName
          }`,
          type: x,
          id: x,
        };
      })
      .filter((x) => x);
    // add diversified questions
    let diversifiedQuestions = selectedSegmentData.answers
      .filter(
        (a) =>
          a.commodityType === "diversified" &&
          a.question.question_type === "diversified"
      )
      .flatMap((a) => a.question);
    diversifiedQuestions = uniqBy(diversifiedQuestions, "id").map((q) => ({
      ...q,
      type: "diversified",
    }));
    const diversifiedRes = [
      {
        label: "Diversified Income",
        type: "diversified",
        value: "diversified",
        childrens: [...additonalCommodities, ...diversifiedQuestions],
      },
    ];
    return [...focusRes, ...diversifiedRes];
  }, [selectedSegmentData]);

  return (
    <Select
      options={driverOptionsDropdown}
      placeholder="Select Driver"
      value={value}
      onChange={onChange}
      {...selectProps}
      allowClear={false}
    />
  );
};

export default IncomeDriversDropdown;
