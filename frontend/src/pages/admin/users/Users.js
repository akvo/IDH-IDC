import React, { useEffect, useState, useCallback } from "react";
import { ContentLayout, TableContent } from "../../../components/layout";
import { Link } from "react-router-dom";
import { EditOutlined, DeleteTwoTone } from "@ant-design/icons";
import upperFirst from "lodash/upperFirst";
import { api } from "../../../lib";
import {
  Button,
  Checkbox,
  Select,
  Space,
  Popconfirm,
  Modal,
  List,
  message,
} from "antd";
import { selectProps } from "../../../lib";
import "./user.scss";
import { LINK_TO_CASE_PROD } from "../../../store/static";

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

const userRoleOptions = [
  {
    label: "Super Admin",
    value: "super_admin",
  },
  {
    label: "Admin",
    value: "admin",
  },
  {
    label: "Internal User",
    value: "internal",
  },
  {
    label: "External User",
    value: "external",
  },
];

const Users = () => {
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState(null);
  const [data, setData] = useState(defData);
  const [showApprovedUser, setShowApprovedUser] = useState(true);
  const [role, setRole] = useState(null);
  const [deleting, setDeleting] = useState([]);
  const [modal, contextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();

  const fetchUser = useCallback(
    ({ currentPage, search, showApprovedUser, role }) => {
      setLoading(true);
      let url = `user?page=${currentPage}&limit=${perPage}&approved=${showApprovedUser}`;
      if (search) {
        url = `${url}&search=${search}`;
      }
      if (role) {
        url = `${url}&role=${role}`;
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
    []
  );

  useEffect(() => {
    fetchUser({ currentPage, search, showApprovedUser, role });
  }, [currentPage, search, showApprovedUser, role, fetchUser]);

  const handleDeleteUser = (user) => {
    setDeleting((prev) => [...prev, user.id]);
    api
      .delete(`user/${user.id}`)
      .then(() => {
        messageApi.open({
          type: "success",
          content: "User deleted successfully.",
        });
        fetchUser({ currentPage, search, showApprovedUser, role });
      })
      .catch((e) => {
        const { status, data } = e.response;
        if (status === 409) {
          const { cases } = data.detail;
          // show the case names and add a button "Go to cases"
          modal.confirm({
            title: `Unable to delete user ${user.email}`,
            content: (
              <div style={{ marginLeft: "-26px" }}>
                <h4>The following cases are still owned by this user:</h4>
                <List
                  header={null}
                  footer={null}
                  size="small"
                  bordered
                  style={{ maxHeight: "200px", overflow: "auto" }}
                  dataSource={cases}
                  renderItem={(item) => <List.Item>{item.label}</List.Item>}
                />
                <p>
                  Please assign new owners for these cases before deleting this
                  user.
                </p>
              </div>
            ),
            okText: "Go to cases",
            onOk: () => {
              const URL = `${LINK_TO_CASE_PROD}?owner=${user.email}`;
              window.open(URL, "_blank");
            },
            cancelText: "Cancel",
          });
        } else {
          messageApi.open({
            type: "error",
            content: "Failed! Something went wrong.",
          });
        }
      })
      .finally(() => {
        setDeleting((prev) => prev.filter((id) => id !== user.id));
      });
  };

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
      render: (text, record) => {
        const res = text
          .split("_")
          .map((x) => upperFirst(x))
          .join(" ");
        if (record.role === "user") {
          const extra =
            record.business_unit_count > 0 ? "Internal" : "External";
          return `${extra} ${res}`;
        }
        return res;
      },
    },
    {
      key: "action",
      width: "5%",
      align: "center",
      render: (text, record) => (
        <Space align="center">
          <Link to={`/admin/user/${record.id}`}>
            <EditOutlined style={{ marginTop: "5px" }} />
          </Link>
          <Popconfirm
            title="Delete User"
            description={`Are you sure you want to delete the user ${record.email}?`}
            onConfirm={() => handleDeleteUser(record)}
            okText="Yes"
            cancelText="No"
            placement="leftBottom"
          >
            <Button
              size="small"
              type="text"
              icon={<DeleteTwoTone twoToneColor="#eb2f96" />}
              loading={deleting.find((id) => id === record.id) ? true : false}
              disabled={deleting.length ? true : false}
            />
          </Popconfirm>
        </Space>
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
      title="User Management"
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
        otherFilters={
          <Select
            {...filterProps}
            options={userRoleOptions}
            placeholder="User Role"
            value={role}
            onChange={setRole}
          />
        }
      />
      {/* modal context holder */}
      {contextHolder}
      {/* message context holder */}
      {messageContextHolder}
    </ContentLayout>
  );
};

export default Users;
