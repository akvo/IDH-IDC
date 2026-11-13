import React, { memo } from "react";
import { Table } from "antd";
import HighlightedText from "./HighlightedText";

// Living income terms; the search term is highlighted in names and
// definitions
const GlossaryTable = ({ rows, loading, highlight, emptyText }) => {
  const columns = [
    {
      title: "Name",
      dataIndex: "term",
      key: "term",
      width: "26%",
      render: (term) => (
        <span className="academy-glossary-term">
          <HighlightedText text={term} highlight={highlight} />
        </span>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type) => <span className="academy-glossary-type">{type}</span>,
    },
    {
      title: "Definition",
      dataIndex: "definition",
      key: "definition",
      render: (definition) => (
        <span className="academy-glossary-definition">
          <HighlightedText text={definition} highlight={highlight} />
        </span>
      ),
    },
  ];

  return (
    <Table
      className="academy-data-table"
      rowKey="id"
      columns={columns}
      dataSource={rows}
      loading={loading}
      pagination={false}
      locale={{ emptyText }}
    />
  );
};

export default memo(GlossaryTable);
