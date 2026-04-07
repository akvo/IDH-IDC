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
  Card,
  Result,
} from "antd";
import {
  BookOutlined,
  QuestionCircleOutlined,
  LeftOutlined,
  RightOutlined,
  ArrowLeftOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Quiz from "react-quiz-component";
import { routePath } from "../../components/route";
import AcademyService from "./AcademyService";
import QuizTimer from "./components/QuizTimer";
import "./CoursePlayer.scss";

const { Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;

const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
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
        setCourse(courseData);
        setProgress(progressData[courseId] || null);
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
    courseId,
    progress?.completed_chapters,
    progress?.quiz_scores,
    progress?.is_completed,
  ]);

  const onChapterSelect = ({ key }) => {
    setCurrentChapterIndex(parseInt(key));
    setShowQuiz(false);
    setQuizResult(null);
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
          selectedKeys={[currentChapterIndex.toString()]}
          onClick={onChapterSelect}
          items={course.chapters.map((ch, idx) => ({
            key: idx.toString(),
            icon: <BookOutlined />,
            label: ch.title,
          }))}
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
              <Title level={2}>{currentChapter.title}</Title>
              <Divider />
              <div className="markdown-body">
                {currentChapter.content ? (
                  <ReactMarkdown>{currentChapter.content}</ReactMarkdown>
                ) : (
                  <Paragraph type="secondary" italic>
                    No detailed content available for this chapter. Please
                    proceed to the assessment.
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
                    5 Questions • {currentChapter.quiz?.timerInMinutes || 5} Min
                  </Text>
                </div>
              </div>
              <Button
                type="primary"
                size="large"
                onClick={() => setShowQuiz(true)}
                style={{
                  backgroundColor: "#1B625F",
                  borderColor: "#1B625F",
                  height: "56px",
                  padding: "0 40px",
                  borderRadius: "28px",
                  fontWeight: 600,
                }}
              >
                Start Knowledge Check
              </Button>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "40px",
              }}
            >
              <Button
                disabled={currentChapterIndex === 0}
                icon={<LeftOutlined />}
                onClick={() => setCurrentChapterIndex(currentChapterIndex - 1)}
              >
                Previous Module
              </Button>
              <Button
                disabled={currentChapterIndex === course.chapters.length - 1}
                onClick={() => setCurrentChapterIndex(currentChapterIndex + 1)}
              >
                Next Module <RightOutlined />
              </Button>
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

              {quizResult && (
                <Card className="quiz-result-card animate-scale-in">
                  <Result
                    icon={<TrophyOutlined style={{ color: "#FFD700" }} />}
                    title={
                      <Title level={2} style={{ color: "#1B625F" }}>
                        Assessment Complete!
                      </Title>
                    }
                    subTitle={
                      <div className="result-stats">
                        <Text strong size="large">
                          You scored {quizResult.numberOfCorrectAnswers} out of{" "}
                          {quizResult.numberOfQuestions}
                        </Text>
                        <br />
                        <Progress
                          percent={Math.round(
                            (quizResult.numberOfCorrectAnswers /
                              quizResult.numberOfQuestions) *
                              100
                          )}
                          strokeColor="#1B625F"
                          type="circle"
                          style={{ marginTop: "24px" }}
                        />
                      </div>
                    }
                    extra={[
                      <Button
                        type="primary"
                        key="next"
                        size="large"
                        className="btn-next-module"
                        onClick={() => {
                          if (
                            currentChapterIndex <
                            course.chapters.length - 1
                          ) {
                            setCurrentChapterIndex(currentChapterIndex + 1);
                            setShowQuiz(false);
                            setQuizResult(null);
                            syncOccurredRef.current = false;
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          } else {
                            navigate(routePath.idc.academy);
                          }
                        }}
                      >
                        {currentChapterIndex < course.chapters.length - 1
                          ? "Proceed to Next Module"
                          : "Finish Academy Course"}
                      </Button>,
                      <Button
                        key="retry"
                        onClick={() => {
                          setQuizResult(null);
                          setShowQuiz(false);
                          setTimeout(() => setShowQuiz(true), 100);
                        }}
                        style={{ marginTop: "12px" }}
                      >
                        Retry Assessment
                      </Button>,
                    ]}
                  />
                </Card>
              )}
            </div>
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default CoursePlayer;
