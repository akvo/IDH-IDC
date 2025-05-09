import React from "react";
import { Row, Col, Table, Card, Input, Space, Button } from "antd";
import { Link } from "react-router-dom";
import isEmpty from "lodash/isEmpty";

const { Search } = Input;

const TableContent = ({
  title = "Data",
  tableHeaderFilterComponent = null,
  dataSource = [],
  columns = [],
  loading = true,
  searchProps = {},
  buttonProps = {},
  paginationProps = {},
  otherFilters = null,
  showTotalPagination = false,
}) => {
  const showTotalOption = showTotalPagination
    ? {
        showTotal: (total) => (
          <div
            style={{
              position: "absolute",
              left: 0,
              marginLeft: "14px",
            }}
          >
            Total number of cases: {total}
          </div>
        ),
      }
    : {};

  return (
    <Row data-testid="table-content" className="table-content-container">
      <Col span={24}>
        <Card className="search-and-add">
          <Row align="middle">
            <Col span={20}>
              <Space size={[8, 16]} wrap>
                <Search className="search" allowClear {...searchProps} />
                {otherFilters ? otherFilters : null}
              </Space>
            </Col>
            <Col span={4} align="right">
              {!isEmpty(buttonProps) && (
                <Link to={buttonProps.to}>
                  <Button className="button-ghost">{buttonProps.text}</Button>
                </Link>
              )}
            </Col>
          </Row>
        </Card>
      </Col>
      <Col span={24}>
        <Table
          rowKey="id"
          title={() => (
            <Row align="middle" gutter={[8, 8]}>
              <Col span={4}>
                <h4>{title}</h4>
              </Col>
              <Col span={20} align="end">
                {tableHeaderFilterComponent ? (
                  <div style={{ float: "right" }}>
                    {tableHeaderFilterComponent}
                  </div>
                ) : null}
              </Col>
            </Row>
          )}
          className="table-content-wrapper"
          dataSource={dataSource}
          columns={columns}
          loading={loading}
          pagination={{
            ...paginationProps,
            ...showTotalOption,
            showSizeChanger: false,
          }}
        />
      </Col>
    </Row>
  );
};

export default TableContent;
