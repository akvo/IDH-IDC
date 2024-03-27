import React, { useState, useEffect, useMemo } from "react";
import { Row, Col, Tabs, message } from "antd";
import { PlusCircleFilled } from "@ant-design/icons";
import {
  DataFields,
  generateSegmentPayloads,
  removeUndefinedObjectValue,
} from "./";
import { api } from "../../../lib";
import { orderBy, isEqual, isEmpty } from "lodash";

const MAX_SEGMENT = 5;

const addSegmentTab = [
  {
    key: "add",
    label: (
      <span>
        <PlusCircleFilled /> Add Segment
      </span>
    ),
    currentSegmentId: null,
    answers: {},
  },
];

const IncomeDriverDataEntry = ({
  commodityList,
  currentCaseId,
  currentCase,
  setCaseData,
  questionGroups,
  setQuestionGroups,
  totalIncomeQuestion,
  dashboardData,
  finished,
  setFinished,
  setPage,
  enableEditCase,
}) => {
  const [activeKey, setActiveKey] = useState("1");
  const [items, setItems] = useState([]);
  const [formValues, setFormValues] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [isSaving, setIsSaving] = useState(false);
  const [currentValues, setCurrentValues] = useState([]);

  const isAllSegmentHasBenchmark = useMemo(() => {
    const check = formValues.filter((f) => !f.target && !isEmpty(f.answers));
    return check;
  }, [formValues]);

  useEffect(() => {
    const formValeusWithTotalCurrentIncomeAnswer = formValues.map(
      (currentFormValue) => {
        const totalCurrentIncomeAnswer = totalIncomeQuestion
          .map((qs) => currentFormValue?.answers[`current-${qs}`])
          .filter((a) => a)
          .reduce((acc, a) => acc + a, 0);
        const totalFeasibleIncomeAnswer = totalIncomeQuestion
          .map((qs) => currentFormValue?.answers[`feasible-${qs}`])
          .filter((a) => a)
          .reduce((acc, a) => acc + a, 0);
        return {
          ...currentFormValue,
          total_current_income: totalCurrentIncomeAnswer,
          total_feasible_income: totalFeasibleIncomeAnswer,
        };
      }
    );
    setCaseData(formValeusWithTotalCurrentIncomeAnswer);
  }, [formValues, setCaseData, totalIncomeQuestion]);

  // handle save here
  const handleSave = ({ isNextButton = false }) => {
    if (isAllSegmentHasBenchmark.length) {
      const segmentNames = isAllSegmentHasBenchmark
        .map((x) => x.label)
        .join(", ");
      messageApi.open({
        type: "warning",
        content: `Sorry, your benchmark is not filled in which is a necessary item for sensitivity analysis. Please fill benchmark for ${segmentNames}`,
      });
      return;
    }
    setIsSaving(true);
    const completed = finished.filter(
      (item) => item !== "Income Driver Data Entry"
    );
    const apiCalls = [];
    const postFormValues = formValues.filter((fv) => !fv.currentSegmentId);
    const putFormValues = formValues.filter((fv) => fv.currentSegmentId);

    // detect is payload updated
    const isUpdated =
      currentValues
        .map((cv) => {
          cv = {
            ...cv,
            answers: removeUndefinedObjectValue(cv.answers),
          };
          let findPayload = formValues.find((fv) => fv.key === cv.key);
          if (!findPayload) {
            // handle deleted segment
            return true;
          }
          findPayload = {
            ...findPayload,
            answers: removeUndefinedObjectValue(findPayload.answers),
          };
          const equal = isEqual(
            removeUndefinedObjectValue(cv),
            removeUndefinedObjectValue(findPayload)
          );
          return !equal;
        })
        .filter((x) => x)?.length > 0;

    if (postFormValues.length) {
      const postPayloads = generateSegmentPayloads(
        postFormValues,
        currentCaseId,
        commodityList
      );
      apiCalls.push(api.post(`/segment?updated=${isUpdated}`, postPayloads));
    }
    if (putFormValues.length) {
      const putPayloads = generateSegmentPayloads(
        putFormValues,
        currentCaseId,
        commodityList
      );
      apiCalls.push(api.put(`/segment?updated=${isUpdated}`, putPayloads));
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
        const transformFormValues = formValues.map((fv) => {
          const findItem = transformItems.find(
            (it) => parseInt(it.key) === parseInt(fv.key)
          );
          if (!findItem) {
            return fv;
          }
          return {
            ...findItem,
            ...fv,
            currentSegmentId: findItem?.currentSegmentId || fv.currentSegmentId,
          };
        });
        setFormValues(transformFormValues);
        setCurrentValues(transformFormValues);
        messageApi.open({
          type: "success",
          content: "Segments saved successfully.",
        });
        setTimeout(() => {
          setFinished([...completed, "Income Driver Data Entry"]);
          // move to next page
          if (isNextButton) {
            setPage("Income Driver Dashboard");
          }
        }, 100);
      })
      .catch((e) => {
        console.error(e);
        const { status, data } = e.response;
        let errorText = "Failed to save case profile.";
        if (status === 403) {
          errorText = data.detail;
          if (isNextButton) {
            setFinished([...completed, "Income Driver Data Entry"]);
            setPage("Income Driver Dashboard");
          }
        }
        messageApi.open({
          type: "error",
          content: errorText,
        });
        setFinished(completed);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  useEffect(() => {
    if (commodityList.length === 0 && !currentCaseId) {
      return;
    }
    api.get(`/questions/${currentCaseId}`).then((res) => {
      const defaultItems = enableEditCase ? addSegmentTab : [];
      // reorder question to match commodity list order (CORRECT ORDER)
      const dataTmp = commodityList.map((cl) =>
        res.data.find((d) => d.commodity_id === cl.commodity)
      );
      setQuestionGroups(dataTmp);
      // load segment from database
      api
        .get(`segment/case/${currentCaseId}`)
        .then((res) => {
          const { data } = res;
          let itemsTmp = orderBy(data, "id").map((it, itIndex) => ({
            key: String(itIndex + 1),
            label: it.name,
            currentSegmentId: it.id,
            ...it,
          }));
          const formValuesTmp = orderBy(data, "id").map((it, itIndex) => ({
            key: String(itIndex + 1),
            label: it.name,
            currentSegmentId: it.id,
            answers: it.answers,
            ...it,
          }));
          if (itemsTmp.length !== MAX_SEGMENT) {
            itemsTmp = [...itemsTmp, ...defaultItems];
          }
          setItems(itemsTmp);
          setFormValues(formValuesTmp);
          setCurrentValues(formValuesTmp);
        })
        .catch(() => {
          // default items if no segments in database
          setItems([
            {
              key: "1",
              label: "Segment 1",
              currentSegmentId: null,
            },
            ...defaultItems,
          ]);
          setFormValues([
            {
              key: "1",
              label: "Segment 1",
              currentSegmentId: null,
              answers: {},
            },
          ]);
          setCurrentValues([
            {
              key: "1",
              label: "Segment 1",
              currentSegmentId: null,
              answers: {},
            },
          ]);
        });
    });
  }, [commodityList, setQuestionGroups, currentCaseId, enableEditCase]);

  const handleRemoveSegmentFromItems = (segmentKey) => {
    // handle form values
    const filteredFormValues = formValues.filter((x) => x.key !== segmentKey);
    setFormValues(filteredFormValues);
    // eol handle form values
    let newItems = items.filter((item) => item.key !== segmentKey);
    if (newItems?.length === MAX_SEGMENT - 1 && items?.length === MAX_SEGMENT) {
      newItems = [...newItems, ...addSegmentTab];
    }
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
            formValues={formValues}
            setFormValues={setFormValues}
            segmentItem={{ ...item, label: newLabel }}
            handleSave={handleSave}
            isSaving={isSaving}
            currentCaseId={currentCaseId}
            currentCase={currentCase}
            setPage={setPage}
            enableEditCase={enableEditCase}
            segments={items.filter((it) => it.key !== "add")}
          />
        );
        // handle form values
        const filteredFormValues = formValues.filter((x) => x.key !== item.key);
        const currentFormValue = formValues.find((x) => x.key === item.key) || {
          ...item,
          answers: {},
        };
        setFormValues([
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

      if (newKey === MAX_SEGMENT) {
        newItems.splice(newItems.length - 1, 1);
        setItems(newItems);
      }
      setFormValues([
        ...formValues,
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
          type="card"
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
                  formValues={formValues}
                  setFormValues={setFormValues}
                  segmentItem={item}
                  handleSave={handleSave}
                  isSaving={isSaving}
                  currentCaseId={currentCaseId}
                  currentCase={currentCase}
                  setPage={setPage}
                  enableEditCase={enableEditCase}
                  segments={items.filter((it) => it.key !== "add")}
                />
              ),
          }))}
        />
      </Col>
    </Row>
  );
};

export default IncomeDriverDataEntry;
