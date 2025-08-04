import React, { useMemo } from "react";
import { TreeSelect } from "antd";
import { CaseUIState, CaseVisualState } from "../store";

const getAlphabetLabel = (index) => {
  let label = "";
  while (index >= 0) {
    label = String.fromCharCode(97 + (index % 26)) + label; // 'a' is charCode 97
    index = Math.floor(index / 26) - 1;
  }
  return label;
};

const getRomanNumeral = (num) => {
  const romanMap = [
    [1000, "m"],
    [900, "cm"],
    [500, "d"],
    [400, "cd"],
    [100, "c"],
    [90, "xc"],
    [50, "l"],
    [40, "xl"],
    [10, "x"],
    [9, "ix"],
    [5, "v"],
    [4, "iv"],
    [1, "i"],
  ];

  let result = "";
  for (const [value, symbol] of romanMap) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
};

const generateDriverOptions = ({
  group,
  questions,
  qidWithFeasibleAnswer,
  level = 0,
  parentIndex = "",
  answers = {},
  disableDriversWithZeroChange = false,
}) => {
  return questions
    .filter((q) => {
      const commodityQID = `${group.id}-${q.id}`;
      const checkFeasibleValue = `feasible-${commodityQID}`;
      return qidWithFeasibleAnswer?.includes(checkFeasibleValue);
    })
    .map((q, index) => {
      const commodityQID = `${group.id}-${q.id}`;
      // Ensure q.childrens exists and is an array before recursion
      const hasChildren = Array.isArray(q.childrens) && q.childrens.length > 0;

      /// Dynamically generate numbering based on level
      let numbering = "";
      if (level === 1) {
        numbering = `${index + 1}`; // 1, 2, 3, ...
      } else if (level === 2) {
        numbering = getAlphabetLabel(index); // a, b, c, ..., z, aa, ab, ac...
      } else if (level === 3) {
        numbering = getRomanNumeral(index + 1); // i, ii, iii, iv, v, vi...
      }

      const currentAnswer = answers?.[`current-${commodityQID}`] || 0;
      const feasibleAnswer = answers?.[`feasible-${commodityQID}`] || 0;
      const isAnswerChange = feasibleAnswer - currentAnswer !== 0;

      return {
        value: commodityQID,
        label: q.text,
        // selectable: q.question_type !== "aggregator",
        selectable: disableDriversWithZeroChange
          ? isAnswerChange
          : q.question_type !== "aggregator"
          ? true
          : false,
        disabled: disableDriversWithZeroChange ? !isAnswerChange : false,
        children: hasChildren
          ? generateDriverOptions({
              group,
              questions: q.childrens,
              qidWithFeasibleAnswer,
              level: level + 1, // Increase level for child nodes
              parentIndex: parentIndex + numbering, // Preserve hierarchy numbering,
              disableDriversWithZeroChange,
              answers,
            })
          : null, // Prevent unnecessary recursion
      };
    });
};

// Flatten tree structure for fast lookups
// const flattenTree = (nodes, parent = null, map = {}) => {
//   nodes.forEach((node) => {
//     map[node.value] = {
//       parent,
//       children: node.children?.map((child) => child.value) || [],
//     };
//     if (node.children) {
//       flattenTree(node.children, node.value, map);
//     }
//   });
//   return map;
// };

