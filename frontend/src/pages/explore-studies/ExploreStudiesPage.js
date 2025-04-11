import React, { useMemo, useState, useCallback, useEffect } from "react";
import "./explore-studies-page.scss";
import { ContentLayout } from "../../components/layout";
import { Link } from "react-router-dom";
import {
  Row,
  Col,
  Button,
  Card,
  Select,
  Table,
  message,
  Form,
  Space,
  Popconfirm,
} from "antd";
import { UserState } from "../../store";
import { adminRole } from "../../store/static";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { upperFirst, isEmpty, min, max } from "lodash";
import ReferenceDataForm from "./ReferenceDataForm";
import { api } from "../../lib";
import { driverOptions } from ".";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { thousandFormatter } from "../../components/chart/options/common";
import { sourceOptions } from ".";
import { CustomEvent } from "@piwikpro/react-piwik-pro";
import Chart from "../../components/chart";

const selectProps = {
  showSearch: true,
  allowClear: true,
  optionFilterProp: "label",
  style: {
    width: "100%",
  },
};

const referenceDataExpand = [
  {
    key: "area",
    label: "Land",
    unit: "area_size_unit",
    type: "type_area",
  },
  {
    key: "volume",
    label: "Volume",
    unit: "volume_measurement_unit",
    type: "type_volume",
  },
  {
    key: "price",
    label: "Price",
    unit: "price_unit",
    type: "type_price",
  },
  {
    key: "cost_of_production",
    label: "Cost of Production",
    unit: "cost_of_production_unit",
    type: "type_cost_of_production",
  },
  {
    key: "diversified_income",
    label: "Diversified Income",
    unit: "diversified_income_unit",
    type: "type_diversified_income",
  },
  {
    key: "country",
    label: "Country",
  },
  {
    key: "commodity",
    label: "Commodity",
  },
  {
    key: "region",
    label: "Region",
  },
  // {
  //   key: "currency",
  //   label: "Currency",
  // },
  {
    key: "year",
    label: "Year",
  },
  {
    key: "source",
    label: "Source",
  },
  {
    key: "link",
    label: "Link",
  },
  {
    key: "notes",
    label: "Notes",
  },
  {
    key: "confidence_level",
    label: "Confidence Level",
  },
];

const perPage = 10;
const defData = {
  current: 1,
  data: [],
  total: 0,
  total_page: 1,
};

