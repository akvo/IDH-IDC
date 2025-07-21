import React, { useState, useEffect } from "react";
import { VisualCardWrapper } from "../components";
import { Button, Col, Row, Select, Table } from "antd";
import { driverOptions } from "../../explore-studies";
import { thousandFormatter } from "../../../components/chart/options/common";
import { api } from "../../../lib";
import { CurrentCaseState } from "../store";
import { isEmpty, upperFirst } from "lodash";
import { routePath } from "../../../components/route";

const ExploreDataFromOtherStudiesTable = () => {
  const currentCase = CurrentCaseState.useState((s) => s);

  const [selectedDriver, setSelectedDriver] = useState("area");
  const [loadingRefData, setLoadingRefData] = useState(false);
  const [referenceData, setReferenceData] = useState([]);
  const [exploreButtonLink, setExploreButtonLink] = useState(null);

  useEffect(() => {
    const country = currentCase?.country;
    const commodity = currentCase?.case_commodities?.find(
      (x) => x.commodity_type === "focus"
    )?.commodity;
    if (!isEmpty(currentCase) && selectedDriver) {
      setLoadingRefData(true);
      setExploreButtonLink(
        `${routePath.idc.exploreStudies}/${country}/${commodity}/${selectedDriver}`
      );
      api
        .get(
          `reference_data/reference_value?country=${country}&commodity=${commodity}&driver=${selectedDriver}`
        )
        .then((res) => {
          setReferenceData(res.data);
        })
        .catch(() => {
          setReferenceData([]);
        })
        .finally(() => {
          setLoadingRefData(false);
        });
    }
  }, [currentCase, selectedDriver]);

  return (
    <VisualCardWrapper
      title="Explore data from other studies"
      extraButtons={[
        <a
          href={exploreButtonLink}
          key="explore-studies-button"
          target="_blank"
          rel="noreferrer noopener"
        >
          <Button className="button-export" disabled={!exploreButtonLink}>
            Explore studies
          </Button>
        </a>,
      ]}
    >
      <Row gutter={[20, 20]} align="middle">
        <Col span={24}>
          <Select
            placeholder="Select driver"
            options={driverOptions}
            onChange={setSelectedDriver}
            value={selectedDriver}
          />
        </Col>
        <Col span={24}>
          <Table
            bordered
            size="small"
            rowKey="id"
            loading={loadingRefData}
            columns={[
              {
                key: "value",
                title: "Value",
                dataIndex: "value",
                render: (value) => {
                  if (value && Number(value)) {
                    return thousandFormatter(value);
                  }
                  return value || "-";
                },
              },
              {
                key: "unit",
                title: "Unit",
                dataIndex: "unit",
                render: (value) => value || "-",
              },
              {
                key: "type",
                title: "Type",
                dataIndex: "type",
                render: (value) => value || "-",
              },
              {
                key: "source",
                title: "Source",
                width: "35%",
                render: (value, row) => {
                  if (!row?.link) {
                    return value;
                  }
                  const url =
                    row.link?.includes("https://") ||
                    row.link?.includes("http://")
                      ? row.link
                      : `https://${row.link}`;
                  return (
                    <a href={url} target="_blank" rel="noreferrer noopener">
                      {row.source}
                    </a>
                  );
                },
              },
            ]}
            dataSource={referenceData}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ padding: 0 }}>
                  <Table
                    bordered
                    showHeader={false}
                    size="small"
                    rowKey="id"
                    columns={[
                      {
                        key: "label",
                        title: "Label",
                        dataIndex: "label",
                        width: "45%",
                      },
                      {
                        key: "value",
                        title: "Value",
                        dataIndex: "value",
                      },
                    ]}
                    dataSource={Object.keys(record)
                      .map((key) => {
                        if (
                          ["id", "unit", "value", "source", "link"].includes(
                            key
                          )
                        ) {
                          return false;
                        }
                        const label = key
                          .split("_")
                          ?.map((x) => upperFirst(x))
                          ?.join(" ");
                        let value = record[key];
                        if (value && typeof value === "number") {
                          value = thousandFormatter(value);
                        }
                        if (value && typeof value !== "number") {
                          value = value
                            .split(" ")
                            .map((x) => upperFirst(x))
                            .join(" ");
                        }
                        return {
                          label: label,
                          value: value || "-",
                        };
                      })
                      .filter((x) => x)}
                    pagination={false}
                  />
                </div>
              ),
            }}
          />
        </Col>
      </Row>
    </VisualCardWrapper>
  );
};

export default ExploreDataFromOtherStudiesTable;
