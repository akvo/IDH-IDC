import React, { useCallback, useEffect, useState, useMemo } from "react";
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
  Breadcrumb,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import { ArrowRight, SearchIcon } from "../../../lib/icon";
import { api } from "../../../lib";
import { ImpactAreaIcons, ProcurementBadge } from "../components";
import "./intervention-library.scss";
import { IMPACT_AREA_OPTIONS, PROCUREMENT_CATEGORIES_ID } from "../config";
import { PLState } from "../../../store";
import { Blocker } from "../../../components/utils";
import { useWindowDimensions } from "../../../hooks";
import { HomeOutlined, RightOutlined } from "@ant-design/icons";
import InternalAnalysisIconColor from "../../../assets/icons/procurement-library/colorized-internal-analysis.png";
import ExternalAnalysisIconColor from "../../../assets/icons/procurement-library/colorized-external-analysis.png";
import StrategicChoiceIconColor from "../../../assets/icons/procurement-library/colorized-strategic-choices.png";
import ImplementationIconColor from "../../../assets/icons/procurement-library/colorize-implementation.png";
import EnvironmentIcon from "../../../assets/icons/procurement-library/environment.png";
import IncomeIcon from "../../../assets/icons/procurement-library/income.png";

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
const searchboxIcons = [
  {
    name: "Internal Analysis",
    icon: InternalAnalysisIconColor,
  },
  {
    name: "External Analysis",
    icon: ExternalAnalysisIconColor,
  },
  {
    name: "Strategic Choice",
    icon: StrategicChoiceIconColor,
  },
  {
    name: "Implementation",
    icon: ImplementationIconColor,
  },
  {
    name: "Environment",
    icon: EnvironmentIcon,
  },
  {
    name: "Income",
    icon: IncomeIcon,
  },
];

const { useForm } = Form;

const InterventionLibrary = () => {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [practices, setPractices] = useState([]);
  const [total, setTotal] = useState(0);
  const filter = PLState.useState((s) => s.filterV2);
  const categoryWithAttributes = PLState.useState(
    (s) => s.categoryWithAttributes
  );

  const [form] = useForm();
  const navigate = useNavigate();
  const { isMobile } = useWindowDimensions();

  const sourcingStragegyCycleOptions = useMemo(() =>
    categoryWithAttributes
      .find(
        (attr) => attr.id === PROCUREMENT_CATEGORIES_ID.sourcing_strategy_cycle
      )
      ?.attributes?.map((it) => ({ label: it.label, value: it.id }))
  );

  const procurementPrincipleOptions = useMemo(() =>
    categoryWithAttributes
      .find(
        (attr) => attr.id === PROCUREMENT_CATEGORIES_ID.procurement_principles
      )
      ?.attributes?.map((it) => ({ label: it.label, value: it.id }))
  );

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
        if (filter?.impact_area) {
          apiURL += `&impact_area=${filter.impact_area}`;
        }
        if (filter?.sourcing_strategy_cycle) {
          apiURL += `&sourcing_strategy_cycle=${filter.sourcing_strategy_cycle}`;
        }
        if (filter.procurement_principles) {
          apiURL += `&procurement_principles=${filter.procurement_principles}`;
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
      s.filterV2 = payload;
    });
    setPage(1);
    setLoading(true);
    fetchData(true);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          <div className="intervention-library-search-box-title-wrapper">
            <h1>The Intervention Library</h1>
            <div className="income-library-search-box-icon-wrapper">
              {searchboxIcons.map((it) => (
                <img
                  key={it.name}
                  src={it.icon}
                  alt={it.name}
                  className="il-search-box-icon"
                />
              ))}
            </div>
          </div>
          <Form
            form={form}
            onFinish={handleOnFinish}
            layout="vertical"
            initialValues={filter}
          >
            <Form.Item label="Search" name="search">
              <Input
                placeholder="Search"
                prefix={<SearchIcon />}
                style={{ minWidth: 280 }}
                allowClear
              />
            </Form.Item>

            <Form.Item label="Impact area" name="impact_area">
              <Select
                placeholder="Choose impact area"
                options={IMPACT_AREA_OPTIONS}
                style={{ minWidth: 125 }}
                optionFilterProp="label"
                filterOption={(input, option) =>
                  option.label.toLowerCase().includes(input.toLowerCase())
                }
                showSearch
                allowClear
              />
            </Form.Item>

            <Form.Item
              label=" Sourcing Strategy Cycle"
              name="sourcing_strategy_cycle"
            >
              <Select
                placeholder="Choose strategy cycle"
                options={sourcingStragegyCycleOptions}
                style={{ minWidth: 125 }}
                optionFilterProp="label"
                filterOption={(input, option) =>
                  option.label.toLowerCase().includes(input.toLowerCase())
                }
                showSearch
                allowClear
              />
            </Form.Item>

            <Form.Item
              label="Procurement Principles"
              name="procurement_principles"
            >
              <Select
                placeholder="Choose procurement principles"
                options={procurementPrincipleOptions}
                style={{ minWidth: 125 }}
                optionFilterProp="label"
                filterOption={(input, option) =>
                  option.label.toLowerCase().includes(input.toLowerCase())
                }
                showSearch
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
