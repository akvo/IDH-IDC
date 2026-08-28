import React, { useState, useEffect, useRef } from "react";
import {
  Layout,
  Menu,
  Typography,
  Button,
  Progress,
  Modal,
  Spin,
  Divider,
  Alert,
  Tooltip,
} from "antd";
import {
  BookOutlined,
  QuestionCircleOutlined,
  LeftOutlined,
  RightOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Quiz from "react-quiz-component";
import { routePath } from "../../components/route";
import AcademyService from "./AcademyService";
import QuizTimer from "./components/QuizTimer";
import QuizResult from "./components/QuizResult";
import "./CoursePlayer.scss";

const { Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;

const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const syncOccurredRef = useRef(false);

  useEffect(() => {
    const initData = async () => {
      try {
        const [courseData, progressData] = await Promise.all([
          AcademyService.getCourse(courseId),
          AcademyService.getProgress(),
        ]);

        const userProgress = progressData[courseId] || null;
        setCourse(courseData);
        setProgress(userProgress);

        // Course Resumption Logic: Navigate to the last active chapter
        if (userProgress && userProgress.current_chapter_id) {
          const resumeIndex = courseData.chapters.findIndex(
            (ch) => ch.id === userProgress.current_chapter_id
          );
          if (resumeIndex !== -1) {
            setCurrentChapterIndex(resumeIndex);
            if (typeof userProgress.current_section_index !== "undefined") {
              setCurrentSectionIndex(userProgress.current_section_index);
            }
            // Pre-emptively mark sync as occurred for the resumed chapter
            syncOccurredRef.current = true;
          }
        }
      } catch (error) {
        console.error("Error fetching course data:", error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [courseId]);

  // Sync progress as soon as course/chapter is loaded (mark as In Progress)
  useEffect(() => {
    if (
      course &&
      course.chapters &&
      course.chapters[currentChapterIndex] &&
      !syncOccurredRef.current
    ) {
      const initialSync = async () => {
        try {
          const payload = {
            course_id: courseId,
            current_chapter_id: course.chapters[currentChapterIndex].id,
            current_section_index: currentSectionIndex,
            completed_chapters: progress?.completed_chapters || [],
            quiz_scores: progress?.quiz_scores || {},
            is_completed: progress?.is_completed || false,
          };
          const res = await AcademyService.syncProgress(payload);
          setProgress(res.progress);
          syncOccurredRef.current = true;
        } catch (err) {
          console.error("Initial progress sync failed:", err);
        }
      };
      initialSync();
    }
  }, [
    course,
    currentChapterIndex,
    currentSectionIndex,
    courseId,
    progress?.completed_chapters,
    progress?.quiz_scores,
    progress?.is_completed,
  ]);

  const onChapterSelect = ({ key }) => {
    // Key format: "chapterIndex-sectionIndex" or just "chapterIndex"
    const [chIdx, secIdx] = key.split("-").map((v) => parseInt(v));

    setCurrentChapterIndex(chIdx);
    setCurrentSectionIndex(secIdx || 0);
    setShowQuiz(false);
    setQuizResult(null);
    syncOccurredRef.current = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleQuizComplete = async (obj) => {
    setQuizResult(obj);
    const chapterId = course.chapters[currentChapterIndex].id;

    // Update local state first for immediate UI feedback
    const updatedCompletedChapters = Array.from(
      new Set([...(progress?.completed_chapters || []), chapterId])
    );
    const updatedQuizScores = {
      ...(progress?.quiz_scores || {}),
      [chapterId]: Math.round(
        (obj.numberOfCorrectAnswers / obj.numberOfQuestions) * 100
      ),
    };
    const isCompletedNow =
      updatedCompletedChapters.length === course.chapters.length;

    try {
      const payload = {
        course_id: courseId,
        current_chapter_id: chapterId,
        current_section_index: currentSectionIndex,
        completed_chapters: updatedCompletedChapters,
        quiz_scores: updatedQuizScores,
        is_completed: isCompletedNow,
      };
      const res = await AcademyService.syncProgress(payload);
      setProgress(res.progress);
    } catch (error) {
      console.error("Error syncing progress:", error);
    }
  };

  const handleTimeUp = () => {
    Modal.warning({
      title: "Time's Up!",
      content:
        "Your assessment time has expired. Your current answers will be submitted.",
      onOk: () => setShowQuiz(false),
    });
  };

  if (loading || !course) {
    return (
      <div
        style={{
          height: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" tip="Loading Course Knowledge..." />
      </div>
    );
  }

  const currentChapter = course.chapters[currentChapterIndex];
  const progressPercent = Math.round(
    ((progress?.completed_chapters?.length || 0) / course.chapters.length) * 100
  );

  const isChapterCompleted = progress?.completed_chapters?.includes(
    currentChapter.id
  );
  const isLastSection =
    !currentChapter.sections ||
    currentSectionIndex === currentChapter.sections.length - 1;
  const isQuizLocked = currentChapter.sections && !isLastSection;

  return (
    <Layout className="course-player-container">
      <Sider
        width={320}
        className="player-sider"
        breakpoint="lg"
        collapsedWidth="0"
      >
        <div className="sider-header">
          <Text className="progress-label">COURSE PROGRESS</Text>
          <Title level={4} className="course-title">
            {course.title}
          </Title>
          <Progress
            percent={progressPercent}
            strokeColor="#1B625F"
            trailColor="rgba(27, 98, 95, 0.1)"
            size="small"
          />
        </div>
        <Menu
          mode="inline"
          className="chapter-menu"
          selectedKeys={[
            `${currentChapterIndex}${
              course.chapters[currentChapterIndex].sections
                ? `-${currentSectionIndex}`
                : ""
            }`,
          ]}
          onClick={onChapterSelect}
          items={course.chapters.map((ch, idx) => {
            if (ch.sections && ch.sections.length > 0) {
              return {
                key: idx.toString(),
                icon: <BookOutlined />,
                label: ch.title,
                children: ch.sections.map((sec, secIdx) => ({
                  key: `${idx}-${secIdx}`,
                  label: sec.title,
                })),
              };
            }
            return {
              key: idx.toString(),
              icon: <BookOutlined />,
              label: ch.title,
            };
          })}
        />
      </Sider>

      <Content className="player-content">
        <div className="breadcrumb-nav">
          <Link to={routePath.idc.academy} className="back-link">
            <ArrowLeftOutlined style={{ marginRight: "8px" }} />
            Back to Library
          </Link>
        </div>

        {!showQuiz ? (
          <div className="reading-mode animate-fade-in">
            <div className="reading-card">
              <Title level={2}>
                {currentChapter.sections
                  ? currentChapter.sections[currentSectionIndex].title
                  : currentChapter.title}
              </Title>
              <Divider />
              <div className="markdown-body">
                {currentChapter.sections ? (
                  <ReactMarkdown>
                    {currentChapter.sections[currentSectionIndex].content}
                  </ReactMarkdown>
                ) : currentChapter.content ? (
                  <ReactMarkdown>{currentChapter.content}</ReactMarkdown>
                ) : (
                  <Paragraph type="secondary" italic>
                    No detailed content available for this module.
                  </Paragraph>
                )}
              </div>
            </div>

            <div className="module-footer">
              <div className="footer-info">
                <div className="icon-wrap">
                  <QuestionCircleOutlined />
                </div>
                <div>
                  <Title
                    level={4}
                    style={{ marginBottom: 0, color: "#1B625F" }}
                  >
                    Module Assessment
                  </Title>
                  <Text type="secondary">
                    {currentChapter.quiz?.questions?.length || 5} Questions •{" "}
                    {currentChapter.quiz?.timerInMinutes || 5} Min
                  </Text>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "8px",
                }}
              >
                {isQuizLocked && (
                  <Alert
                    message="Complete all sections to unlock the quiz"
                    type="info"
                    showIcon
                    style={{ borderRadius: "8px", padding: "4px 12px" }}
                  />
                )}
                <Button
                  type="primary"
                  size="large"
                  disabled={isQuizLocked}
                  onClick={() => setShowQuiz(true)}
                  style={{
                    backgroundColor: "#1B625F",
                    borderColor: "#1B625F",
                    height: "56px",
                    padding: "0 40px",
                    borderRadius: "28px",
                    fontWeight: 600,
                    opacity: isQuizLocked ? 0.5 : 1,
                  }}
                >
                  {isChapterCompleted
                    ? "Review Assessment"
                    : "Start Knowledge Check"}
                </Button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "40px",
              }}
            >
              <Button
                disabled={
                  currentChapterIndex === 0 && currentSectionIndex === 0
                }
                icon={<LeftOutlined />}
                onClick={() => {
                  if (currentSectionIndex > 0) {
                    setCurrentSectionIndex(currentSectionIndex - 1);
                  } else {
                    const prevChIdx = currentChapterIndex - 1;
                    const prevCh = course.chapters[prevChIdx];
                    setCurrentChapterIndex(prevChIdx);
                    setCurrentSectionIndex(
                      prevCh.sections ? prevCh.sections.length - 1 : 0
                    );
                  }
                  syncOccurredRef.current = false;
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Previous
              </Button>
              <Tooltip
                title={
                  isLastSection && !isChapterCompleted
                    ? "Complete the Knowledge Check to proceed to the next chapter"
                    : ""
                }
              >
                <Button
                  disabled={
                    currentChapterIndex === course.chapters.length - 1 &&
                    isLastSection
                  }
                  onClick={() => {
                    if (
                      currentChapter.sections &&
                      currentSectionIndex < currentChapter.sections.length - 1
                    ) {
                      setCurrentSectionIndex(currentSectionIndex + 1);
                    } else if (!isChapterCompleted) {
                      // If chapter not completed, jump to quiz instead of next chapter
                      setShowQuiz(true);
                    } else {
                      // Only allow next chapter if quiz is completed
                      setCurrentChapterIndex(currentChapterIndex + 1);
                      setCurrentSectionIndex(0);
                    }
                    syncOccurredRef.current = false;
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Next <RightOutlined />
                </Button>
              </Tooltip>
            </div>
          </div>
        ) : (
          <div className="quiz-mode animate-fade-in">
            <Button
              icon={<LeftOutlined />}
              onClick={() => setShowQuiz(false)}
              className="back-btn-quiz"
              style={{ marginBottom: "24px", borderRadius: "8px" }}
            >
              Back to Module Content
            </Button>

            <QuizTimer
              initialMinutes={currentChapter.quiz?.timerInMinutes || 5}
              onTimeUp={handleTimeUp}
            />

            <div className="quiz-container-premium">
              <Quiz
                quiz={currentChapter.quiz}
                shuffle={true}
                onComplete={handleQuizComplete}
                showDefaultResult={false}
              />

              <QuizResult
                quizResult={quizResult}
                quiz={currentChapter.quiz}
                isLastChapter={
                  currentChapterIndex === course.chapters.length - 1
                }
                onRetry={() => {
                  setQuizResult(null);
                  setShowQuiz(false);
                  setTimeout(() => setShowQuiz(true), 100);
                }}
                onNext={() => {
                  if (currentChapterIndex < course.chapters.length - 1) {
                    setCurrentChapterIndex(currentChapterIndex + 1);
                    setShowQuiz(false);
                    setQuizResult(null);
                    syncOccurredRef.current = false;
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  } else {
                    navigate(routePath.idc.academy);
                  }
                }}
              />
            </div>
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default CoursePlayer;
