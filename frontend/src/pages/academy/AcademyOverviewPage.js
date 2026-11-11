import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button, Result, Skeleton, message } from "antd";
import { useNavigate } from "react-router-dom";
import ProgressMetricCard from "./components/ProgressMetricCard";
import RoadmapModuleCard from "./components/RoadmapModuleCard";
import RecentlyOpenedChapterCard from "./components/RecentlyOpenedChapterCard";
import ChapterHistoryModal from "./components/ChapterHistoryModal";
import RoadmapCtaBanner from "./components/RoadmapCtaBanner";
import academyService from "./services/academy";
import {
  PROGRESS_STATUS,
  getChapterPath,
  getFirstName,
  getGreeting,
  getModulePath,
} from "./utils";
import { routePath } from "../../components/route";
import "./AcademyOverviewPage.scss";

// `id` of the roadmap section on the public Academy landing page
const LANDING_ROADMAP_ID = "academy-roadmap";

const API_STATUS = {
  completed: "completed",
  inProgress: "in_progress",
};

const setChapterStatus = (overview, chapterId, status) => ({
  ...overview,
  recently_opened: overview.recently_opened.map((chapter) =>
    chapter.id === chapterId ? { ...chapter, status } : chapter
  ),
});

const AcademyOverviewPage = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingChapterIds, setPendingChapterIds] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // `silent` refreshes the KPIs in place without swapping in the skeleton
  const loadOverview = useCallback(({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    return academyService
      .getOverview()
      .then((data) => {
        if (isMounted.current) {
          setOverview(data);
        }
      })
      .catch((err) => {
        if (isMounted.current && !silent) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (isMounted.current && !silent) {
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleToggleComplete = useCallback(
    (chapter, completed) => {
      const previousStatus = chapter.status;
      // An opened chapter that is unticked goes back to "in progress"
      const nextStatus = completed
        ? PROGRESS_STATUS.completed
        : PROGRESS_STATUS.inProgress;

      setOverview((current) =>
        setChapterStatus(current, chapter.id, nextStatus)
      );
      setPendingChapterIds((ids) => [...ids, chapter.id]);

      academyService
        .updateChapterProgress(
          chapter.id,
          completed ? API_STATUS.completed : API_STATUS.inProgress
        )
        // Pick up the recomputed KPIs and module progress
        .then(() => loadOverview({ silent: true }))
        .catch((err) => {
          if (!isMounted.current) {
            return;
          }
          setOverview((current) =>
            setChapterStatus(current, chapter.id, previousStatus)
          );
          // Server and network errors are already toasted by academyClient
          if (err?.status && err.status < 500) {
            message.error(err.message);
          }
        })
        .finally(() => {
          if (isMounted.current) {
            setPendingChapterIds((ids) =>
              ids.filter((id) => id !== chapter.id)
            );
          }
        });
    },
    [loadOverview]
  );

  if (loading) {
    return (
      <div className="academy-overview" data-testid="academy-overview-loading">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="academy-overview">
        <Result
          status="error"
          title="We couldn't load your overview"
          subTitle={error}
          extra={
            <Button type="primary" onClick={() => loadOverview()}>
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  const {
    greeting_name: greetingName,
    continue_chapter_id: continueChapterId,
    metrics,
    modules = [],
    recently_opened: recentlyOpened = [],
  } = overview;
  const firstName = getFirstName(greetingName);

  return (
    <div className="academy-overview" data-testid="academy-overview">
      {/* Not a <header>: App.scss styles every `#root header` as the site header */}
      <div className="academy-overview-header">
        <h1 className="academy-overview-greeting">
          {firstName ? `${getGreeting()}, ${firstName}` : getGreeting()}
        </h1>
        <Button
          type="primary"
          onClick={() =>
            navigate(
              continueChapterId
                ? getChapterPath(continueChapterId)
                : routePath.academy.courses
            )
          }
        >
          Continue learning
        </Button>
      </div>

      <section className="academy-metrics" aria-label="Your progress">
        <ProgressMetricCard
          label="Academy progress"
          value={`${metrics.academy_progress_pct}%`}
          percent={metrics.academy_progress_pct}
        />
        <ProgressMetricCard
          label="Modules completed"
          value={`${metrics.modules_completed}/${metrics.total_modules}`}
          percent={metrics.modules_completed_pct}
        />
        <ProgressMetricCard
          label="Chapters completed"
          value={`${metrics.chapters_completed} of ${metrics.total_chapters}`}
          percent={metrics.chapters_completed_pct}
        />
      </section>

      <section
        className="academy-overview-section"
        aria-labelledby="roadmap-progress-title"
      >
        <div className="academy-section-header">
          <div>
            <h2 id="roadmap-progress-title" className="academy-section-title">
              Your roadmap progress
            </h2>
            <p className="academy-section-subtitle">
              The six process modules of the IDH Living Income Roadmap.
            </p>
          </div>
          <Button onClick={() => navigate(routePath.academy.courses)}>
            Full course overview
          </Button>
        </div>
        <div className="academy-module-grid">
          {modules.map((module) => (
            <RoadmapModuleCard
              key={module.id}
              module={module}
              onOpen={({ id }) => navigate(getModulePath(id))}
            />
          ))}
        </div>
      </section>

      <section
        className="academy-overview-section"
        aria-labelledby="recently-opened-title"
      >
        <div className="academy-section-header">
          <div>
            <h2 id="recently-opened-title" className="academy-section-title">
              Recently opened
            </h2>
            <p className="academy-section-subtitle">
              Pick up where you left off in the chapters you viewed most
              recently.
            </p>
          </div>
          <Button onClick={() => setHistoryOpen(true)}>View history</Button>
        </div>
        {recentlyOpened.length ? (
          <ul className="academy-chapter-list">
            {recentlyOpened.map((chapter) => (
              <RecentlyOpenedChapterCard
                key={chapter.id}
                chapter={chapter}
                pending={pendingChapterIds.includes(chapter.id)}
                onToggleComplete={handleToggleComplete}
              />
            ))}
          </ul>
        ) : (
          <p className="academy-empty-text">
            You haven&apos;t opened any chapters yet. Use Continue learning to
            start your first chapter.
          </p>
        )}
      </section>

      {/* App's ScrollToHash scrolls the landing page to its roadmap section */}
      <RoadmapCtaBanner
        onLearnMore={() =>
          navigate(`${routePath.academy.landing}#${LANDING_ROADMAP_ID}`)
        }
      />

      <ChapterHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
};

export default AcademyOverviewPage;
