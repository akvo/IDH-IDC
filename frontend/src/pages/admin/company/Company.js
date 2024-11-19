import React, { useState, useEffect } from "react";
import { ContentLayout, TableContent } from "../../../components/layout";
import { Link } from "react-router-dom";
import { EditOutlined } from "@ant-design/icons";
import { api } from "../../../lib";
import "./company.scss";

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

  useEffect(() => {
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
  }, [currentPage, search]);

  const columns = [
    {
      title: "Company Name",
      dataIndex: "name",
      key: "name",
      width: "25%",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      key: "action",
      width: "5%",
      align: "center",
      render: (text, record) => (
        <Link to={`/admin/company/${record.id}`}>
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
        { title: "Company", href: "/admin/company" },
      ]}
      title="Company Management"
      wrapperId="company"
    >
      <TableContent
        title="All Company"
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
    </ContentLayout>
  );
};

export default Company;
