import React, { useState, useEffect, useMemo } from "react";
import "./cases.scss";
import { ContentLayout } from "../../components/layout";
import { commodityOptions, CaseStatusEnum } from "../../store/static";
import { DebounceSelect, CaseFilter, CaseSettings } from "./components";
import {
  Row,
  Col,
  Button,
  Table,
  Input,
  Space,
  Popconfirm,
  message,
  Dropdown,
} from "antd";
import {
  PlusOutlined,
  FilterOutlined,
  UserSwitchOutlined,
  SaveOutlined,
  CloseOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Link, useSearchParams } from "react-router-dom";
import { UIState, UserState } from "../../store";
import { api } from "../../lib";
import { isEmpty } from "lodash";
import { adminRole } from "../../store/static";
import { stepPath } from "./store";
import { resetCurrentCaseState } from "./store/current_case";
import { resetCaseVisualState } from "./store/case_visual";
import { resetCaseUIState } from "./store/case_ui";
import { ViewSummaryModal } from "../../components/utils";
import { routePath } from "../../components/route";

const { Search } = Input;

const perPage = 10;
const defData = {
  current: 1,
  data: [],
  total: 0,
  total_page: 1,
};

const Cases = () => {
  const [searchParams] = useSearchParams();
  const caseOwner = searchParams.get("owner");

  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState(null);
  const [data, setData] = useState(defData);
  const [filters, setFilters] = useState({
    country: null,
    company: null,
    commodity: null,
    tags: [],
    email: caseOwner || null,
    year: null,
    shared_with_me: false,
    status: null,
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [caseSettingModalVisible, setCaseSettingModalVisible] = useState(false);

  const tagOptions = UIState.useState((s) => s.tagOptions);
  const {
    id: userID,
    role: userRole,
    internal_user: userInternal,
    email: userEmail,
    // case_access: userCaseAccess,
    // company: userCompany,
  } = UserState.useState((s) => s);

  const [showChangeOwnerForm, setShowChangeOwnerForm] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [activeButton, setActiveButton] = useState("all-cases");

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedCaseData, setSelectedCaseData] = useState({});

  const [messageApi, contextHolder] = message.useMessage();

  const searchProps = {
    placeholder: "Find Case",
    style: { width: 350 },
    onSearch: (value) => setSearch(value),
  };

  const resetFilters = () => {
    setFilters({
      country: null,
      company: null,
      commodity: null,
      tags: [],
      email: caseOwner || null,
      year: null,
      shared_with_me: false,
      status: null,
    });
  };

  const caseSelectorItems = [
    {
      key: "all-cases",
      label: "All cases",
      onClick: () => {
        resetFilters();
        setActiveButton("all-cases");
      },
    },
    {
      key: "my-cases",
      label: "My cases",
      onClick: () => {
        resetFilters();
        setActiveButton("my-cases");
        setFilters((prev) => ({
          ...prev,
          email: userEmail,
        }));
      },
    },
    {
      key: "shared-with-me",
      label: "Shared with me",
      onClick: () => {
        resetFilters();
        setActiveButton("shared-with-me");
        setFilters((prev) => ({
          ...prev,
          shared_with_me: true,
        }));
      },
    },
    {
      key: "completed",
      label: "Completed",
      onClick: () => {
        resetFilters();
        setActiveButton("completed");
        setFilters((prev) => ({
          ...prev,
          status: CaseStatusEnum.COMPLETED,
        }));
      },
    },
  ];

  const columns = [
    {
      title: "Case Name",
      dataIndex: "name",
      key: "case",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => {
        const step = record?.has_segment_with_answers
          ? stepPath.step3.label
          : stepPath.step1.label;
        const caseDetailURL = `${routePath.idc.case}/${record.id}/${step}`;
        const linkText = (
          <Link
            style={{ fontWeight: "bold", color: "#000" }}
            to={caseDetailURL}
          >
            {text}
          </Link>
        );
        return linkText;
        // check case access
        /*
        const userPermission = userCaseAccess.find(
          (a) => a.case === record.id
        )?.permission;
        // allow internal user case owner to edit case
        if (userInternal && record.created_by === userEmail) {
          return linkText;
        }
        if ((userInternal && !userPermission) || userPermission === "view") {
          return text;
        }
        if (userPermission === "edit") {
          return linkText;
        }
        return text;
        */
      },
    },
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
      width: "10%",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.country.localeCompare(b.country),
    },
    {
      title: "Primary Commodity",
      key: "primary_commodity",
      render: (record) => {
        const findPrimaryCommodity = commodityOptions.find(
          (co) => co.value === record.focus_commodity
        );
        if (!findPrimaryCommodity?.label) {
          return "-";
        }
        return findPrimaryCommodity.label;
      },
    },
    {
      title: "Tags",
      key: "tags",
      render: (record) => {
        const tags = record.tags
          .map((tag_id) => {
            const findTag = tagOptions.find((x) => x.value === tag_id);
            return findTag?.label || null;
          })
          .filter((x) => x);
        if (!tags.length) {
          return "-";
        }
        return tags.join(", ");
      },
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.year - b.year,
      render: (text) => {
        const datetime = new Date(text);
        const dateOnly = datetime.toLocaleDateString("en-CA");
        return dateOnly;
      },
    },
    {
      title: "Case Owner",
      key: "created_by",
      width: "12%",
      render: (row) => {
        // case owner row.created_by !== userEmail
        if (!adminRole.includes(userRole)) {
          return row.created_by;
        }
        if (row.id === showChangeOwnerForm) {
          return (
            <Row align="middle" justify="start" gutter={[6, 6]} wrap>
              <Col>
                <DebounceSelect
                  placeholder="Search for a user"
                  value={selectedUser}
                  fetchOptions={fetchUsers}
                  onChange={(value) => setSelectedUser(value)}
                  style={{
                    width: "100%",
                  }}
                  size="small"
                />
              </Col>
              <Col>
                <Space align="center" size="small">
                  <Button
                    size="small"
                    icon={<SaveOutlined style={{ fontSize: 12 }} />}
                    shape="circle"
                    onClick={() => handleOnUpdateCaseOwner(row)}
                  />
                  <Button
                    size="small"
                    icon={<CloseOutlined style={{ fontSize: 12 }} />}
                    shape="circle"
                    onClick={() => setShowChangeOwnerForm(null)}
                  />
                </Space>
              </Col>
            </Row>
          );
        }
        return (
          <Space align="center">
            <Button
              icon={<UserSwitchOutlined />}
              size="small"
              shape="circle"
              onClick={() => setShowChangeOwnerForm(row.id)}
            />
            <div>{row.created_by}</div>
          </Space>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.status - b.status,
      render: (val) => {
        const status = Object.entries(CaseStatusEnum)
          .map(([key, value]) => {
            if (value === CaseStatusEnum.INCOMPLETED) {
              return "IN PROGRESS";
            }
            if (value === val) {
              return key;
            }
            return null;
          })
          .filter((x) => x !== null);
        return <span style={{ fontSize: 13 }}>{status[0]}</span>;
      },
    },
    {
      title: "Actions",
      key: "action",
      width: "5%",
      align: "center",
      render: (text, record) => {
        const ViewSummaryButton = (
          <Button
            size="small"
            type="primary"
            disabled={!record?.has_scenario_data}
            style={{
              borderRadius: "20px",
              padding: "0px 10px",
            }}
            ghost
            onClick={() => handleOnClickViewSummary({ ...record })}
          >
            View Summary
          </Button>
        );

        if (adminRole.includes(userRole)) {
          return (
            <Space>
              {/* {EditButton} */}
              {ViewSummaryButton}
              <Popconfirm
                title="Delete Case"
                description="Are you sure want to delete this case?"
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
          );
        }
      },
    },
  ];

  useEffect(() => {
    // reset currentCase state
    resetCurrentCaseState();
    // reset case visual state
    resetCaseVisualState();
    // reset case ui state
    resetCaseUIState();
  }, []);

  useEffect(() => {
    if (userID || refresh) {
      const {
        country,
        commodity,
        tags,
        year,
        email,
        shared_with_me,
        status,
        company,
      } = filters;
      setLoading(true);
      let url = `case?page=${currentPage}&limit=${perPage}`;
      if (search) {
        url = `${url}&search=${search}`;
      }
      if (country) {
        url = `${url}&country=${country}`;
      }
      if (company) {
        url = `${url}&company=${company}`;
      }
      if (commodity) {
        url = `${url}&focus_commodity=${commodity}`;
      }
      if (!isEmpty(tags)) {
        const tagQuery = tags.join("&tags=");
        url = `${url}&tags=${tagQuery}`;
      }
      if (email) {
        url = `${url}&email=${email}`;
      }
      if (year) {
        url = `${url}&year=${year}`;
      }
      if (shared_with_me) {
        url = `${url}&shared_with_me=${shared_with_me}`;
      }
      if (status !== null) {
        url = `${url}&status=${status}`;
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
          setRefresh(false);
        });
    }
  }, [currentPage, userID, refresh, search, filters]);

  const isCaseCreator = useMemo(() => {
    if (adminRole.includes(userRole)) {
      return true;
    }
    if (userInternal) {
      return true;
    }
    return false;
  }, [userRole, userInternal]);

  const fetchUsers = (searchValue) => {
    return api
      .get(`user/search_dropdown?search=${searchValue}`)
      .then((res) => res.data);
  };

  const handleOnUpdateCaseOwner = (caseRecord) => {
    api
      .put(`update_case_owner/${caseRecord.id}?user_id=${selectedUser.value}`)
      .then(() => {
        setRefresh(true);
        setShowChangeOwnerForm(null);
      })
      .catch((e) => {
        console.error(e);
      });
  };

  const onConfirmDelete = (record) => {
    api
      .delete(`case/${record.id}`)
      .then(() => {
        setRefresh(true);
        messageApi.open({
          type: "success",
          content: "Case deleted successfully.",
        });
      })
      .catch(() => {
        messageApi.open({
          type: "error",
          content: "Failed! Something went wrong.",
        });
      });
  };

  const handleApplyFilters = ({ country, commodity, tags, year, company }) => {
    setFilters((prev) => ({
      ...prev,
      country,
      commodity,
      tags,
      year,
      company,
    }));
  };

  const handleOnClickViewSummary = (record) => {
    if (record?.has_scenario_data) {
      setSelectedCaseData(record);
      setShowSummaryModal(true);
    }
  };

  const handleOnCloseViewSummary = () => {
    setShowSummaryModal(false);
    setSelectedCaseData({});
  };

  return (
    <ContentLayout
      breadcrumbItems={[
        { title: "Home", href: routePath.idc.dashboard },
        { title: "Cases", href: routePath.idc.cases },
      ]}
      title="Cases"
      wrapperId="case"
      titleRighContent={
        <Space wrap>
          <Search className="search" allowClear {...searchProps} />
          <Dropdown
            trigger="click"
            placement="bottomRight"
            dropdownRender={() => (
              <CaseFilter
                filters={filters}
                handleApplyFilters={handleApplyFilters}
                handleClose={() => setDropdownOpen(false)}
              />
            )}
            open={dropdownOpen}
          >
            <Button
              className="button-ghost"
              icon={<FilterOutlined />}
              onClick={() => setDropdownOpen(true)}
            >
              Filter
            </Button>
          </Dropdown>
          {isCaseCreator && (
            <Button
              className="button-green-fill"
              icon={<PlusOutlined />}
              onClick={() => setCaseSettingModalVisible(true)}
            >
              Create new case
            </Button>
          )}
        </Space>
      }
    >
      {contextHolder}
      <Row gutter={[8, 8]} style={{ paddingBottom: 16 }}>
        {caseSelectorItems.map((cs) => (
          <Col key={cs.key}>
            <Button
              type={activeButton === cs.key ? "default" : "text"}
              onClick={cs.onClick}
            >
              {cs.label}
            </Button>
          </Col>
        ))}
      </Row>
      <Row className="table-content-container">
        <Col span={24}>
          <Table
            rowKey="id"
            className="table-content-wrapper"
            columns={columns}
            dataSource={data.data}
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: perPage,
              total: data.total,
              onChange: (page) => setCurrentPage(page),
              showSizeChanger: false,
              showTotal: (total) => (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    marginLeft: "14px",
                  }}
                >
                  Total Case: {total}
                </div>
              ),
            }}
          />
        </Col>
      </Row>

      <CaseSettings
        open={caseSettingModalVisible}
        handleCancel={() => setCaseSettingModalVisible(false)}
      />

      <ViewSummaryModal
        showSummaryModal={showSummaryModal}
        setShowSummaryModal={handleOnCloseViewSummary}
        selectedCaseData={selectedCaseData}
      />
    </ContentLayout>
  );
};

export default Cases;
