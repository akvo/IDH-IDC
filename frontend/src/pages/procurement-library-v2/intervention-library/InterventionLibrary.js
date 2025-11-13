import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  Divider,
  Form,
  Input,
  List,
  Select,
  Space,
  Spin,
  Tag,
  Breadcrumb,
  Tooltip,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import { ArrowRight, SearchIcon } from "../../../lib/icon";
import { api } from "../../../lib";
import { ImpactAreaIcons } from "../components";
import "./intervention-library.scss";
import {
  IMPACT_AREA_OPTIONS,
  PROCUREMENT_CATEGORIES_ID,
  SEARCHBOX_ICONS,
  SOURCING_STRATEGY_CYCLE_COLORS,
} from "../config";
import { PLState } from "../../../store";
import { Blocker } from "../../../components/utils";
import { useWindowDimensions } from "../../../hooks";
import { HomeOutlined, RightOutlined } from "@ant-design/icons";
import { isEmpty, orderBy } from "lodash";

const PAGE_SIZE = 100;
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
  const [practiceByAttributes, setPracticesByAttributes] = useState({});
  const [total, setTotal] = useState(0);
  const filter = PLState.useState((s) => s.filterV2);
  const categoryWithAttributes = PLState.useState(
    (s) => s.categoryWithAttributes
  );

  const [form] = useForm();
  const navigate = useNavigate();
  const { isMobile } = useWindowDimensions();

  console.info(total);

  const isAllPraticesByAttributeHasNoData = useMemo(() => {
    const values = Object.values(practiceByAttributes);
    const isNull = values.map((x) => {
      return !x?.data?.length;
    });
    return isNull.filter((x) => x)?.length === values?.length;
  }, [practiceByAttributes]);

  const sourcingStragegyCycleOptions = useMemo(
    () =>
      categoryWithAttributes
        .find(
          (attr) =>
            attr.id === PROCUREMENT_CATEGORIES_ID.sourcing_strategy_cycle
        )
        ?.attributes?.map((it) => ({ label: it.label, value: it.id })),
    [categoryWithAttributes]
  );

  const procurementPrincipleOptions = useMemo(
    () =>
      categoryWithAttributes
        .find(
          (attr) => attr.id === PROCUREMENT_CATEGORIES_ID.procurement_principles
        )
        ?.attributes?.map((it) => ({ label: it.label, value: it.id })),
    [categoryWithAttributes]
  );

  const fetchData = useCallback(
    async (resetPage = false) => {
      try {
        if (!loading || !sourcingStragegyCycleOptions?.length) {
          return;
        }
        const urls = orderBy(sourcingStragegyCycleOptions, "value").map(
          ({ value: attributeId }) => {
            let apiURL = `/plv2/practices-by-attribute/${attributeId}?limit=${PAGE_SIZE}`;
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
            return api.get(apiURL);
          }
        );

        Promise.all(urls)
          .then((res) => {
            const [step1, step2, step3, step4] = res;
            setPracticesByAttributes({
              1: step1.data,
              2: step2.data,
              3: step3.data,
              4: step4.data,
            });
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            setPage(1);
            setTotal(100);
            setLoading(false);
          });
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    },
    [loading, page, filter, sourcingStragegyCycleOptions]
  );

  const handleOnFinish = (payload) => {
    PLState.update((s) => {
      s.filterV2 = payload;
    });
    setPage(1);
    setLoading(true);
    fetchData(true);
  };

  const handleRefreshSearch = () => {
    const def = {
      search: "",
      impact_area: null,
      sourcing_strategy_cycle: null,
      procurement_principles: null,
    };
    form.setFieldsValue(def);
    PLState.update((s) => {
      s.filterV2 = def;
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

  const PracticeList = () => (
    <div id="scrollableDiv" className="intervention-library-content-body">
      {!isEmpty(practiceByAttributes) &&
        sourcingStragegyCycleOptions.map((it, idx) => {
          const cardColor = SOURCING_STRATEGY_CYCLE_COLORS[idx];
          const cardIcon = SEARCHBOX_ICONS[idx];
          return (
            <div
              key={`ssc-item-${it.value}`}
              className="il-practice-by-attribute-wrapper"
            >
              <div className="il-attribute-title">
                <div className="left">{it.label}</div>
                <Divider />
              </div>
              <InfiniteScroll
                dataLength={practiceByAttributes[it.value].data.length}
                // next={() => {
                //   setLoading(true);
                //   setPage(page + 1);
                //   setTimeout(() => {
                //     fetchData();
                //   }, 1000);
                // }}
                // hasMore={practices.length < total}
                hasMore={false}
                loader={
                  <Divider plain>
                    <Spin spinning />
                  </Divider>
                }
                // endMessage={
                //   <Divider plain>
                //     {!loading && <em>No more results available.</em>}
                //   </Divider>
                // }
                scrollableTarget="scrollableDiv"
                style={{ overflowX: "hidden" }}
              >
                <List
                  grid={{
                    gutter: 16,
                    xs: 1,
                    sm: 2,
                    md: 3,
                    lg: 3,
                    xl: 3,
                    xxl: 3,
                  }}
                  dataSource={practiceByAttributes[it.value].data}
                  loading={loading}
                  renderItem={(practice) => {
                    const sourcingPrinciplesLabels =
                      procurementPrincipleOptions.map((p) => p.label);
                    const sourcingPrinciplesTags = practice?.tags?.filter(
                      (tag) => sourcingPrinciplesLabels.includes(tag)
                    );
                    return (
                      <List.Item key={practice.id}>
                        <div
                          className="intervention-card"
                          style={{
                            backgroundColor: cardColor.backgroundColor,
                            borderLeft: `2px solid ${cardColor.shadowColor}`,
                          }}
                        >
                          <div className="intervention-card-header">
                            <Tooltip title={cardIcon.name}>
                              <img
                                className="ssc-step"
                                src={cardIcon.icon}
                                alt={cardIcon.name}
                              />
                            </Tooltip>
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
                          {/* TAGS */}
                          {sourcingPrinciplesTags?.length ? (
                            <div className="intervention-cart-tags">
                              <div className="ict-title">
                                Sourcing principles
                              </div>
                              <div className="ict-tags-wrapper">
                                {sourcingPrinciplesTags?.map((tag) => (
                                  <Tag key={tag}>{tag}</Tag>
                                ))}
                              </div>
                            </div>
                          ) : (
                            ""
                          )}
                          {/* EOL TAGS */}
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
                    );
                  }}
                />
              </InfiniteScroll>
            </div>
          );
        })}
    </div>
  );

  const NoData = () => (
    <div id="scrollableDiv" className="intervention-library-content-body">
      {loading ? (
        <div className="no-data-wrapper">
          <Divider plain>
            <Spin spinning />
          </Divider>
        </div>
      ) : (
        <div className="no-data-wrapper">
          <h2>No data</h2>
          <p>No more results available.</p>
          <Link
            className="button button-green-fill"
            onClick={handleRefreshSearch}
          >
            Refresh search
          </Link>
        </div>
      )}
    </div>
  );

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
              {SEARCHBOX_ICONS.map((it) => (
                <Tooltip key={it.name} title={it.name}>
                  <img
                    src={it.icon}
                    alt={it.name}
                    className="il-search-box-icon"
                  />
                </Tooltip>
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

        {/* LOAD PRACTICES LIST */}
        {isAllPraticesByAttributeHasNoData ? <NoData /> : <PracticeList />}
      </div>
    </div>
  );
};

export default InterventionLibrary;
