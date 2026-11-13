import React, { memo, useMemo } from "react";
import { Button, Table } from "antd";
import {
  DownloadOutlined,
  ExportOutlined,
  FileTextOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import HighlightedText from "./HighlightedText";

// Resource URLs are file paths on this site or external websites. Anything
// else (e.g. `javascript:`) gets no link.
export const getResourceLink = (url = "") => {
  if (/^https?:\/\//i.test(url)) {
    return { href: url, external: true };
  }
  if (url.startsWith("/") && !url.startsWith("//")) {
    return { href: url, external: false };
  }
  return null;
};

const ResourceAction = ({ resource }) => {
  const link = getResourceLink(resource.url);
  if (!link) {
    return null;
  }
  return link.external ? (
    <Button
      className="academy-resource-action"
      icon={<ExportOutlined />}
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${resource.name} (opens in a new tab)`}
    />
  ) : (
    <Button
      className="academy-resource-action"
      icon={<DownloadOutlined />}
      href={link.href}
      download
      aria-label={`Download ${resource.name}`}
    />
  );
};

const ResourcesTable = ({ rows, loading, highlight, emptyText }) => {
  // Rebuilt only when the highlighted term changes
  const columns = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (name, resource) => (
          <span className="academy-resource-name">
            <span className="academy-resource-icon" aria-hidden="true">
              {getResourceLink(resource.url)?.external ? (
                <GlobalOutlined />
              ) : (
                <FileTextOutlined />
              )}
            </span>
            <HighlightedText text={name} highlight={highlight} />
          </span>
        ),
      },
      {
        title: "Type",
        dataIndex: "type",
        key: "type",
        width: 180,
        render: (type) => <span className="academy-type-tag">{type}</span>,
      },
      {
        title: "Actions",
        key: "actions",
        width: 120,
        render: (_, resource) => <ResourceAction resource={resource} />,
      },
    ],
    [highlight]
  );

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

export default memo(ResourcesTable);
