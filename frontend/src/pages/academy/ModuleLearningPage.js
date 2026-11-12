import React, { useEffect, useRef, useState } from "react";
import { Button, ConfigProvider, Result, Skeleton, message } from "antd";
import {
  DownloadOutlined,
  HomeOutlined,
  RightOutlined,
} from "@ant-design/icons";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import ChatbotFloatButton from "./components/ChatbotFloatButton";
import academyService, { isRequestCancelled } from "./services/academy";
import {
  ACADEMY_THEME,
  CHAPTER_API_STATUS,
  PROGRESS_STATUS,
  sanitizeHtml,
} from "./utils";
import { routePath } from "../../components/route";
import "./ModuleLearningPage.scss";

// Module learning page (Figma "learning module pages"), the Academy's chapter
// reader. Each chapter of the module is one step; `?chapter=<id>` opens one.
const ModuleLearningPage = () => {
  const { moduleId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  // Content of the current chapter (GET /chapters/{id})
  const [content, setContent] = useState({ chapterId: null, html: null });
  const [contentError, setContentError] = useState(null);
  const [contentReloadKey, setContentReloadKey] = useState(0);
  // Latest known status per chapter, updated by this page's own saves. The
  // progress API always writes the status it is sent, so recording a view
  // must send the current one or it would undo a completion.
  const chapterStatuses = useRef(new Map());
  // In-flight view record per chapter; completing waits on it so the two
  // writes for one chapter cannot reach the server out of order
  const viewRequests = useRef(new Map());
  // Set on unmount so a save that finishes after the learner left does not
  // navigate them back or toast on another page
  const hasLeft = useRef(false);

  const chapters = module?.chapters || [];
  // `?chapter=` keeps the step in the URL so refresh and browser back work
  const requestedIndex = chapters.findIndex(
    ({ id }) => String(id) === searchParams.get("chapter")
  );
  const stepIndex = Math.max(requestedIndex, 0);
  const chapter = chapters[stepIndex];
  const chapterId = chapter?.id;

  useEffect(() => {
    // Reset too: StrictMode remounts once in development
    hasLeft.current = false;
    return () => {
      hasLeft.current = true;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    academyService
      .getModules({ signal: controller.signal })
      .then(({ modules = [] } = {}) => {
        const found = modules.find(({ id }) => String(id) === moduleId);
        chapterStatuses.current = new Map(
          (found?.chapters || []).map(({ id, status }) => [id, status])
        );
        setModule(found || null);
        setLoading(false);
      })
      .catch((err) => {
        if (isRequestCancelled(err)) {
          return;
        }
        setError(err.message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [moduleId, reloadKey]);

  useEffect(() => {
    if (!chapterId) {
      return;
    }
    // Moving to another step aborts the previous chapter's request
    const controller = new AbortController();
    setContentError(null);
    academyService
      .getChapter(chapterId, { signal: controller.signal })
      .then(({ content_html: html }) => setContent({ chapterId, html }))
      .catch((err) => {
        if (isRequestCancelled(err)) {
          return;
        }
        setContentError(err.message);
      });
    return () => controller.abort();
  }, [chapterId, contentReloadKey]);

  // Record every chapter step the learner views (Recently opened / history)
  useEffect(() => {
    if (!chapterId) {
      return;
    }
    const completed =
      chapterStatuses.current.get(chapterId) === PROGRESS_STATUS.completed;
    const request = academyService
      .updateChapterProgress(
        chapterId,
        completed
          ? CHAPTER_API_STATUS.completed
          : CHAPTER_API_STATUS.inProgress,
        { markOpened: true }
      )
      .then(({ status }) => chapterStatuses.current.set(chapterId, status))
      // Best effort: a missed view must not block learning; server and
      // network errors are already toasted by academyClient
      .catch(() => {});
    viewRequests.current.set(chapterId, request);
  }, [chapterId]);

  const backToOverview = () => navigate(routePath.academy.overview);

  const renderFrame = (content, footer = null) => (
    <ConfigProvider theme={ACADEMY_THEME}>
      <div className="academy-learning" data-testid="academy-module-learning">
        {content}
        {footer}
        <ChatbotFloatButton />
      </div>
    </ConfigProvider>
  );

  if (loading) {
    return renderFrame(
      <div className="academy-learning-stage">
        <div
          className="academy-learning-card"
          data-testid="academy-module-learning-loading"
        >
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      </div>
    );
  }

  if (error || !module) {
    return renderFrame(
      <div className="academy-learning-stage">
        <div className="academy-learning-card">
          <Result
            status={error ? "error" : "404"}
            title={error ? "We couldn't load this module" : "Module not found"}
            subTitle={error}
            extra={[
              error && (
                <Button
                  key="retry"
                  type="primary"
                  onClick={() => setReloadKey((key) => key + 1)}
                >
                  Try again
                </Button>
              ),
              <Button key="back" onClick={backToOverview}>
                Back to the overview
              </Button>,
            ]}
          />
        </div>
      </div>
    );
  }

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex >= chapters.length - 1;
  const moduleLabel = `Module ${module.order_index} · ${module.title}`;

  const goToStep = (index) => setSearchParams({ chapter: chapters[index].id });
  const advance = () =>
    isLastStep ? backToOverview() : goToStep(stepIndex + 1);

  // "Next step" completes the chapter; "Skip" moves on without completing.
  // Navigation waits for the save so the overview never loads stale KPIs,
  // and the footer is locked meanwhile so clicks cannot double-submit.
  const handleNextStep = () => {
    setSaving(true);
    Promise.resolve(viewRequests.current.get(chapter.id))
      .then(() =>
        academyService.updateChapterProgress(
          chapter.id,
          CHAPTER_API_STATUS.completed
        )
      )
      .then(() => {
        chapterStatuses.current.set(chapter.id, PROGRESS_STATUS.completed);
        setSaving(false);
        if (!hasLeft.current) {
          advance();
        }
      })
      .catch((err) => {
        setSaving(false);
        // Server and network errors are already toasted by academyClient
        if (!hasLeft.current && err?.status && err.status < 500) {
          message.error(err.message);
        }
      });
  };

  const renderContent = () => {
    if (contentError) {
      return (
        <div className="academy-learning-content-error">
          <p>{contentError}</p>
          <Button onClick={() => setContentReloadKey((key) => key + 1)}>
            Try again
          </Button>
        </div>
      );
    }
    if (content.chapterId !== chapter.id) {
      return (
        <div data-testid="academy-chapter-content-loading">
          <Skeleton active paragraph={{ rows: 6 }} title={false} />
        </div>
      );
    }
    if (!content.html) {
      return (
        <p className="academy-learning-placeholder">
          The content for this chapter is being prepared and will appear here
          soon.
        </p>
      );
    }
    return (
      <div
        className="academy-learning-content"
        // Sanitised: chapter content is authored HTML from the API
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.html) }}
      />
    );
  };

  const breadcrumb = [
    {
      key: "home",
      node: (
        <Link to={routePath.academy.overview} aria-label="My overview">
          <HomeOutlined />
        </Link>
      ),
    },
    {
      key: "courses",
      node: <Link to={routePath.academy.courses}>Course overview</Link>,
    },
    { key: "module", node: <span>{moduleLabel}</span> },
    chapter && {
      key: "chapter",
      node: (
        <span className="academy-learning-crumb-current" aria-current="page">
          {chapter.title}
        </span>
      ),
    },
  ].filter(Boolean);

  const topbar = (
    <div className="academy-learning-topbar">
      <nav aria-label="Breadcrumb">
        <ol className="academy-learning-breadcrumb">
          {breadcrumb.map(({ key, node }, index) => (
            <li key={key}>
              {index > 0 && (
                <RightOutlined
                  className="academy-learning-crumb-separator"
                  aria-hidden="true"
                />
              )}
              {node}
            </li>
          ))}
        </ol>
      </nav>
      {/* Chapter downloads arrive with the content */}
      <Button
        className="academy-learning-download"
        icon={<DownloadOutlined />}
        aria-label="Download chapter"
        disabled
      />
    </div>
  );

  if (!chapter) {
    return renderFrame(
      <>
        {topbar}
        <div className="academy-learning-stage">
          <div className="academy-learning-card">
            <Result
              status="info"
              title="This module has no chapters yet"
              extra={
                <Button type="primary" onClick={backToOverview}>
                  Back to the overview
                </Button>
              }
            />
          </div>
        </div>
      </>
    );
  }

  return renderFrame(
    <>
      {topbar}
      <div className="academy-learning-stage">
        <article
          className="academy-learning-card"
          aria-labelledby="academy-learning-title"
        >
          <span className="academy-learning-eyebrow">
            Chapter {chapter.chapter_number}
          </span>
          <h1 id="academy-learning-title" className="academy-learning-title">
            {chapter.title}
          </h1>
          {renderContent()}
        </article>
      </div>
    </>,
    <footer className="academy-learning-footer">
      <div className="academy-learning-footer-start">
        <Button
          className="academy-learning-outline"
          disabled={saving}
          onClick={() =>
            isFirstStep ? backToOverview() : goToStep(stepIndex - 1)
          }
        >
          {isFirstStep ? "Back to the overview" : "Previous"}
        </Button>
      </div>
      <ol className="academy-learning-steps" aria-label="Chapters">
        {chapters.map(({ id, title }, index) => (
          <li key={id}>
            <button
              type="button"
              disabled={saving}
              className={`academy-learning-step${
                index <= stepIndex ? " academy-learning-step--reached" : ""
              }`}
              aria-label={`Chapter ${index + 1} of ${
                chapters.length
              }: ${title}`}
              aria-current={index === stepIndex ? "step" : null}
              onClick={() => goToStep(index)}
            />
          </li>
        ))}
      </ol>
      <div className="academy-learning-footer-end">
        {!isLastStep && (
          <Button
            type="text"
            className="academy-learning-skip"
            disabled={saving}
            onClick={advance}
          >
            Skip
          </Button>
        )}
        <Button type="primary" loading={saving} onClick={handleNextStep}>
          {isLastStep ? "Finish module" : "Next step"}
        </Button>
      </div>
    </footer>
  );
};

export default ModuleLearningPage;
