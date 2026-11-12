import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Alert, Button, Pagination, Spin } from "antd";
import ChapterRow from "./ChapterRow";
import academyService, { isRequestCancelled } from "../services/academy";
import { PROGRESS_STATUS } from "../utils";

export const HISTORY_PAGE_SIZE = 10;

// History items use chapter_* keys; the row card expects the overview shape
const toChapter = (item) => ({
  id: item.chapter_id,
  module_id: item.module_id,
  chapter_number: item.chapter_number,
  title: item.chapter_title,
  status: item.status,
});

const ChapterHistoryModal = ({
  open,
  onClose,
  onToggleComplete,
  onContinue,
}) => {
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingChapterIds, setPendingChapterIds] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!open) {
      return;
    }
    // Changing page or closing cancels the request for the previous page
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    academyService
      .getHistory({
        page,
        pageSize: HISTORY_PAGE_SIZE,
        signal: controller.signal,
      })
      .then((res) => {
        setHistory({ data: res.data || [], total: res.total || 0 });
        setLoading(false);
      })
      .catch((err) => {
        if (isRequestCancelled(err)) {
          return;
        }
        // Drop the previous page's rows; keep the total so the pager stays
        setHistory((current) => ({ ...current, data: [] }));
        setError(err.message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [open, page, reloadKey]);

  // Mapped once per response, so the memoised rows keep their props
  const chapters = useMemo(() => history.data.map(toChapter), [history.data]);

  const setChapterStatus = (chapterId, status) =>
    setHistory((current) => ({
      ...current,
      data: current.data.map((item) =>
        item.chapter_id === chapterId ? { ...item, status } : item
      ),
    }));

  // Saving and KPI refresh are owned by the page; the modal mirrors the
  // optimistic tick and reverts it if the page reports a failed save
  const handleToggleComplete = useCallback(
    (chapter, completed) => {
      setChapterStatus(
        chapter.id,
        completed ? PROGRESS_STATUS.completed : PROGRESS_STATUS.inProgress
      );
      setPendingChapterIds((ids) => [...ids, chapter.id]);
      onToggleComplete(chapter, completed).then((saved) => {
        if (!saved) {
          setChapterStatus(chapter.id, chapter.status);
        }
        setPendingChapterIds((ids) => ids.filter((id) => id !== chapter.id));
      });
    },
    [onToggleComplete]
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      // Reopening starts from the first page
      afterClose={() => setPage(1)}
      closable={false}
      width={640}
      className="academy-history-modal"
      title={
        <>
          <h2 className="academy-history-title">Recently opened</h2>
          <p className="academy-history-subtitle">
            Pick up where you left off in the chapters you viewed most recently.
          </p>
        </>
      }
      footer={
        <div className="academy-history-actions">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={onContinue}>
            Continue learning
          </Button>
        </div>
      }
    >
      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          className="academy-history-error"
          action={
            <Button size="small" onClick={() => setReloadKey((key) => key + 1)}>
              Try again
            </Button>
          }
        />
      )}
      <Spin spinning={loading}>
        {chapters.length ? (
          <ul className="academy-chapter-list">
            {chapters.map((chapter) => (
              <ChapterRow
                key={chapter.id}
                chapter={chapter}
                pending={pendingChapterIds.includes(chapter.id)}
                onToggleComplete={handleToggleComplete}
              />
            ))}
          </ul>
        ) : (
          !loading &&
          !error && (
            <p className="academy-history-empty">
              You haven&apos;t opened any chapters yet.
            </p>
          )
        )}
      </Spin>
      <Pagination
        className="academy-history-pagination"
        size="small"
        current={page}
        pageSize={HISTORY_PAGE_SIZE}
        total={history.total}
        showSizeChanger={false}
        hideOnSinglePage
        onChange={setPage}
      />
    </Modal>
  );
};

export default ChapterHistoryModal;
