import React, { useEffect, useState } from "react";
import { Button, Modal, Result, Skeleton } from "antd";
import {
  CheckCircleFilled,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import academyService, { isRequestCancelled } from "../services/academy";
import { CHAPTER_API_STATUS, PROGRESS_STATUS, sanitizeHtml } from "../utils";

// Chapter reader opened from `?chapter=<id>`. Loading a chapter records the
// view (GET /chapters/{id} itself does not), which feeds "Recently opened".
const ChapterReaderModal = ({
  chapterId,
  onClose,
  onNavigate,
  onToggleComplete,
  onViewed,
}) => {
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Completing waits for the view record, so the two writes for one chapter
  // cannot reach the server out of order
  const [viewRecorded, setViewRecorded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!chapterId) {
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setChapter(null);
    setViewRecorded(false);
    academyService
      .getChapter(chapterId, { signal: controller.signal })
      .then((detail) => {
        setChapter(detail);
        setLoading(false);
        // The API always writes the status it is sent, so resend the current
        // one: marking the view alone would reset a completed chapter
        return (
          academyService
            .updateChapterProgress(
              detail.id,
              detail.status === PROGRESS_STATUS.completed
                ? CHAPTER_API_STATUS.completed
                : CHAPTER_API_STATUS.inProgress,
              { markOpened: true }
            )
            .then((progress) => {
              // Recorded server-side either way, so the page always applies it
              onViewed(progress);
              if (!controller.signal.aborted) {
                setChapter((current) => ({
                  ...current,
                  status: progress.status,
                }));
              }
            })
            // Best effort: a missed view must not block reading; server and
            // network errors are already toasted by academyClient
            .catch(() => {})
            .finally(() => {
              if (!controller.signal.aborted) {
                setViewRecorded(true);
              }
            })
        );
      })
      .catch((err) => {
        if (isRequestCancelled(err)) {
          return;
        }
        setError(err);
        setLoading(false);
      });
    return () => controller.abort();
  }, [chapterId, reloadKey, onViewed]);

  const isCompleted = chapter?.status === PROGRESS_STATUS.completed;

  // The page saves (and updates its rows); the reader mirrors the result.
  // Guarded by id in case the learner moved to another chapter meanwhile.
  const handleToggleComplete = () => {
    const savedId = chapter.id;
    const completed = !isCompleted;
    setSaving(true);
    onToggleComplete(chapter, completed).then((saved) => {
      setSaving(false);
      if (saved) {
        setChapter((current) =>
          current?.id === savedId
            ? {
                ...current,
                status: completed
                  ? PROGRESS_STATUS.completed
                  : PROGRESS_STATUS.inProgress,
              }
            : current
        );
      }
    });
  };

  const renderBody = () => {
    if (loading) {
      return (
        <div data-testid="academy-reader-loading">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      );
    }
    if (error) {
      const notFound = error.status === 404;
      return (
        <Result
          status={notFound ? "404" : "error"}
          title={
            notFound ? "Chapter not found" : "We couldn't load this chapter"
          }
          subTitle={notFound ? null : error.message}
          extra={
            notFound ? (
              <Button onClick={onClose}>Close</Button>
            ) : (
              <Button
                type="primary"
                onClick={() => setReloadKey((key) => key + 1)}
              >
                Try again
              </Button>
            )
          }
        />
      );
    }
    if (!chapter) {
      return null;
    }
    return (
      <article aria-labelledby="academy-reader-title">
        <p className="academy-reader-eyebrow">
          {[
            chapter.module_title,
            `Chapter ${chapter.chapter_number}`,
            `${chapter.estimated_minutes} min read`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <h2 id="academy-reader-title" className="academy-reader-title">
          {chapter.title}
        </h2>
        {chapter.content_html ? (
          <div
            className="academy-reader-content"
            // Sanitised: chapter content is authored HTML from the API
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(chapter.content_html),
            }}
          />
        ) : (
          <p className="academy-reader-placeholder">
            The content for this chapter is being prepared and will appear here
            soon.
          </p>
        )}
      </article>
    );
  };

  return (
    <Modal
      open={Boolean(chapterId)}
      onCancel={onClose}
      width={800}
      className="academy-reader-modal"
      footer={
        chapter && (
          <div className="academy-reader-actions">
            <Button
              icon={<LeftOutlined />}
              disabled={!chapter.prev_chapter_id}
              onClick={() => onNavigate(chapter.prev_chapter_id)}
            >
              Previous chapter
            </Button>
            <Button
              className={isCompleted ? "academy-reader-complete--done" : ""}
              type={isCompleted ? "default" : "primary"}
              icon={isCompleted ? <CheckCircleFilled /> : null}
              loading={saving}
              disabled={!viewRecorded}
              aria-pressed={isCompleted}
              onClick={handleToggleComplete}
            >
              {isCompleted ? "Completed" : "Mark as completed"}
            </Button>
            <Button
              disabled={!chapter.next_chapter_id}
              onClick={() => onNavigate(chapter.next_chapter_id)}
            >
              Next chapter <RightOutlined />
            </Button>
          </div>
        )
      }
    >
      {renderBody()}
    </Modal>
  );
};

export default ChapterReaderModal;