const AllDriverTreeSelector = ({
  onChange,
  value = [],
  multiple = false,
  segment = {},
  dropdownStyle = {},
  style = {},
  maxCount = null,
  disabledNodes = {},
  disableDriversWithZeroChange = false,
}) => {
  const { enableEditCase } = CaseUIState.useState((s) => s.general);
  const { incomeDataDrivers } = CaseVisualState.useState((s) => s);
  // const [disabledNodes, setDisabledNodes] = useState({});

  // Generate tree structure
  const incomeDriverOptions = useMemo(() => {
    if (!segment?.answers) {
      return [];
    }

    // GENERATE ARRAY TO STORE QID HAS FEASIBLE ANSWER
    const qidWithFeasibleAnswer = Object.entries(segment.answers)
      .map(([key, value]) => {
        if (key.includes("feasible") && !isNaN(value) && value !== null) {
          return key;
        }
        return false;
      })
      .filter((x) => x);
    // EOL GENERATE ARRAY TO STORE QID HAS FEASIBLE ANSWER

    // GENERATE PRIMARY DRIVERS
    const primaryGroup = incomeDataDrivers?.find((d) => d.type === "primary");
    const primaryDrivers = primaryGroup?.questionGroups
      ? primaryGroup?.questionGroups?.map((qg) => {
          // skip the aggregator question
          const skipAggregator = qg.questions
            .map((q) => {
              if (q.question_type === "aggregator") {
                return q.childrens;
              }
              return q;
            })
            .flatMap((x) => x);
          return {
            value: qg.id,
            label: `Primary commodity: ${qg.commodity_name}`,
            selectable: false,
            children: generateDriverOptions({
              group: qg,
              questions: skipAggregator,
              qidWithFeasibleAnswer,
              level: 1,
              disableDriversWithZeroChange,
              answers: segment?.answers || {},
            }),
          };
        })
      : [];
    // EOL GENERATE PRIMARY DRIVERS

    // GENERATE DIVERSIFIED DRIVERS
    const diversifiedGroup = incomeDataDrivers.find(
      (d) => d.type === "diversified"
    );
    const diversifiedDrivers = diversifiedGroup
      ? [diversifiedGroup]
          ?.map((driver) => {
            const caseCommodityId = driver?.questionGroups?.length
              ? driver.questionGroups?.find(
                  (qg) => qg?.commodity_type === "diversified"
                )?.id
              : null;
            return {
              value: caseCommodityId
                ? `${caseCommodityId}-diversified`
                : "diversified",
              title: driver?.groupName,
              selectable: false,
              children: driver?.questionGroups
                ?.map((qg) => {
                  const answerQids = Object.keys(segment?.answers).filter(
                    (key) => key.includes("feasible-")
                  );
                  const isSecondary =
                    qg?.case_commodity_type === "secondary" ||
                    qg?.commodity_type === "secondary";
                  const isTertiary =
                    qg?.case_commodity_type === "tertiary" ||
                    qg?.commodity_type === "tertiary";
                  const isDiversified =
                    qg?.case_commodity_type === "diversified" ||
                    qg?.commodity_type === "diversified";
                  // find agregator
                  const findAggregator = qg.questions.find(
                    (q) => q.question_type === "aggregator"
                  );
                  // skip the aggregator question
                  const skipAggregator = qg.questions
                    .map((q) => {
                      if (q.question_type === "aggregator") {
                        return q.childrens;
                      }
                      return q;
                    })
                    .flatMap((x) => x);
                  // check childs
                  const childrenWithoutAggregator = qg?.questions?.filter(
                    (q) => q?.question_type !== "aggregator"
                  )?.length;

                  let value = qg.id;
                  if (!isDiversified && findAggregator?.id) {
                    value = `${qg.id}-${findAggregator.id}`;
                  }

                  // if secondary or tertiary
                  // check answers available
                  if (isSecondary || isTertiary) {
                    // check aggregator answers defined
                    const aggQids = qg?.questions?.map(
                      (q) => `feasible-${qg.id}-${q.id}`
                    );
                    const hasCommon = aggQids.some((item) =>
                      answerQids.includes(item)
                    );
                    if (!hasCommon) {
                      return null;
                    }
                  }
                  // EOL

                  // if diversified childrens doesn't have segment answers
                  // do not include in drivers selector
                  if (isDiversified) {
                    const diversifiedQids = qg?.questions?.map(
                      (q) => `feasible-${qg.id}-${q.id}`
                    );
                    const hasCommon = diversifiedQids.some((item) =>
                      answerQids.includes(item)
                    );
                    if (!hasCommon) {
                      return null;
                    }
                  }
                  // EOL
                  return {
                    value: value,
                    label: qg.commodity_name,
                    selectable: childrenWithoutAggregator > 0 ? false : true,
                    children: generateDriverOptions({
                      group: qg,
                      questions: skipAggregator,
                      qidWithFeasibleAnswer,
                      level: 1,
                      disableDriversWithZeroChange,
                      answers: segment?.answers || {},
                    }),
                  };
                })
                .filter((x) => x),
            };
          })
          .filter((x) => x?.children?.length)
      : [];
    // EOL GENERATE DIVERSIFIED DRIVERS

    return [...primaryDrivers, ...diversifiedDrivers];
  }, [incomeDataDrivers, segment?.answers, disableDriversWithZeroChange]);

  // TODO :: REMOVE
  // const treeMap = useMemo(
  //   () => flattenTree(incomeDriverOptions),
  //   [incomeDriverOptions]
  // );

  // Update disabled state based on selection
  // const updateSelectableNodes = useCallback(
  //   (selectedValues) => {
  //     if (!multiple) {
  //       // Only apply for multiple select mode
  //       return;
  //     }

  //     const newNonSelectableNodes = {};

  //     selectedValues?.forEach((selected) => {
  //       // Mark all ancestors (parents) as non-selectable
  //       let parent = treeMap[selected]?.parent;
  //       while (parent) {
  //         newNonSelectableNodes[parent] = true;
  //         parent = treeMap[parent]?.parent;
  //       }

  //       // Mark all descendants (children) as non-selectable
  //       const markNonSelectable = (node) => {
  //         if (node) {
  //           newNonSelectableNodes[node] = true;
  //           treeMap[node]?.children.forEach(markNonSelectable);
  //         }
  //       };
  //       markNonSelectable(selected);
  //     });

  //     setDisabledNodes(newNonSelectableNodes); // Store non-selectable nodes
  //   },
  //   [treeMap, multiple]
  // );

  // useEffect(() => {
  //   if (multiple && value && value.length > 0) {
  //     updateSelectableNodes(value); // Recalculate disabled nodes
  //   } else {
  //     setDisabledNodes({}); // Reset if value is empty or not in multiple mode
  //   }
  // }, [value, multiple, updateSelectableNodes]);
  // EOL REMOVE

  // Apply disabled state dynamically
  const modifiedTreeData = useMemo(() => {
    const applySelectableState = (nodes) =>
      nodes.map((node) => {
        const isInitiallySelectable = node.selectable !== false;
        return {
          ...node,
          selectable: isInitiallySelectable && !disabledNodes[node.value],
          disabled: node?.disabled ? node.disabled : disabledNodes[node.value],
          children: node.children ? applySelectableState(node.children) : null,
        };
      });

    return applySelectableState(incomeDriverOptions);
  }, [incomeDriverOptions, disabledNodes]);

  return (
    <TreeSelect
      showSearch
      allowClear
      style={{ width: "100%", ...style }}
      dropdownStyle={{
        maxHeight: 500,
        overflow: "auto",
        ...dropdownStyle,
      }}
      placeholder="Select driver"
      onChange={(newValue) => {
        if (!onChange) {
          return;
        }
        if (multiple) {
          if (!maxCount || newValue.length <= maxCount) {
            onChange(newValue);
          }
        } else {
          onChange(newValue);
        }
      }}
      treeData={modifiedTreeData}
      disabled={!enableEditCase}
      treeDefaultExpandedKeys={[
        ...incomeDriverOptions.map((item) => item.value),
        ...value,
      ]} // Expands only first-level nodes
      treeNodeFilterProp="label"
      multiple={multiple}
      value={value}
    />
  );
};

export default AllDriverTreeSelector;
