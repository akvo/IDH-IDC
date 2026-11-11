import React, { useEffect, useState } from "react";
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
import { ACADEMY_THEME, CHAPTER_API_STATUS } from "./utils";
import { routePath } from "../../components/route";
import "./ModuleLearningPage.scss";

// Skeleton of the module learning page (Figma "learning module pages").
// Each chapter of the module is one step. Chapter content is still being
// written by the data team, so the card shows a placeholder for now.
const ModuleLearningPage = () => {
  const { moduleId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    academyService
      .getModules({ signal: controller.signal })
      .then(({ modules = [] } = {}) => {
        setModule(modules.find(({ id }) => String(id) === moduleId) || null);
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

  const chapters = module.chapters || [];
  // `?chapter=` keeps the step in the URL so refresh and browser back work
  const requestedIndex = chapters.findIndex(
    ({ id }) => String(id) === searchParams.get("chapter")
  );
  const stepIndex = Math.max(requestedIndex, 0);
  const chapter = chapters[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex >= chapters.length - 1;
  const moduleLabel = `Module ${module.order_index} · ${module.title}`;

  const goToStep = (index) => setSearchParams({ chapter: chapters[index].id });
  const advance = () =>
    isLastStep ? backToOverview() : goToStep(stepIndex + 1);

  // "Next step" completes the chapter; "Skip" moves on without saving.
  // The save is not awaited so navigation never waits on the network.
  const handleNextStep = () => {
    academyService
      .updateChapterProgress(chapter.id, CHAPTER_API_STATUS.completed)
      .catch((err) => {
        // Server and network errors are already toasted by academyClient
        if (err?.status && err.status < 500) {
          message.error(err.message);
        }
      });
    advance();
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
          <p className="academy-learning-placeholder">
            The content for this chapter is being prepared and will appear here
            soon.
          </p>
        </article>
      </div>
    </>,
    <footer className="academy-learning-footer">
      <div className="academy-learning-footer-start">
        <Button
          className="academy-learning-outline"
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
            onClick={advance}
          >
            Skip
          </Button>
        )}
        <Button type="primary" onClick={handleNextStep}>
          {isLastStep ? "Finish module" : "Next step"}
        </Button>
      </div>
    </footer>
  );
};

export default ModuleLearningPage;
