import React, { useState, useEffect, useCallback } from "react";
import { ContentLayout, TableContent } from "../../../components/layout";
import { Link } from "react-router-dom";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { api } from "../../../lib";
import "./company.scss";
import { Space, Popconfirm, message } from "antd";
import { routePath } from "../../../components/route";

const perPage = 10;
const defData = {
  current: 1,
  data: [],
  total: 0,
  total_page: 1,
};

const Company = () => {
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState(null);
  const [data, setData] = useState(defData);
  const [messageApi, messageContextHolder] = message.useMessage();

  const fetchCompany = useCallback(({ currentPage, search }) => {
    setLoading(true);
    let url = `company?page=${currentPage}&limit=${perPage}`;
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
  }, []);

  useEffect(() => {
    fetchCompany({ currentPage, search });
  }, [currentPage, search, fetchCompany]);

  const handleDeleteCompany = (company) => {
    api
      .delete(`company/${company.id}`)
      .then(() => {
        messageApi.open({
          type: "success",
          content: "Company deleted successfully.",
        });
        fetchCompany({ currentPage, search });
      })
      .catch((e) => {
        const { status, data } = e.response;
        if (status === 409) {
          messageApi.open({
            type: "warning",
            content: data.detail,
          });
        } else {
          messageApi.open({
            type: "error",
            content: "Failed! Something went wrong.",
          });
        }
      });
  };

  const columns = [
    {
      title: "Company name",
      dataIndex: "name",
      key: "name",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "# of Users",
      dataIndex: "count_users",
      key: "count_users",
      sorter: (a, b) => a.count_users.localeCompare(b.count_users),
    },
    {
      title: "# of Cases",
      dataIndex: "count_cases",
      key: "count_cases",
      sorter: (a, b) => a.count_cases.localeCompare(b.count_cases),
    },
    {
      key: "action",
      width: "7%",
      align: "center",
      render: (text, record) => (
        <Space align="center">
          <Link to={`/admin/company/${record.id}`}>
            <EditOutlined />
          </Link>
          <Link>
            <Popconfirm
              title="Delete Company"
              description={`Are you sure you want to delete the company ${record.name}?`}
              onConfirm={() => handleDeleteCompany(record)}
              okText="Yes"
              cancelText="No"
              placement="leftBottom"
            >
              <DeleteOutlined style={{ color: "red" }} />
            </Popconfirm>
          </Link>
        </Space>
      ),
    },
  ];

  const onSearch = (value) => setSearch(value);

  return (
    <ContentLayout
      breadcrumbItems={[
        { title: "Home", href: routePath.idc.dashboard },
        { title: "Companies", href: "/admin/companies" },
      ]}
      title="Company Management"
      wrapperId="company"
    >
      <TableContent
        title="All Companies"
        dataSource={data.data}
        columns={columns}
        searchProps={{
          placeholder: "Find Company",
          style: { width: 300 },
          onSearch: onSearch,
        }}
        buttonProps={{
          text: "Add Company",
          to: "/admin/company/new",
        }}
        loading={loading}
        paginationProps={{
          current: currentPage,
          pageSize: perPage,
          total: data.total,
          onChange: (page) => setCurrentPage(page),
        }}
      />
      {/* message context holder */}
      {messageContextHolder}
    </ContentLayout>
  );
};

export default Company;
