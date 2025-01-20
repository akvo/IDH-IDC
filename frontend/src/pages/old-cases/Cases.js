import React, { useEffect, useState, useMemo } from "react";
import { ContentLayout, TableContent } from "../../components/layout";
import { Link, useSearchParams } from "react-router-dom";
import {
  EditOutlined,
  UserSwitchOutlined,
  SaveOutlined,
  CloseOutlined,
  EyeOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { api } from "../../lib";
import { UIState, UserState } from "../../store";
import {
  Select,
  Space,
  Button,
  Row,
  Col,
  Popconfirm,
  message,
  Input,
  InputNumber,
} from "antd";
import { selectProps, DebounceSelect } from "./components";
import { isEmpty } from "lodash";
import { adminRole } from "../../store/static";

const perPage = 10;
const defData = {
  current: 1,
  data: [],
  total: 0,
  total_page: 1,
};
const filterProps = {
  ...selectProps,
  style: { width: window.innerHeight * 0.175 },
};

const Cases = () => {
  const [searchParams] = useSearchParams();
  const caseOwner = searchParams.get("owner");

  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState(null);
  const [data, setData] = useState(defData);
  const [country, setCountry] = useState(null);
  const [commodity, setCommodity] = useState(null);
  const [tags, setTags] = useState([]);
  const [email, setEmail] = useState(caseOwner || null);
  const [year, setYear] = useState(null);

  const tagOptions = UIState.useState((s) => s.tagOptions);
  const {
    id: userID,
    email: userEmail,
    role: userRole,
    internal_user: userInternal,
    case_access: userCaseAccess,
  } = UserState.useState((s) => s);

  const [showChangeOwnerForm, setShowChangeOwnerForm] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  const isCaseCreator = useMemo(() => {
    if (adminRole.includes(userRole)) {
      return true;
    }
    if (userInternal) {
      return true;
    }
    return false;
  }, [userRole, userInternal]);

  useEffect(() => {
    if (userID || refresh) {
      setLoading(true);
      let url = `case?page=${currentPage}&limit=${perPage}`;
      if (search) {
        url = `${url}&search=${search}`;
      }
      if (country) {
        url = `${url}&country=${country}`;
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
  }, [
    currentPage,
    search,
    userID,
    commodity,
    country,
    tags,
    refresh,
    year,
    email,
  ]);

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

  const columns = [
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
      width: "10%",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.country.localeCompare(b.country),
    },
    {
      title: "Case Name",
      dataIndex: "name",
      key: "case",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Primary Commodity",
      key: "primary_commodity",
      render: (record) => {
        const findPrimaryCommodity = commodityOptios.find(
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
      title: "Year",
      dataIndex: "year",
      key: "year",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.year - b.year,
    },
    {
      title: "Case Owner",
      key: "created_by",
      width: "20%",
      render: (row) => {
        // case owner row.created_by !== userEmail
        if (!adminRole.includes(userRole)) {
          return row.created_by;
        }
        if (row.id === showChangeOwnerForm) {
          return (
            <Row align="center" gutter={[6, 6]}>
              <Col span={20}>
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
              <Col span={4}>
                <Space align="center">
                  <Button
                    size="small"
                    icon={<SaveOutlined />}
                    shape="circle"
                    onClick={() => handleOnUpdateCaseOwner(row)}
                  />
                  <Button
                    size="small"
                    icon={<CloseOutlined />}
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
      key: "action",
      width: "5%",
      align: "center",
      render: (text, record) => {
        const caseDetailURL = `/old-cases/${record.id}`;
        const EditButton = (
          <Link to={caseDetailURL}>
            <EditOutlined />
          </Link>
        );
        const ViewButton = (
          <Link to={caseDetailURL}>
            <EyeOutlined />
          </Link>
        );

        if (adminRole.includes(userRole)) {
          return (
            <Space size="large">
              {EditButton}
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

        // check case access
        const userPermission = userCaseAccess.find(
          (a) => a.case === record.id
        )?.permission;
        // allow internal user case owner to edit case
        if (userInternal && record.created_by === userEmail) {
          return EditButton;
        }
        if ((userInternal && !userPermission) || userPermission === "view") {
          return ViewButton;
        }
        if (userPermission === "edit") {
          return EditButton;
        }
        return ViewButton;
      },
    },
  ];

  const onSearch = (value) => setSearch(value);

  const countryOptions = window.master.countries;
  const commodityOptios = window.master.commodity_categories
    .flatMap((c) => c.commodities)
    .map((c) => ({ label: c.name, value: c.id }));

  const otherFilters = (
    <Space>
      <Select
        {...filterProps}
        key="1"
        options={countryOptions}
        placeholder="Country"
        value={country}
        onChange={setCountry}
      />
      <Select
        {...filterProps}
        key="2"
        options={commodityOptios}
        placeholder="Primary Commodity"
        value={commodity}
        onChange={setCommodity}
      />
      <Select
        {...filterProps}
        key="3"
        options={tagOptions}
        placeholder="Tags"
        mode="multiple"
        value={tags}
        onChange={setTags}
      />
      <Input
        key="4"
        placeholder="Case owner email"
        onChange={(e) => setEmail(e.target.value)}
        value={email}
      />
      <InputNumber
        key="5"
        placeholder="Year"
        controls={false}
        onChange={setYear}
        value={year}
      />
    </Space>
  );

  return (
    <ContentLayout
      breadcrumbItems={[
        { title: "Home", href: "/welcome" },
        { title: "Cases", href: "/old-cases" },
      ]}
      title="Cases"
      wrapperId="case"
    >
      {contextHolder}
      <TableContent
        title="All Cases"
        dataSource={data.data}
        columns={columns}
        searchProps={{
          placeholder: "Find Case",
          style: { width: 375 },
          onSearch: onSearch,
        }}
        buttonProps={
          isCaseCreator
            ? {
                text: "New Case",
                to: "/old-cases/new",
              }
            : {}
        }
        loading={loading}
        paginationProps={{
          current: currentPage,
          pageSize: perPage,
          total: data.total,
          onChange: (page) => setCurrentPage(page),
        }}
        otherFilters={otherFilters}
        showTotalPagination={true}
      />
    </ContentLayout>
  );
};

export default Cases;
