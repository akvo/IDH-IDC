import React, { useEffect, useState, useMemo } from "react";
import { ContentLayout, TableContent } from "../../components/layout";
import { Link } from "react-router-dom";
import {
  EditOutlined,
  UserSwitchOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { api } from "../../lib";
import { UIState, UserState } from "../../store";
import { Select, Space, Button, Row, Col } from "antd";
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
  style: { width: window.innerHeight * 0.225 },
};

const Cases = () => {
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState(null);
  const [data, setData] = useState(defData);
  const [country, setCountry] = useState(null);
  const [commodity, setCommodity] = useState(null);
  const [tags, setTags] = useState([]);

  const tagOptions = UIState.useState((s) => s.tagOptions);
  const {
    id: userID,
    email: userEmail,
    business_unit_detail: userBusinessUnits,
    role: userRole,
  } = UserState.useState((s) => s);

  const [showChangeOwnerForm, setShowChangeOwnerForm] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const isCaseCreator = useMemo(() => {
    if (adminRole.includes(userRole)) {
      return true;
    }
    if (userRole === "user" && userBusinessUnits?.length) {
      return true;
    }
    return false;
  }, [userRole, userBusinessUnits]);

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
    }
  }, [currentPage, search, userID, commodity, country, tags, refresh]);

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
        if (row.created_by !== userEmail) {
          return row.created_by;
        }
        if (row.id === showChangeOwnerForm) {
          return (
            <Row align="center" gutter={[8, 8]}>
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
      render: (text, record) => (
        <Link to={`/cases/${record.id}`}>
          <EditOutlined />
        </Link>
      ),
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
        placeholder="Filter by Country"
        value={country}
        onChange={setCountry}
      />
      <Select
        {...filterProps}
        key="2"
        options={commodityOptios}
        placeholder="Filter by Focus Commodity"
        value={commodity}
        onChange={setCommodity}
      />
      <Select
        {...filterProps}
        key="3"
        options={tagOptions}
        placeholder="Filter by Tags"
        mode="multiple"
        value={tags}
        onChange={setTags}
      />
    </Space>
  );

  return (
    <ContentLayout
      breadcrumbItems={[
        { title: "Home", href: "/welcome" },
        { title: "Cases", href: "/cases" },
      ]}
      title="Cases"
    >
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
                to: "/cases/new",
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
        tableHeaderFilterComponent={otherFilters}
      />
    </ContentLayout>
  );
};

export default Cases;
