import React, { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Typography,
  Button,
  Progress,
  Modal,
  Spin,
  Divider,
} from "antd";
import {
  BookOutlined,
  QuestionCircleOutlined,
  LeftOutlined,
  RightOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Quiz from "react-quiz-component";
import { routePath } from "../../components/route";
import AcademyService from "./AcademyService";
import "./CoursePlayer.scss";

const { Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;

const QuizTimer = ({ initialMinutes, onTimeUp }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onTimeUp();
      return;
    }
    const timer = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, onTimeUp]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs < 10 ? "0" : ""}${rs}`;
  };

  return (
    <div className="quiz-timer-floating">
      <ClockCircleOutlined style={{ color: "#1B625F", marginRight: "8px" }} />
      <Text strong style={{ color: "#1B625F" }}>
        {formatTime(secondsLeft)}
      </Text>
    </div>
  );
};

const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const data = await AcademyService.getCourse(courseId);
        setCourse(data);
      } catch (error) {
        console.error("Error fetching course:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  const onChapterSelect = ({ key }) => {
    setCurrentChapterIndex(parseInt(key));
    setShowQuiz(false);
    setQuizResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleQuizComplete = async (obj) => {
    setQuizResult(obj);
    try {
      await AcademyService.syncProgress({
        courseId,
        chapterId: course.chapters[currentChapterIndex].id,
        score: obj.numberOfCorrectAnswers,
        totalQuestions: obj.numberOfQuestions,
        completed: true,
      });
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
    ((currentChapterIndex + 1) / course.chapters.length) * 100
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
            strokeColor="#fff"
            trailColor="rgba(255,255,255,0.2)"
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
                showDefaultResult={true}
              />
            </div>

            {quizResult && (
              <div style={{ marginTop: "48px", textAlign: "center" }}>
                <Button
                  type="primary"
                  size="large"
                  style={{
                    backgroundColor: "#1B625F",
                    height: "56px",
                    borderRadius: "28px",
                    padding: "0 60px",
                  }}
                  onClick={() => {
                    if (currentChapterIndex < course.chapters.length - 1) {
                      setCurrentChapterIndex(currentChapterIndex + 1);
                      setShowQuiz(false);
                      setQuizResult(null);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    } else {
                      navigate(routePath.idc.academy);
                    }
                  }}
                >
                  {currentChapterIndex < course.chapters.length - 1
                    ? "Next Module"
                    : "Complete Course"}
                </Button>
              </div>
            )}
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default CoursePlayer;
