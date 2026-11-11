import React, { useEffect, useState } from "react";
import { Modal, Table, Alert } from "antd";
import { Link } from "react-router-dom";
import ProgressStatusTag from "./ProgressStatusTag";
import academyService from "../services/academy";
import { getChapterPath } from "../utils";

export const HISTORY_PAGE_SIZE = 10;

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

// The API stores UTC (`datetime.utcnow()`) but serialises it without a zone,
// which browsers would otherwise read as local time
const HAS_TIMEZONE = /(Z|[+-]\d{2}:?\d{2})$/i;
export const parseApiDate = (value) =>
  new Date(HAS_TIMEZONE.test(value) ? value : `${value}Z`);

export const formatDate = (value) =>
  value ? dateFormatter.format(parseApiDate(value)) : "—";

const columns = [
  {
    title: "Chapter",
    key: "chapter",
    render: (_, item) => (
      <div className="academy-history-chapter">
        <Link to={getChapterPath(item.chapter_id)}>{item.chapter_title}</Link>
        <span className="academy-history-module">
          Module {item.module_order_index} · {item.module_title}
        </span>
      </div>
    ),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status) => <ProgressStatusTag status={status} />,
  },
  {
    title: "Last opened",
    dataIndex: "last_opened_at",
    key: "last_opened_at",
    render: formatDate,
  },
  {
    title: "Completed",
    dataIndex: "completed_at",
    key: "completed_at",
    render: formatDate,
  },
];

const ChapterHistoryModal = ({ open, onClose }) => {
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    // Ignore responses that arrive after a newer page was requested
    let ignore = false;
    setLoading(true);
    setError(null);
    academyService
      .getHistory({ page, pageSize: HISTORY_PAGE_SIZE })
      .then((res) => {
        if (!ignore) {
          setHistory({ data: res.data || [], total: res.total || 0 });
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [open, page]);

  return (
    <Modal
      title="Reading history"
      open={open}
      onCancel={onClose}
      // Reopening starts from the first page
      afterClose={() => setPage(1)}
      footer={null}
      width={880}
      destroyOnClose
      className="academy-history-modal"
    >
      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          className="academy-history-error"
        />
      )}
      <Table
        rowKey="chapter_id"
        columns={columns}
        dataSource={history.data}
        loading={loading}
        locale={{ emptyText: "You haven't opened any chapters yet." }}
        pagination={{
          current: page,
          pageSize: HISTORY_PAGE_SIZE,
          total: history.total,
          showSizeChanger: false,
          hideOnSinglePage: true,
          onChange: setPage,
        }}
      />
    </Modal>
  );
};

export default ChapterHistoryModal;