const ExploreStudiesPage = () => {
  const [form] = Form.useForm();
  const userRole = UserState.useState((s) => s.role);

  const { countryId, commodityId, driverId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState(defData);
  const [selectedDataId, setSelectedDataId] = useState(null);
  const [expandedData, setExpandedData] = useState([]);
  const [filterInitialValues, setFilterInitialValues] = useState({});

  const [mapLoading, setMapLoading] = useState(true);
  const [mapData, setMapData] = useState([]);

  const countryOptions = window.master.countries;
  const commodityOptions = window?.master?.commodity_categories?.flatMap((ct) =>
    ct.commodities.map((c) => ({
      label: c.name,
      value: c.id,
    }))
  );

  const isAdmin = useMemo(() => adminRole.includes(userRole), [userRole]);

  const fetchMapData = useCallback(
    (country, commodity, driver, source) => {
      setLoading(true);
      let url = "reference_data/count_by_country";
      const params = [];

      if (country || countryId) {
        params.push(`country=${country ? country : countryId}`);
      }
      if (commodity || commodityId) {
        params.push(`commodity=${commodity ? commodity : commodityId}`);
      }
      if (driver || driverId) {
        params.push(`driver=${driver ? driver : driverId}`);
      }
      if (source) {
        params.push(`source=${source}`);
      }
      if (params.length > 0) {
        url += "?" + params.join("&");
      }

      api
        .get(url)
        .then((res) => {
          const data = res?.data?.map((d) => ({
            ...d,
            name: d.COUNTRY,
            value: d.count,
          }));
          setMapData(data);
        })
        .catch((e) => {
          console.error(e.response);
        })
        .finally(() => {
          setMapLoading(false);
        });
    },
    [countryId, commodityId, driverId]
  );

  const filteredCountryOptions = useMemo(() => {
    const mapCountryIds = mapData.map((d) => d.country_id);
    return countryOptions.filter((c) => mapCountryIds.includes(c.value));
  }, [countryOptions, mapData]);

  const fetchReferenceData = useCallback(
    (country, commodity, driver, source) => {
      setLoading(true);
      let url = `reference_data?page=${currentPage}&limit=${perPage}`;
      if (country || countryId) {
        url = `${url}&country=${country ? country : countryId}`;
      }
      if (commodity || commodityId) {
        url = `${url}&commodity=${commodity ? commodity : commodityId}`;
      }
      if (driver || driverId) {
        url = `${url}&driver=${driver ? driver : driverId}`;
      }
      if (source) {
        url = `${url}&source=${source}`;
      }
      api
        .get(url)
        .then((res) => {
          setData(res.data);
        })
        .catch((e) => {
          console.error(e.response);
          const { status } = e.response;
          if (status === 404) {
            setData(defData);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [currentPage, countryId, commodityId, driverId]
  );

  useMemo(() => {
    if (countryId) {
      setFilterInitialValues((prev) => ({
        ...prev,
        country: parseInt(countryId),
      }));
    }
    if (commodityId) {
      setFilterInitialValues((prev) => ({
        ...prev,
        commodity: parseInt(commodityId),
      }));
    }
    if (driverId) {
      setFilterInitialValues((prev) => ({
        ...prev,
        driver: driverId,
      }));
    }
  }, [countryId, commodityId, driverId]);

  const onConfirmDelete = useCallback(
    (record) => {
      api
        .delete(`reference_data/${record.id}`)
        .then(() => {
          messageApi.open({
            type: "success",
            content: "Reference Data deleted successfully.",
          });
          fetchReferenceData();
        })
        .catch(() => {
          messageApi.open({
            type: "error",
            content: "Failed! Something went wrong.",
          });
        });
    },
    [fetchReferenceData, messageApi]
  );

  const columns = useMemo(() => {
    let res = [
      {
        key: "country",
        title: "Country",
        dataIndex: "country",
      },
      {
        key: "commodity",
        title: "Commodity",
        dataIndex: "commodity",
      },
      {
        key: "confidence_level",
        title: "Confidence Level",
        dataIndex: "confidence_level",
        render: (value) => (value ? upperFirst(value) : "-"),
      },
      {
        key: "source",
        title: "Source",
        dataIndex: "source",
        render: (value, row) => {
          if (!row?.link) {
            return value;
          }
          const url =
            row.link?.includes("https://") || row.link?.includes("http://")
              ? row.link
              : `https://${row.link}`;
          return (
            <a href={url} target="_blank" rel="noreferrer noopener">
              {row.source}
            </a>
          );
        },
      },
    ];
    if (adminRole.includes(userRole)) {
      res = [
        ...res,
        {
          key: "action",
          title: "Actions",
          dataIndex: "action",
          render: (_, record) => (
            <Space size="large">
              <Link
                onClick={() => {
                  setSelectedDataId(record.id);
                  setOpen(true);
                }}
              >
                <EditOutlined />
              </Link>
              <Popconfirm
                title="Delete Reference Data"
                description="Are you sure to delete this data?"
                onConfirm={() => onConfirmDelete(record)}
                okText="Yes"
                cancelText="No"
                placement="leftBottom"
              >
                <Link>
                  <DeleteOutlined style={{ color: "red" }} />
                </Link>
              </Popconfirm>
            </Space>
          ),
        },
      ];
    }
    return res;
  }, [userRole, onConfirmDelete]);

  const fetchReferenceDataDetail = (record) => {
    if (isEmpty(expandedData)) {
      api.get(`reference_data/${record.id}`).then((res) => {
        // transform
        const values = {
          ...res.data,
          countryId: res.data.country,
          country: record.country,
          commodityId: res.data.commodity,
          commodity: record.commodity,
        };
        const transformData = referenceDataExpand.map((d, di) => {
          let value = values[d.key];
          if (typeof value === "number") {
            value = thousandFormatter(value);
          }
          if (value && d?.unit) {
            value = `${value} ${
              values?.[d.unit] ? `${values[d.unit]}` : "(unit NA)"
            }`;
          }
          if (value && d?.type) {
            value = `${value} ${
              values?.[d.type] ? ` - (${values[d.type]})` : "(type NA)"
            }`;
          }
          return {
            id: di,
            label: d.label,
            value: value || "-",
          };
        });
        setExpandedData(transformData);
      });
    }
  };

  useEffect(() => {
    if (!isEmpty(location?.state)) {
      const { country, commodity, driver, source } = location.state;
      setFilterInitialValues({
        country: parseInt(country),
        commodity: parseInt(commodity),
        driver: driver,
        source: source,
      });
      fetchReferenceData(country, commodity, driver, source);
      fetchMapData(country, commodity, driver, source);
    } else {
      const { country, commodity, driver, source } = filterInitialValues;
      fetchReferenceData(country, commodity, driver, source);
      fetchMapData(country, commodity, driver, source);
    }
  }, [
    fetchReferenceData,
    currentPage,
    location,
    filterInitialValues,
    fetchMapData,
  ]);

  const onFilter = (values) => {
    setCurrentPage(1);
    const { country, commodity, driver, source } = values;
    // track event: most searched on Explore Studies
    if (country) {
      const searchedCountry = countryOptions.find((co) => co.value === country);
      CustomEvent.trackEvent(
        "Explore Studies Filter",
        "on Search Explore Studies",
        "Search by Country",
        1,
        {
          dimension5: searchedCountry ? searchedCountry.label : country,
        }
      );
      console.info(
        "Explore Studies Filter",
        "on Search Explore Studies",
        "Search by Country",
        1,
        {
          dimension5: searchedCountry ? searchedCountry.label : country,
        },
        new Date()
      );
    }
    if (commodity) {
      const searchedCommodity = commodityOptions.find(
        (co) => co.value === commodity
      );
      CustomEvent.trackEvent(
        "Explore Studies Filter",
        "on Search Explore Studies",
        "Search by Commodity",
        1,
        {
          dimension6: searchedCommodity ? searchedCommodity.label : commodity,
        }
      );
      console.info(
        "Explore Studies Filter",
        "on Search Explore Studies",
        "Search by Commodity",
        1,
        {
          dimension6: searchedCommodity ? searchedCommodity.label : commodity,
        },
        new Date()
      );
    }
    if (source) {
      CustomEvent.trackEvent(
        "Explore Studies Filter",
        "on Search Explore Studies",
        "Search by Source",
        1,
        {
          dimension7: source,
        }
      );
      console.info(
        "Explore Studies Filter",
        "on Search Explore Studies",
        "Search by Source",
        1,
        {
          dimension7: source,
        },
        new Date()
      );
    }
    if (driver) {
      CustomEvent.trackEvent(
        "Explore Studies Filter",
        "on Search Explore Studies",
        "Search by Driver",
        1,
        {
          dimension8: driver,
        }
      );
      console.info(
        "Explore Studies Filter",
        "on Search Explore Studies",
        "Search by Driver",
        1,
        {
          dimension8: driver,
        },
        new Date()
      );
    }
    // EOL track event: most searched on Explore Studies

    if (countryId && commodityId && driverId) {
      setFilterInitialValues({});
      navigate("/explore-studies", {
        state: {
          country,
          commodity,
          driver,
          source,
        },
      });
    } else {
      setFilterInitialValues({
        country: country,
        commodity: commodity,
        driver: driver,
        source: source,
      });
      fetchReferenceData(country, commodity, driver, source);
    }
  };

  const handleClearFilter = () => {
    setCurrentPage(1);
    form.setFieldsValue({});
    setFilterInitialValues({});
    if (countryId && commodityId && driverId) {
      navigate("/explore-studies");
    } else {
      fetchReferenceData();
      fetchMapData();
    }
    setTimeout(() => {
      form.resetFields();
    }, 100);
  };

  const onSave = ({ payload, setConfirmLoading, resetFields }) => {
    setConfirmLoading(true);
    const apiCall = selectedDataId
      ? api.put(`reference_data/${selectedDataId}`, payload)
      : api.post("reference_data", payload);
    apiCall
      .then(() => {
        messageApi.open({
          type: "success",
          content: "Reference Data saved successfully.",
        });
        resetFields();
        fetchReferenceData();
        fetchMapData();
      })
      .catch(() => {
        messageApi.open({
          type: "error",
          content: "Failed! Something went wrong.",
        });
      })
      .finally(() => {
        setSelectedDataId(null);
        setTimeout(() => {
          setConfirmLoading(false);
        }, 500);
      });
  };

  const onClickMap = ({ name: selectedCountry, value }) => {
    if (isNaN(value)) {
      // Show now data not available
      setData(defData);
      return;
    }
    const findMapData = mapData.find(
      (d) => d.name.toLowerCase() === selectedCountry.toLowerCase()
    );
    if (findMapData?.country_id) {
      const countryId = parseInt(findMapData?.country_id);
      form.setFieldsValue({ ...filterInitialValues, country: countryId });
      setFilterInitialValues((prev) => ({
        ...prev,
        country: countryId,
      }));
    }
  };

  return (
    <ContentLayout
      breadcrumbItems={[
        { title: "Home", href: "/welcome" },
        { title: "Explore Studies" },
      ]}
      wrapperId="explore-studies-page"
    >
      {contextHolder}
      <Row gutter={[20, 20]} className="explore-content-wrapper">
        {/* Page title */}
        <Col span={24}>
          <Row gutter={[12, 12]} align="top" className="explore-info-wrapper">
            <Col span={isAdmin ? 16 : 24} className="explore-info-content">
              <div className="title">Explore Studies for Insights</div>
              <div className="description">
                To make the data entry process more informed and efficient, we
                recommend visiting the &quot;Explore Studies&quot; section.
                Here, you can access valuable insights into feasible levels of
                income drivers for your selected country and sector.
              </div>
            </Col>
            {isAdmin ? (
              <Col span={8} align="end" style={{ textAlign: "right" }}>
                <Button
                  icon={<PlusOutlined />}
                  className="button-green-fill"
                  onClick={() => setOpen(true)}
                >
                  {/* Open Form Modal */}
                  Add a new study
                </Button>
              </Col>
            ) : null}
          </Row>
        </Col>
        {/* EOL Page title */}

        {/* Map & Filter */}
        <Col span={24}>
          <Row
            gutter={[12, 12]}
            align="middle"
            className="map-filter-container"
          >
            <Col span={16}>
              <Card className="map-card-wrapper">
                <Chart
                  wrapper={false}
                  type="CHOROPLETH"
                  loading={mapLoading}
                  height={505}
                  data={mapData}
                  extra={{
                    seriesName: "Case count by country",
                    min: min(mapData.map((d) => d.value)),
                    max: max(mapData.map((d) => d.value)),
                    visualMapText: ["Number of studies", ""],
                  }}
                  callbacks={{
                    onClick: onClickMap,
                  }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card className="filter-card-wrapper">
                <Row gutter={[20, 20]}>
                  <Col span={24}>
                    <h3>Search Studies</h3>
                    <p>
                      Here, you can access valuable insights into feasible
                      levels of income drivers for your selected country and
                      sector.
                    </p>
                  </Col>
                  <Col span={24}>
                    <Form
                      form={form}
                      name="filter-form"
                      className="filter-form-container"
                      layout="vertical"
                      initialValues={filterInitialValues}
                      onFinish={onFilter}
                    >
                      <Row gutter={[16, 16]} className="explore-filter-wrapper">
                        <Col span={24}>
                          <div className="filter-label">Country</div>
                          <Form.Item name="country" noStyle>
                            <Select
                              {...selectProps}
                              options={filteredCountryOptions}
                              placeholder="Select Country"
                              loading={mapLoading}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <div className="filter-label">Source</div>
                          <Form.Item name="source" noStyle>
                            <Select
                              {...selectProps}
                              options={sourceOptions}
                              placeholder="Select Source"
                              loading={mapLoading}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <div className="filter-label">Commodity</div>
                          <Form.Item name="commodity" noStyle>
                            <Select
                              {...selectProps}
                              options={commodityOptions}
                              placeholder="Select Commodity"
                              loading={mapLoading}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <div className="filter-label">Drivers</div>
                          <Form.Item name="driver" noStyle>
                            <Select
                              {...selectProps}
                              options={driverOptions}
                              placeholder="Select Driver"
                              loading={mapLoading}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24} align="end">
                          <Space wrap={true}>
                            <Button
                              className="clear-button"
                              onClick={handleClearFilter}
                              disabled={mapLoading}
                            >
                              Clear
                            </Button>
                            <Form.Item noStyle>
                              <Button
                                className="search-button"
                                htmlType="submit"
                                disabled={mapLoading}
                              >
                                Search
                              </Button>
                            </Form.Item>
                          </Space>
                        </Col>
                      </Row>
                    </Form>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Col>
        {/* EOL Map & Filter */}

        {/* Table */}
        <Col span={24}>
          <Table
            rowKey="id"
            className="table-wrapper"
            dataSource={data.data}
            columns={columns}
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: perPage,
              total: data.total,
              onChange: (page) => setCurrentPage(page),
              showSizeChanger: false,
            }}
            expandable={{
              onExpand: (event, record) => {
                event ? fetchReferenceDataDetail(record) : setExpandedData([]);
              },
              expandedRowRender: () => (
                <div style={{ padding: 0 }}>
                  <Table
                    size="small"
                    rowKey="id"
                    columns={[
                      {
                        key: "label",
                        title: "Label",
                        dataIndex: "label",
                      },
                      {
                        key: "value",
                        title: "Value",
                        dataIndex: "value",
                      },
                    ]}
                    dataSource={expandedData}
                    pagination={false}
                    scroll={{
                      y: 240,
                    }}
                  />
                </div>
              ),
            }}
          />
        </Col>
        {/* EOL Table */}
      </Row>

      {/* Form Modal */}
      <ReferenceDataForm
        open={open}
        setOpen={setOpen}
        onSave={onSave}
        referenceDataId={selectedDataId}
      />
    </ContentLayout>
  );
};

export default ExploreStudiesPage;
