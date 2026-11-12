import React, { useCallback, useEffect, useState } from "react";
import { Button, Empty, Input, Result, Skeleton, message } from "antd";
import { FileSearchOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import TagFilterChips from "./components/TagFilterChips";
import CourseSummaryCard from "./components/CourseSummaryCard";
import ModuleAccordion from "./components/ModuleAccordion";
import academyService, { isRequestCancelled } from "./services/academy";
import { CHAPTER_API_STATUS, PROGRESS_STATUS, getModulePath } from "./utils";
import "./CourseOverviewPage.scss";

// "Try searching for" on the no-results state (Figma)
const SEARCH_SUGGESTIONS = [
  "Living income benchmark",
  "Income gap",
  "Pricing",
  "Procurement",
];
const POPULAR_TOPIC_COUNT = 5;

const pluralise = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

const mapChapters = (modules, update) =>
  modules.map((module) => ({
    ...module,
    chapters: (module.chapters || []).map(update),
  }));

// Full course: open where the learner is. Results: open every module.
const getInitialExpandedIds = (modules, isFiltered) => {
  if (isFiltered) {
    return modules.map(({ id }) => id);
  }
  const current =
    modules.find(({ status }) => status !== PROGRESS_STATUS.completed) ||
    modules[0];
  return current ? [current.id] : [];
};

const CourseOverviewPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // The URL is the source of truth for the filters, so filtered views can be
  // shared, refreshed and navigated back
  const search = (searchParams.get("search") || "").trim();
  const tag = searchParams.get("tag") || "";
  const chapterId = searchParams.get("chapter");
  const isFiltered = Boolean(search || tag);

  const [searchInput, setSearchInput] = useState(search);
  const [tags, setTags] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [expandedIds, setExpandedIds] = useState([]);
  const [pendingChapterIds, setPendingChapterIds] = useState([]);
  const [continuing, setContinuing] = useState(false);

  // Keep the box in step with the URL (browser back/forward, chip clicks)
  useEffect(() => setSearchInput(search), [search]);

  useEffect(() => {
    const controller = new AbortController();
    academyService
      .getTags({ signal: controller.signal })
      .then((data) => setTags(data || []))
      // Without tags the page still works; the chip rows are just hidden
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    // A newer filter aborts the older request so results never arrive out
    // of order
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    academyService
      .getModules({ search, tag, signal: controller.signal })
      .then((data) => {
        const modules = data.modules || [];
        setCourse({ ...data, modules });
        setExpandedIds(getInitialExpandedIds(modules, Boolean(search || tag)));
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
  }, [search, tag, reloadKey]);

  // `?chapter=<id>` (Continue learning, older links) opens the chapter on its
  // module learning page; the chapter's module comes from its details
  useEffect(() => {
    if (!chapterId) {
      return;
    }
    const controller = new AbortController();
    academyService
      .getChapter(chapterId, { signal: controller.signal })
      .then(({ id, module_id: moduleId }) =>
        navigate(getModulePath(moduleId, id), { replace: true })
      )
      .catch((err) => {
        if (isRequestCancelled(err)) {
          return;
        }
        if (err?.status && err.status < 500) {
          message.error(err.message);
        }
        setSearchParams(
          (current) => {
            const next = new URLSearchParams(current);
            next.delete("chapter");
            return next;
          },
          { replace: true }
        );
      });
    return () => controller.abort();
  }, [chapterId, navigate, setSearchParams]);

  const updateParams = useCallback(
    (changes) =>
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        Object.entries(changes).forEach(([key, value]) =>
          value ? next.set(key, value) : next.delete(key)
        );
        return next;
      }),
    [setSearchParams]
  );

  // `course` can still be loading when the reader is opened from a link
  const setChapterStatus = (id, status) =>
    setCourse(
      (current) =>
        current && {
          ...current,
          modules: mapChapters(current.modules, (chapter) =>
            chapter.id === id ? { ...chapter, status } : chapter
          ),
        }
    );

  // Applies a POST /chapters/{id}/progress response: the chapter's status and
  // its module's recomputed progress
  const applyProgress = useCallback(
    (progress) =>
      setCourse(
        (current) =>
          current && {
            ...current,
            modules: current.modules.map((module) =>
              module.id === progress.module_id
                ? {
                    ...module,
                    progress_pct: progress.module_progress_pct,
                    status: progress.module_status,
                    chapters: (module.chapters || []).map((chapter) =>
                      chapter.id === progress.chapter_id
                        ? { ...chapter, status: progress.status }
                        : chapter
                    ),
                  }
                : module
            ),
          }
      ),
    []
  );

  // Optimistic completion toggle on a chapter row
  const handleToggleComplete = (chapter, completed) => {
    const previousStatus = chapter.status;
    setChapterStatus(
      chapter.id,
      completed ? PROGRESS_STATUS.completed : PROGRESS_STATUS.inProgress
    );
    setPendingChapterIds((ids) => [...ids, chapter.id]);
    const settle = () =>
      setPendingChapterIds((ids) => ids.filter((id) => id !== chapter.id));

    return academyService
      .updateChapterProgress(
        chapter.id,
        completed ? CHAPTER_API_STATUS.completed : CHAPTER_API_STATUS.inProgress
      )
      .then((progress) => {
        settle();
        applyProgress(progress);
      })
      .catch((err) => {
        settle();
        setChapterStatus(chapter.id, previousStatus);
        // Server and network errors are already toasted by academyClient
        if (err?.status && err.status < 500) {
          message.error(err.message);
        }
      });
  };

  // Resume where the overview would: the backend picks the chapter from the
  // learner's reading history, which this page does not load
  const handleContinue = () => {
    setContinuing(true);
    academyService
      .getOverview()
      .then(({ continue_chapter_id: continueId }) => {
        setContinuing(false);
        if (continueId) {
          updateParams({ chapter: continueId });
        }
      })
      .catch((err) => {
        setContinuing(false);
        if (err?.status && err.status < 500) {
          message.error(err.message);
        }
      });
  };

  const handleSearch = (event) => {
    event.preventDefault();
    updateParams({ search: searchInput.trim() });
  };

  const toggleModule = (id) =>
    setExpandedIds((ids) =>
      ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]
    );

  const tagChips = tags.map(({ slug, name }) => ({
    value: slug,
    label: `#${name}`,
  }));
  const activeTag = tags.find(({ slug }) => slug === tag);
  const modules = course?.modules || [];
  const chapterCount = modules.reduce(
    (total, module) => total + (module.chapters || []).length,
    0
  );
  const queryLabel = search || (activeTag ? `#${activeTag.name}` : `#${tag}`);

  const renderResultsHeading = () => (
    <div className="academy-results-heading">
      <h2 className="academy-results-title">
        {modules.length
          ? `Showing ${pluralise(
              modules.length + chapterCount,
              "result"
            )} for ‘${queryLabel}’`
          : `No results for ‘${queryLabel}’`}
      </h2>
      <p className="academy-results-subtitle">
        {modules.length
          ? `${pluralise(modules.length, "module")} · ${pluralise(
              chapterCount,
              "chapter"
            )}`
          : "Check the spelling, try fewer or broader words, or start from one of the suggestions below."}
      </p>
    </div>
  );

  const renderNoResults = () => {
    const popularTopics = [...tags]
      .sort((a, b) => b.chapter_count - a.chapter_count)
      .slice(0, POPULAR_TOPIC_COUNT)
      .map(({ slug, name }) => ({ value: slug, label: `#${name}` }));
    return (
      <div className="academy-no-results" data-testid="academy-no-results">
        <div className="academy-no-results-header">
          <span className="academy-no-results-icon" aria-hidden="true">
            <FileSearchOutlined />
          </span>
          <div>
            <p className="academy-no-results-title">
              No results for ‘{queryLabel}’
            </p>
            <p className="academy-no-results-text">
              Check the spelling, try fewer or broader words, or start from one
              of the suggestions below.
            </p>
          </div>
        </div>
        <TagFilterChips
          label="Try searching for"
          items={SEARCH_SUGGESTIONS.map((term) => ({
            value: term,
            label: term,
          }))}
          onSelect={(term) => updateParams({ search: term, tag: null })}
        />
        {popularTopics.length > 0 && (
          <TagFilterChips
            label="Popular topics"
            items={popularTopics}
            onSelect={(slug) => updateParams({ tag: slug, search: null })}
          />
        )}
      </div>
    );
  };

  const renderCourse = () => {
    if (loading) {
      return (
        <div data-testid="academy-courses-loading">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      );
    }
    if (error) {
      return (
        <Result
          status="error"
          title="We couldn't load the course"
          subTitle={error}
          extra={
            <Button
              type="primary"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Try again
            </Button>
          }
        />
      );
    }
    if (isFiltered && !modules.length) {
      return (
        <>
          {renderResultsHeading()}
          {renderNoResults()}
        </>
      );
    }
    return (
      <>
        {isFiltered ? (
          renderResultsHeading()
        ) : (
          <CourseSummaryCard
            totalModules={course.total_modules}
            summaryHtml={course.course_summary_html}
          />
        )}
        {modules.length ? (
          <div className="academy-accordion-list">
            {modules.map((module) => (
              <ModuleAccordion
                key={module.id}
                module={module}
                expanded={expandedIds.includes(module.id)}
                onToggle={toggleModule}
                highlight={search}
                showTags={isFiltered}
                onTagSelect={(slug) =>
                  updateParams({ tag: slug, search: null })
                }
                pendingChapterIds={pendingChapterIds}
                onToggleComplete={handleToggleComplete}
              />
            ))}
          </div>
        ) : (
          <Empty description="The course has no modules yet." />
        )}
      </>
    );
  };

  return (
    <div className="academy-courses" data-testid="academy-courses">
      {/* Not a <header>: App.scss styles every `#root header` as the site header */}
      <div className="academy-courses-header">
        <div>
          <h1 className="academy-courses-title">Course Overview</h1>
          <p className="academy-courses-subtitle">
            Explore modules and chapters of living income academy course
          </p>
        </div>
        <Button type="primary" loading={continuing} onClick={handleContinue}>
          Continue learning
        </Button>
      </div>

      <div className="academy-courses-panel">
        <form
          className="academy-course-search"
          role="search"
          onSubmit={handleSearch}
        >
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search modules, chapters and tags..."
            aria-label="Search modules, chapters and tags"
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              // Clearing the box (or its clear icon) shows the full course
              if (!event.target.value && search) {
                updateParams({ search: null });
              }
            }}
          />
          <Button htmlType="submit">Search</Button>
        </form>
        {tagChips.length > 0 && (
          <TagFilterChips
            label="Browse by tag"
            selectable
            activeValue={tag || null}
            items={[{ value: null, label: "All" }, ...tagChips]}
            onSelect={(slug) => updateParams({ tag: slug })}
          />
        )}
        {renderCourse()}
      </div>
    </div>
  );
};

export default CourseOverviewPage;
