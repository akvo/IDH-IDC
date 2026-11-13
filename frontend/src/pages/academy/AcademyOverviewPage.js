import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button, Result, Skeleton, message } from "antd";
import { useNavigate } from "react-router-dom";
import ProgressMetricCard from "./components/ProgressMetricCard";
import RoadmapModuleCard from "./components/RoadmapModuleCard";
import ChapterRow from "./components/ChapterRow";
import ChapterHistoryModal from "./components/ChapterHistoryModal";
import RoadmapCtaBanner from "./components/RoadmapCtaBanner";
import academyService, { isRequestCancelled } from "./services/academy";
import {
  CHAPTER_API_STATUS,
  PROGRESS_STATUS,
  getChapterPath,
  getFirstName,
  getGreeting,
  getModulePath,
} from "./utils";
import { routePath } from "../../components/route";
import { IncompleteProfileAlert } from "../../components/profile";
import "./AcademyOverviewPage.scss";

// `id` of the roadmap section on the public Academy landing page
const LANDING_ROADMAP_ID = "academy-roadmap";

const withChapterStatuses = (overview, statuses) => {
  if (!overview?.recently_opened) {
    return overview;
  }
  return {
    ...overview,
    recently_opened: overview.recently_opened.map((chapter) =>
      statuses.has(chapter.id)
        ? { ...chapter, status: statuses.get(chapter.id) }
        : chapter
    ),
  };
};

// Applies the KPIs recomputed by POST /chapters/{id}/progress, so the cards
// are correct even if the follow-up overview refresh fails
const withProgressTotals = (overview, progress) => {
  if (!overview?.metrics || !progress) {
    return overview;
  }
  const { metrics, modules = [] } = overview;
  return {
    ...overview,
    metrics: {
      ...metrics,
      academy_progress_pct: progress.course_progress_pct,
      chapters_completed: progress.chapters_completed,
      chapters_completed_pct: progress.course_progress_pct,
      modules_completed: progress.modules_completed,
      // Not in the response; the refresh replaces it with the server value
      modules_completed_pct: metrics.total_modules
        ? Math.round((progress.modules_completed / metrics.total_modules) * 100)
        : 0,
    },
    modules: modules.map((module) =>
      module.id === progress.module_id
        ? {
            ...module,
            progress_pct: progress.module_progress_pct,
            status: progress.module_status,
          }
        : module
    ),
  };
};

const AcademyOverviewPage = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingChapterIds, setPendingChapterIds] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  // In-flight overview request; a newer load aborts it so an older response
  // can never overwrite a newer one
  const overviewRequest = useRef(null);
  // Optimistic statuses of chapters whose save has not finished yet, kept so
  // a refresh triggered by another chapter does not flip them back
  const optimisticStatuses = useRef(new Map());

  // `silent` refreshes the KPIs in place without swapping in the skeleton
  const loadOverview = useCallback(({ silent = false } = {}) => {
    overviewRequest.current?.abort();
    const controller = new AbortController();
    overviewRequest.current = controller;

    if (!silent) {
      setLoading(true);
      setError(null);
    }
    return academyService
      .getOverview({ signal: controller.signal })
      .then((data) => {
        setOverview(withChapterStatuses(data, optimisticStatuses.current));
        if (!silent) {
          setLoading(false);
        }
      })
      .catch((err) => {
        // Superseded or unmounted; the newer request owns the state
        if (isRequestCancelled(err)) {
          return;
        }
        // A failed background refresh keeps the current numbers
        if (!silent) {
          setError(err.message);
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    loadOverview();
    return () => overviewRequest.current?.abort();
  }, [loadOverview]);

  const handleToggleComplete = useCallback(
    (chapter, completed) => {
      const previousStatus = chapter.status;
      // An opened chapter that is unticked goes back to "in progress"
      const nextStatus = completed
        ? PROGRESS_STATUS.completed
        : PROGRESS_STATUS.inProgress;
      const settle = () => {
        optimisticStatuses.current.delete(chapter.id);
        setPendingChapterIds((ids) => ids.filter((id) => id !== chapter.id));
      };

      optimisticStatuses.current.set(chapter.id, nextStatus);
      setOverview((current) =>
        withChapterStatuses(current, new Map([[chapter.id, nextStatus]]))
      );
      setPendingChapterIds((ids) => [...ids, chapter.id]);

      // The save itself is not cancelled on unmount: progress should persist.
      // Resolves to whether it was saved, so the history modal can revert too.
      return academyService
        .updateChapterProgress(
          chapter.id,
          completed
            ? CHAPTER_API_STATUS.completed
            : CHAPTER_API_STATUS.inProgress
        )
        .then((progress) => {
          settle();
          setOverview((current) => withProgressTotals(current, progress));
          // Picks up the new "Recently opened" order; a failure keeps the
          // KPIs applied above
          loadOverview({ silent: true });
          return true;
        })
        .catch((err) => {
          settle();
          setOverview((current) =>
            withChapterStatuses(
              current,
              new Map([[chapter.id, previousStatus]])
            )
          );
          // Server and network errors are already toasted by academyClient
          if (err?.status && err.status < 500) {
            message.error(err.message);
          }
          return false;
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
  const handleContinue = () =>
    navigate(
      continueChapterId
        ? getChapterPath(continueChapterId)
        : routePath.academy.courses
    );

  return (
    <div className="academy-overview" data-testid="academy-overview">
      <IncompleteProfileAlert />
      {/* Not a <header>: App.scss styles every `#root header` as the site header */}
      <div className="academy-overview-header">
        <h1 className="academy-overview-greeting">
          {firstName ? `${getGreeting()}, ${firstName}` : getGreeting()}
        </h1>
        <Button type="primary" onClick={handleContinue}>
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
              <ChapterRow
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
        onToggleComplete={handleToggleComplete}
        onContinue={handleContinue}
      />
    </div>
  );
};

export default AcademyOverviewPage;
