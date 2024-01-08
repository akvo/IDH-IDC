import React, { useMemo, useState, useCallback, useEffect } from "react";
import "./explore-studies-page.scss";
import { ContentLayout } from "../../components/layout";
import { Link } from "react-router-dom";
import {
  Row,
  Col,
  Alert,
  Button,
  Card,
  Select,
  Input,
  Table,
  message,
  Form,
  Space,
  Popconfirm,
} from "antd";
import { UserState } from "../../store";
import { adminRole } from "../../store/static";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { upperFirst, isEmpty } from "lodash";
import ReferenceDataForm from "./ReferenceDataForm";
import { api } from "../../lib";
import { driverOptions } from ".";
import { useParams, useNavigate, useLocation } from "react-router-dom";

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
  {
    key: "currency",
    label: "Currency",
  },
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
  {
    key: "range",
    label: "Range",
  },
  {
    key: "type",
    label: "Type",
  },
  {
    key: "area",
    label: "Area",
    unit: "area_size_unit",
  },
  {
    key: "volume",
    label: "Volume",
    unit: "volume_measurement_unit",
  },
  {
    key: "price",
    label: "Price",
    unit: "currency",
  },
  {
    key: "cost_of_production",
    label: "Cost of Production",
    unit: "cost_of_production_unit",
  },
  {
    key: "diversified_income",
    label: "Diversified Income",
    unit: "diversified_income_unit",
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

  const countryOptions = window.master.countries;
  const commodityOptions = window?.master?.commodity_categories?.flatMap((ct) =>
    ct.commodities.map((c) => ({
      label: c.name,
      value: c.id,
    }))
  );

  const isAdmin = useMemo(() => adminRole.includes(userRole), [userRole]);

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
    if (countryId && commodityId && driverId) {
      setFilterInitialValues({
        country: parseInt(countryId),
        commodity: parseInt(commodityId),
        driver: driverId,
      });
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
          title: "Action",
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
          if (value && d?.unit) {
            value = `${value} (${values[d.unit]})`;
          }
          return {
            id: di,
            label: d.label,
            value: value,
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
    } else {
      setFilterInitialValues({});
      fetchReferenceData();
    }
  }, [fetchReferenceData, currentPage, location]);

  const onFilter = (values) => {
    const { country, commodity, driver, source } = values;
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
      fetchReferenceData(country, commodity, driver, source);
    }
  };

  const handleClearFilter = () => {
    form.resetFields();
    if (countryId && commodityId && driverId) {
      setFilterInitialValues({});
      navigate("/explore-studies");
    } else {
      fetchReferenceData();
    }
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

  return (
    <ContentLayout
      breadcrumbItems={[
        { title: "Home", href: "/welcome" },
        { title: "Explore Studies" },
      ]}
      wrapperId="explore-studies-page"
    >
      {contextHolder}
      <Row gutter={[24, 24]} className="explore-content-wrapper">
        <Col span={24}>
          <Alert
            className="explore-info-wrapper"
            type="success"
            message={
              <div className="explore-info-content">
                <h2>Explore Studies for Insights</h2>
                <p>
                  To make the data entry process more informed and efficient, we
                  recommend visiting the &quot;Explore Studies&quot; section.
                  Here, you can access valuable insights into feasible levels of
                  income drivers for your selected country and sector.
                </p>
                {isAdmin ? (
                  <Button
                    className="button button-green-fill"
                    onClick={() => setOpen(true)}
                  >
                    {/* Open Form Modal */}
                    Add New Reference Data
                  </Button>
                ) : null}
              </div>
            }
          />
        </Col>

        <Col span={24}>
          <Card title="Cases" className="info-card-wrapper">
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
                  <Row gutter={[16, 16]} justify="space-between" align="bottom">
                    <Col span={12}>
                      <div className="filter-label">Country</div>
                      <Form.Item name="country" noStyle>
                        <Select
                          {...selectProps}
                          options={countryOptions}
                          placeholder="Select Country"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <div className="filter-label">Commodity</div>
                      <Form.Item name="commodity" noStyle>
                        <Select
                          {...selectProps}
                          options={commodityOptions}
                          placeholder="Select Commodity"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
                <Col span={24}>
                  <Row gutter={[16, 16]} justify="space-between" align="bottom">
                    <Col span={12}>
                      <div className="filter-label">Source</div>
                      <Form.Item name="source" noStyle>
                        <Input
                          prefix={<SearchOutlined />}
                          placeholder="Search by Source"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <div className="filter-label">Drivers</div>
                      <Form.Item name="driver" noStyle>
                        <Select
                          {...selectProps}
                          options={driverOptions}
                          placeholder="Select Driver"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4} align="right">
                      <Space wrap={true}>
                        <Form.Item noStyle>
                          <Button className="search-button" htmlType="submit">
                            Search
                          </Button>
                        </Form.Item>
                        <Button
                          className="clear-button"
                          onClick={handleClearFilter}
                        >
                          Clear
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </Col>
                <Col span={24}>
                  <div className="map-container"></div>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>

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
