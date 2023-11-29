import React, { useEffect, useState } from "react";
import { ContentLayout, TableContent } from "../../../components/layout";
import { Link } from "react-router-dom";
import { EditOutlined } from "@ant-design/icons";
import upperFirst from "lodash/upperFirst";
import { api } from "../../../lib";
import { Checkbox } from "antd";
import "./user.scss";

const perPage = 10;
const defData = {
  current: 1,
  data: [],
  total: 0,
  total_page: 1,
};

const Users = () => {
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState(null);
  const [data, setData] = useState(defData);
  const [showApprovedUser, setShowApprovedUser] = useState(true);

  useEffect(() => {
    setLoading(true);
    let url = `user?page=${currentPage}&limit=${perPage}&approved=${showApprovedUser}`;
    if (search) {
      url = `${url}&search=${search}`;
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
  }, [currentPage, search, showApprovedUser]);

  const columns = [
    {
      title: "Fullname",
      dataIndex: "fullname",
      key: "fullname",
      width: "35%",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.fullname.localeCompare(b.fullname),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: "User Role",
      dataIndex: "role",
      key: "role",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.role.localeCompare(b.role),
      render: (text) =>
        text
          .split("_")
          .map((x) => upperFirst(x))
          .join(" "),
    },
    {
      key: "action",
      width: "5%",
      align: "center",
      render: (text, record) => (
        <Link to={`/admin/user/${record.id}`}>
          <EditOutlined />
        </Link>
      ),
    },
  ];

  const onSearch = (value) => setSearch(value);

  return (
    <ContentLayout
      breadcrumbItems={[
        { title: "Home", href: "/welcome" },
        { title: "Users", href: "/admin/users" },
      ]}
      title="Users"
      wrapperId="user"
    >
      <TableContent
        title="All Users"
        tableHeaderFilterComponent={
          <>
            <Checkbox
              checked={showApprovedUser}
              onChange={(e) => setShowApprovedUser(e.target.checked)}
            >
              {" "}
              Show Approved User
            </Checkbox>
          </>
        }
        dataSource={data.data}
        columns={columns}
        searchProps={{
          placeholder: "Find User",
          style: { width: 350 },
          onSearch: onSearch,
        }}
        buttonProps={{
          text: "Add User",
          to: "/admin/user/new",
        }}
        loading={loading}
        paginationProps={{
          current: currentPage,
          pageSize: perPage,
          total: data.total,
          onChange: (page) => setCurrentPage(page),
        }}
      />
    </ContentLayout>
  );
};

export default Users;
