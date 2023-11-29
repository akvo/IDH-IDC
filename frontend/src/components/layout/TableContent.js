import React from "react";
import { Row, Col, Table, Card, Input, Space } from "antd";
import { Link } from "react-router-dom";
import isEmpty from "lodash/isEmpty";

const { Search } = Input;

const TableContent = ({
  title = "Data",
  filterComponent = null,
  dataSource = [],
  columns = [],
  loading = true,
  searchProps = {},
  buttonProps = {},
  paginationProps = {},
  otherFilters = [],
}) => {
  return (
    <Row data-testid="table-content">
      <Col span={24}>
        <Card className="search-and-add">
          <Row align="middle">
            <Col span={20}>
              <Space size={[8, 16]} wrap>
                <Search className="search" allowClear {...searchProps} />
                {otherFilters.map((comp) => comp)}
              </Space>
            </Col>
            <Col span={4} align="right">
              {!isEmpty(buttonProps) && (
                <Link className="button button-secondary" to={buttonProps.to}>
                  {buttonProps.text}
                </Link>
              )}
            </Col>
          </Row>
        </Card>
      </Col>
      <Col span={24}>
        <Row align="middle" style={{ background: "#fff", padding: "6px 24px" }}>
          <Col span={4}>
            <h4>{title}</h4>
          </Col>
          <Col span={20} align="end">
            {filterComponent ? (
              <div style={{ float: "right" }}>{filterComponent}</div>
            ) : (
              ""
            )}
          </Col>
        </Row>
        <Table
          rowKey="id"
          dataSource={dataSource}
          columns={columns}
          loading={loading}
          pagination={paginationProps}
        />
      </Col>
    </Row>
  );
};

export default TableContent;
