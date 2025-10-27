import React, { useCallback, useEffect, useState } from "react";
import {
  Divider,
  Form,
  Input,
  List,
  Popover,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Breadcrumb,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import { ArrowRight, SearchIcon } from "../../../lib/icon";
import { api } from "../../../lib";
import { ImpactAreaIcons, ProcurementBadge } from "../components";
import "./intervention-library.scss";
import { IMPACT_AREA_OPTIONS } from "../config";
import { PLState } from "../../../store";
import { Blocker } from "../../../components/utils";
import { useWindowDimensions } from "../../../hooks";
import { HomeOutlined, RightOutlined } from "@ant-design/icons";

const PAGE_SIZE = 12;
const breadcrumbItems = [
  {
    key: "/home",
    title: "Home",
    active: false,
  },
  { key: "/procurement-library", title: "Procurement Library", active: false },
  {
    key: "/procurement-library/intervention-library",
    title: "Intervention Library",
    active: true,
  },
];

const { useForm } = Form;

const InterventionLibrary = () => {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [practices, setPractices] = useState([]);
  const [total, setTotal] = useState(0);
  const [procurementProcesses, setProcurementProcesses] = useState([]);
  const filter = PLState.useState((s) => s.filter);

  const [form] = useForm();
  const navigate = useNavigate();
  const { isMobile } = useWindowDimensions();

  const fetchProcurementProcesses = useCallback(async () => {
    try {
      const { data } = await api.get("/pl/procurement-processes");
      setProcurementProcesses(
        data.map((proc) => ({
          value: proc.id,
          label: proc.label,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchData = useCallback(
    async (resetPage = false) => {
      try {
        if (!loading) {
          return;
        }
        let apiURL = `/pl/practices?limit=${PAGE_SIZE}`;
        if (filter?.search) {
          apiURL += `&search=${filter.search}`;
        }
        if (filter?.procurement_process_ids) {
          apiURL += `&procurement_process_ids=${filter.procurement_process_ids.join(
            ","
          )}`;
        }
        if (filter?.impact_area) {
          apiURL += `&impact_area=${filter.impact_area}`;
        }

        apiURL += resetPage ? "&page=1" : `&page=${page}`;
        const { data: apiData } = await api.get(apiURL);
        const { current, total: _total, data } = apiData;

        setPractices((prev) => (page === 1 ? data : [...prev, ...data]));
        setPage(current);
        setTotal(_total);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    },
    [loading, page, filter]
  );

  const handleOnFinish = (payload) => {
    PLState.update((s) => {
      s.filter = payload;
    });
    setPage(1);
    setLoading(true);
    fetchData(true);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchProcurementProcesses();
  }, [fetchProcurementProcesses]);

  if (isMobile) {
    return <Blocker backRoute="/procurement-library" />;
  }

  return (
    <div className="intervention-library-container">
      <div className="intervention-library-header">
        <div className="breadcrumb-wrapper">
          <Breadcrumb
            separator={<RightOutlined />}
            items={breadcrumbItems.map((x, bi) => ({
              key: bi,
              title: (
                <Link to={x.key} className={x.active ? "active" : ""}>
                  {x?.title?.toLowerCase() === "home" ? (
                    <HomeOutlined style={{ fontSize: "16px" }} />
                  ) : (
                    x.title
                  )}
                </Link>
              ),
            }))}
          />
        </div>
      </div>
      <div className="intervention-library-content">
        <div className="intervention-library-content-header">
          <h1>The Intervention Library</h1>
          <Form
            form={form}
            onFinish={handleOnFinish}
            layout="vertical"
            initialValues={filter}
          >
            <Form.Item
              label="Procurement Process"
              name="procurement_process_ids"
            >
              <Select
                placeholder="Choose procurement process"
                mode="multiple"
                options={procurementProcesses}
                style={{ minWidth: 310 }}
                size="large"
                maxTagCount={1}
                maxTagPlaceholder={(omittedValues) => (
                  <Tooltip
                    styles={{
                      root: {
                        pointerEvents: "none",
                      },
                    }}
                    title={
                      <ul
                        style={{
                          paddingInlineStart: 12,
                          marginBlockStart: 0,
                          marginBlockEnd: 0,
                        }}
                      >
                        {omittedValues?.map(({ label }, ox) => (
                          <li key={ox}>{label}</li>
                        ))}
                      </ul>
                    }
                    placement="bottom"
                  >
                    <span>{`+${omittedValues?.length}`}</span>
                  </Tooltip>
                )}
                optionFilterProp="label"
                filterOption={(input, option) =>
                  option.label.toLowerCase().includes(input.toLowerCase())
                }
                showSearch
                allowClear
              />
            </Form.Item>
            <Form.Item
              label="Procurement practice title or keyword"
              name="search"
            >
              <Input
                placeholder="Search"
                prefix={<SearchIcon />}
                size="large"
                style={{ minWidth: 280 }}
                allowClear
              />
            </Form.Item>
            <Form.Item label="Impact area" name="impact_area">
              <Select
                placeholder="Choose impact area"
                options={IMPACT_AREA_OPTIONS}
                style={{ minWidth: 125 }}
                size="large"
                allowClear
              />
            </Form.Item>
            <button
              type="submit"
              className="intervention-library-search-button"
            >
              <Space>
                <span>Search</span>
                <span>
                  <ArrowRight />
                </span>
              </Space>
            </button>
          </Form>
        </div>
        <div id="scrollableDiv" className="intervention-library-content-body">
          <InfiniteScroll
            dataLength={practices.length}
            next={() => {
              setLoading(true);
              setPage(page + 1);
              setTimeout(() => {
                fetchData();
              }, 1000);
            }}
            hasMore={practices.length < total}
            loader={
              <Divider plain>
                <Spin spinning />
              </Divider>
            }
            endMessage={
              <Divider plain>
                {!loading && <em>No more results available.</em>}
              </Divider>
            }
            scrollableTarget="scrollableDiv"
          >
            <List
              grid={{
                gutter: 16,
                xs: 1,
                sm: 2,
                md: 3,
                lg: 3,
                xl: 4,
                xxl: 4,
              }}
              dataSource={practices}
              loading={loading}
              renderItem={(practice) => (
                <List.Item key={practice.id}>
                  <div className="intervention-card">
                    <div className="intervention-card-header">
                      <div className="intervention-card-categories">
                        {practice?.procurement_processes
                          ?.slice(0, 1)
                          ?.map((proc) => (
                            <ProcurementBadge
                              key={proc?.id}
                              id={proc?.id}
                              text={proc?.label}
                            />
                          ))}
                        {practice?.procurement_processes?.length > 1 && (
                          <Popover
                            placement="bottom"
                            content={
                              <ul
                                style={{
                                  paddingInlineStart: 0,
                                  paddingBlockStart: 0,
                                  marginBlockStart: 0,
                                  marginBlockEnd: 0,
                                  listStyle: "none",
                                }}
                              >
                                {practice.procurement_processes
                                  .slice(
                                    1,
                                    practice.procurement_processes.length
                                  )
                                  .map((proc) => (
                                    <li
                                      key={proc?.id}
                                      style={{ marginBottom: 6 }}
                                    >
                                      <ProcurementBadge
                                        id={proc?.id}
                                        text={proc?.label}
                                      />
                                    </li>
                                  ))}
                              </ul>
                            }
                          >
                            <Tag>
                              {`+${
                                practice?.procurement_processes?.length - 1
                              }`}
                            </Tag>
                          </Popover>
                        )}
                      </div>
                      <ImpactAreaIcons
                        isIncome={practice?.is_income}
                        isEnv={practice?.is_environmental}
                      />
                    </div>
                    <div
                      className="intervention-card-description"
                      role="button"
                      onClick={() => {
                        navigate(
                          `/procurement-library/intervention-library/${practice.id}`
                        );
                      }}
                    >
                      <strong className="font-tablet-gothic">
                        {practice.label}
                      </strong>
                    </div>
                    <div className="intervention-card-footer">
                      <Link
                        to={`/procurement-library/intervention-library/${practice.id}`}
                      >
                        <Space size="small">
                          <span>View</span>
                          <span>
                            <ArrowRight />
                          </span>
                        </Space>
                      </Link>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </InfiniteScroll>
        </div>
      </div>
    </div>
  );
};

export default InterventionLibrary;
