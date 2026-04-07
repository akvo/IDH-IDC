import React, { useState, useEffect, useRef } from "react";
import {
  Layout,
  Menu,
  Typography,
  Button,
  Progress,
  Modal,
  Result,
  Spin,
  Divider,
} from "antd";
import {
  BookOutlined,
  QuestionCircleOutlined,
  LeftOutlined,
  RightOutlined,
  CheckCircleFilled,
  MessageOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Quiz from "react-quiz-component";
import AcademyService from "./AcademyService";

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
    <div
      style={{
        position: "fixed",
        top: "80px",
        right: "24px",
        zIndex: 1000,
        background: "#fff",
        padding: "8px 16px",
        borderRadius: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        border: "2px solid #1B625F",
      }}
    >
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
  };

  const handleQuizComplete = async (obj) => {
    setQuizResult(obj);

    // Sync progress to backend
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
      <div style={{ textAlign: "center", padding: "100px" }}>
        <Spin size="large" />
      </div>
    );
  }

  const currentChapter = course.chapters[currentChapterIndex];
  const progressPercent = Math.round(
    ((currentChapterIndex + 1) / course.chapters.length) * 100
  );

  return (
    <Layout style={{ minHeight: "calc(100vh - 64px)", background: "#fff" }}>
      <Sider
        width={300}
        style={{ background: "#f9f9f9", borderRight: "1px solid #f0f0f0" }}
        breakpoint="lg"
        collapsedWidth="0"
      >
        <div style={{ padding: "16px", background: "#1B625F", color: "#fff" }}>
          <Title level={4} style={{ color: "#fff", marginBottom: 0 }}>
            {course.title}
          </Title>
          <Progress
            percent={progressPercent}
            strokeColor="#fff"
            size="small"
            style={{ marginTop: "12px" }}
          />
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentChapterIndex.toString()]}
          onClick={onChapterSelect}
          style={{ height: "100%", borderRight: 0, background: "transparent" }}
          items={course.chapters.map((ch, idx) => ({
            key: idx.toString(),
            icon: <BookOutlined />,
            label: ch.title,
          }))}
        />
      </Sider>

      <Content style={{ padding: "0 24px 24px", position: "relative" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 0" }}>
          {!showQuiz ? (
            <div className="reading-mode animate-fade-in">
              <Title level={2}>{currentChapter.title}</Title>
              <Divider />
              <div
                style={{ fontSize: "16px", lineHeight: "1.8", color: "#444" }}
              >
                <ReactMarkdown>{currentChapter.content}</ReactMarkdown>
              </div>

              <div
                style={{
                  marginTop: "48px",
                  display: "flex",
                  justifyContent: "space-between",
                  background: "#f0f5f5",
                  padding: "24px",
                  borderRadius: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <QuestionCircleOutlined
                    style={{
                      fontSize: "32px",
                      marginRight: "16px",
                      color: "#1B625F",
                    }}
                  />
                  <div>
                    <Title level={4} style={{ marginBottom: 0 }}>
                      Module Knowledge Check
                    </Title>
                    <Text type="secondary">
                      Validate your understanding of this section.
                    </Text>
                  </div>
                </div>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => setShowQuiz(true)}
                  style={{ backgroundColor: "#1B625F", borderColor: "#1B625F" }}
                >
                  Start Assessment
                </Button>
              </div>
            </div>
          ) : (
            <div className="quiz-mode animate-fade-in">
              <Button
                icon={<LeftOutlined />}
                onClick={() => setShowQuiz(false)}
                style={{ marginBottom: "24px" }}
              >
                Back to Reading
              </Button>

              <QuizTimer
                initialMinutes={currentChapter.quiz.timerInMinutes}
                onTimeUp={handleTimeUp}
              />

              <div
                style={{
                  background: "#fff",
                  padding: "24px",
                  borderRadius: "16px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <Quiz
                  quiz={currentChapter.quiz}
                  shuffle={true}
                  onComplete={handleQuizComplete}
                  showDefaultResult={true}
                />
              </div>

              {quizResult && (
                <div style={{ marginTop: "32px", textAlign: "center" }}>
                  <Button
                    type="primary"
                    size="large"
                    style={{ backgroundColor: "#1B625F" }}
                    onClick={() => {
                      if (currentChapterIndex < course.chapters.length - 1) {
                        setCurrentChapterIndex(currentChapterIndex + 1);
                        setShowQuiz(false);
                        setQuizResult(null);
                      } else {
                        navigate("/academy");
                      }
                    }}
                  >
                    {currentChapterIndex < course.chapters.length - 1
                      ? "Next Module"
                      : "Finish Course"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default CoursePlayer;
