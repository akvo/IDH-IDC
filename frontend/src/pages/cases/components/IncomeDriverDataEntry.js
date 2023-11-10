import React, { useState, useEffect } from "react";
import { Row, Col, Tabs, message } from "antd";
import { PlusCircleFilled } from "@ant-design/icons";
import { DataFields, generateSegmentPayloads } from "./";
import { api } from "../../../lib";
import { orderBy } from "lodash";

const defaultItems = {
  key: "add",
  label: (
    <span>
      <PlusCircleFilled /> Add Segment
    </span>
  ),
  currentSegmentId: null,
};

const IncomeDriverDataEntry = ({
  commodityList,
  currentCaseId,
  currentCase,
  // setCaseData,
  questionGroups,
  setQuestionGroups,
  totalIncomeQuestion,
  dashboardData,
  finished,
  setFinished,
  segmentFormValues,
  setSegmentFormValues,
}) => {
  const [activeKey, setActiveKey] = useState("1");
  const [items, setItems] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let itemsTmp = segmentFormValues;
    if (itemsTmp.length !== 5) {
      itemsTmp = [...itemsTmp, defaultItems];
    }
    setItems(itemsTmp);
  }, [segmentFormValues]);

  useEffect(() => {
    if (commodityList.length === 0 && !currentCaseId) {
      return;
    }
    api.get(`/questions/${currentCaseId}`).then((res) => {
      // reorder question to match commodity list order (CORRECT ORDER)
      const dataTmp = commodityList.map((cl) =>
        res.data.find((d) => d.commodity_id === cl.commodity)
      );
      setQuestionGroups(dataTmp);
    });
  }, [commodityList, setQuestionGroups, currentCaseId]);

  // useEffect(() => {
  //   const formValuesWithTotalCurrentIncomeAnswer = segmentFormValues.map(
  //     (currentFormValue) => {
  //       const totalCurrentIncomeAnswer = totalIncomeQuestion
  //         .map((qs) => currentFormValue?.answers[`current-${qs}`])
  //         .filter((a) => a)
  //         .reduce((acc, a) => acc + a, 0);
  //       const totalFeasibleIncomeAnswer = totalIncomeQuestion
  //         .map((qs) => currentFormValue?.answers[`feasible-${qs}`])
  //         .filter((a) => a)
  //         .reduce((acc, a) => acc + a, 0);
  //       return {
  //         ...currentFormValue,
  //         total_current_income: totalCurrentIncomeAnswer,
  //         total_feasible_income: totalFeasibleIncomeAnswer,
  //       };
  //     }
  //   );
  //   setCaseData(formValuesWithTotalCurrentIncomeAnswer);
  // }, [segmentFormValues, setCaseData, totalIncomeQuestion]);

  // handle save here
  const handleSave = () => {
    setIsSaving(true);
    const completed = finished.filter(
      (item) => item !== "Income Driver Data Entry"
    );
    const apiCalls = [];
    const postFormValues = segmentFormValues.filter(
      (fv) => !fv.currentSegmentId
    );
    const putFormValues = segmentFormValues.filter((fv) => fv.currentSegmentId);
    if (postFormValues.length) {
      const postPayloads = generateSegmentPayloads(
        postFormValues,
        currentCaseId,
        commodityList
      );
      apiCalls.push(api.post("/segment", postPayloads));
    }
    if (putFormValues.length) {
      const putPayloads = generateSegmentPayloads(
        putFormValues,
        currentCaseId,
        commodityList
      );
      apiCalls.push(api.put("/segment", putPayloads));
    }
    // api call
    Promise.all(apiCalls)
      .then((results) => {
        const [res, ,] = results;
        // handle after POST
        const { data } = res;
        // set currentSegmentId to items state
        const transformItems = items.map((it) => {
          const findNewItem = data.find((d) => d.name === it.label);
          return {
            ...it,
            ...findNewItem,
            currentSegmentId: findNewItem?.id || it.currentSegmentId,
          };
        });
        setItems(transformItems);
        // eol set currentSegmentId to items state

        // update form values
        const transformFormValues = segmentFormValues.map((fv) => {
          const findItem = transformItems.find((it) => it.key === fv.key);
          if (!findItem) {
            return fv;
          }
          return {
            ...findItem,
            ...fv,
          };
        });
        setSegmentFormValues(transformFormValues);
        messageApi.open({
          type: "success",
          content: "Segments saved successfully.",
        });
        setTimeout(() => {
          setFinished([...completed, "Income Driver Data Entry"]);
        }, 100);
      })
      .catch((e) => {
        console.error(e);
        messageApi.open({
          type: "error",
          content: "Failed to save segments.",
        });
        setFinished(completed);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  // useEffect(() => {
  //   if (commodityList.length === 0 && !currentCaseId) {
  //     return;
  //   }
  //   api.get(`/questions/${currentCaseId}`).then((res) => {
  //     const defaultItems = [
  //       {
  //         key: "add",
  //         label: (
  //           <span>
  //             <PlusCircleFilled /> Add Segment
  //           </span>
  //         ),
  //         currentSegmentId: null,
  //       },
  //     ];
  //     // reorder question to match commodity list order (CORRECT ORDER)
  //     const dataTmp = commodityList.map((cl) =>
  //       res.data.find((d) => d.commodity_id === cl.commodity)
  //     );
  //     setQuestionGroups(dataTmp);
  //     // load segment from database
  //     api
  //       .get(`segment/case/${currentCaseId}`)
  //       .then((res) => {
  //         const { data } = res;
  //         let itemsTmp = orderBy(data, "id").map((it, itIndex) => ({
  //           key: String(itIndex + 1),
  //           label: it.name,
  //           currentSegmentId: it.id,
  //           ...it,
  //         }));
  //         const segmentFormValuesTmp = orderBy(data, "id").map(
  //           (it, itIndex) => ({
  //             key: String(itIndex + 1),
  //             label: it.name,
  //             currentSegmentId: it.id,
  //             answers: it.answers,
  //             ...it,
  //           })
  //         );
  //         if (itemsTmp.length !== 5) {
  //           itemsTmp = [...itemsTmp, ...defaultItems];
  //         }
  //         setItems(itemsTmp);
  //         setSegmentFormValues(segmentFormValuesTmp);
  //       })
  //       .catch(() => {
  //         // default items if no segments in database
  //         setItems([
  //           {
  //             key: "1",
  //             label: "Segment 1",
  //             currentSegmentId: null,
  //           },
  //           ...defaultItems,
  //         ]);
  //         setSegmentFormValues([
  //           {
  //             key: "1",
  //             label: "Segment 1",
  //             currentSegmentId: null,
  //             answers: {},
  //           },
  //         ]);
  //       });
  //   });
  // }, [commodityList, setQuestionGroups, currentCaseId]);

  const handleRemoveSegmentFromItems = (segmentKey) => {
    // handle form values
    const filteredFormValues = segmentFormValues.filter(
      (x) => x.key !== segmentKey
    );
    setSegmentFormValues(filteredFormValues);
    // eol handle form values
    const newItems = items.filter((item) => item.key !== segmentKey);
    setItems(newItems);
    const newActiveKey = segmentKey - 1;
    setActiveKey(newActiveKey.toString());
  };

  const onDelete = (segmentKey) => {
    // delete segment & segment answers
    const currentSegmentId =
      items.find((item) => item.key === segmentKey)?.currentSegmentId || null;
    if (currentSegmentId) {
      api
        .delete(`segment/${currentSegmentId}`)
        .then(() => {
          handleRemoveSegmentFromItems(segmentKey);
        })
        .catch((e) => {
          console.error(e);
          messageApi.open({
            type: "error",
            content: "Failed to delete a segment.",
          });
        });
    } else {
      handleRemoveSegmentFromItems(segmentKey);
    }
  };

  const renameItem = (activeKey, newLabel) => {
    const newItem = items.map((item, itemIndex) => {
      if (item.key === activeKey.toString()) {
        item.label = newLabel;
        item.children = (
          <DataFields
            segment={activeKey}
            dashboardData={dashboardData}
            segmentLabel={newLabel}
            questionGroups={questionGroups}
            totalIncomeQuestion={totalIncomeQuestion}
            onDelete={itemIndex ? () => onDelete(activeKey) : false}
            commodityList={commodityList}
            renameItem={renameItem}
            segmentFormValues={segmentFormValues}
            setSegmentFormValues={setSegmentFormValues}
            segmentItem={{ ...item, label: newLabel }}
            handleSave={handleSave}
            isSaving={isSaving}
            currentCaseId={currentCaseId}
            currentCase={currentCase}
          />
        );
        // handle form values
        const filteredFormValues = segmentFormValues.filter(
          (x) => x.key !== item.key
        );
        const currentFormValue = segmentFormValues.find(
          (x) => x.key === item.key
        ) || {
          ...item,
          answers: {},
        };
        setSegmentFormValues([
          ...filteredFormValues,
          {
            ...currentFormValue,
            label: newLabel,
          },
        ]);
        // EOL handle form values
      }
      return item;
    });
    setItems(newItem);
    setActiveKey(activeKey.toString());
  };

  const onChange = (activeKey) => {
    if (activeKey === "add") {
      const newKey = items.length;
      const newItems = [...items];
      newItems.splice(newItems.length - 1, 0, {
        key: newKey.toString(),
        label: `Segment ${newKey}`,
        currentSegmentId: null,
      });
      setItems(newItems);
      setActiveKey(newKey.toString());

      if (newKey === 5) {
        newItems.splice(newItems.length - 1, 1);
        setItems(newItems);
      }
      setSegmentFormValues([
        ...segmentFormValues,
        {
          key: newKey.toString(),
          label: `Segment ${newKey}`,
          currentSegmentId: null,
          answers: {},
        },
      ]);
    } else {
      setActiveKey(activeKey);
    }
  };

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        {contextHolder}
        <Tabs
          onChange={onChange}
          activeKey={activeKey}
          items={items.map((item, itemIndex) => ({
            ...item,
            children:
              item.key === "add" ? null : (
                <DataFields
                  segment={item.key}
                  dashboardData={dashboardData}
                  segmentLabel={item.label}
                  onDelete={itemIndex ? () => onDelete(item.key) : false}
                  questionGroups={questionGroups}
                  totalIncomeQuestion={totalIncomeQuestion}
                  commodityList={commodityList}
                  renameItem={renameItem}
                  segmentFormValues={segmentFormValues}
                  setSegmentFormValues={setSegmentFormValues}
                  segmentItem={item}
                  handleSave={handleSave}
                  isSaving={isSaving}
                  currentCaseId={currentCaseId}
                  currentCase={currentCase}
                />
              ),
          }))}
        />
      </Col>
    </Row>
  );
};

export default IncomeDriverDataEntry;
