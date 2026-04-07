import React, { useState, useEffect } from "react";
import { Card, Col, Row, Typography, Button, Spin, Tag, Badge } from "antd";
import { BookOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import AcademyService from "./AcademyService";

const { Title, Text } = Typography;

const AcademyLibrary = () => {
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseList, userProgress] = await Promise.all([
          AcademyService.getCourses(),
          AcademyService.getProgress(),
        ]);
        setCourses(courseList);
        setProgress(userProgress);
      } catch (error) {
        console.error("Error loading library:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getProgressPercentage = (courseId) => {
    const p = progress[courseId];
    if (!p) {
      return 0;
    }
    // Assuming binary progress (Start/Done) for PoC, or can be chapter-based
    return p.completed ? 100 : 50;
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" tip="Loading Academy..." />
      </div>
    );
  }

  return (
    <div className="academy-library" style={{ padding: "24px" }}>
      <div
        style={{
          marginBottom: "32px",
          borderBottom: "1px solid #f0f0f0",
          paddingBottom: "16px",
        }}
      >
        <Title level={2} style={{ color: "#1B625F" }}>
          IDC Academy
        </Title>
        <Text type="secondary">
          Master the tools and methodology of the Income Driver Calculator.
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {courses.map((course) => (
          <Col xs={24} sm={12} lg={8} key={course.id}>
            <Card
              hoverable
              title={
                <div style={{ display: "flex", alignItems: "center" }}>
                  <BookOutlined
                    style={{ marginRight: "8px", color: "#1B625F" }}
                  />
                  <span>{course.title}</span>
                </div>
              }
              extra={
                <Tag
                  color={
                    progress[course.id]?.completed ? "success" : "processing"
                  }
                >
                  {progress[course.id]?.completed ? "Completed" : "In Progress"}
                </Tag>
              }
              actions={[
                <Button
                  key="start-btn"
                  type="primary"
                  icon={<RightOutlined />}
                  onClick={() => navigate(`/academy/${course.id}`)}
                  style={{ backgroundColor: "#1B625F", borderColor: "#1B625F" }}
                >
                  {progress[course.id] ? "Continue" : "Start Learning"}
                </Button>,
              ]}
            >
              <div style={{ minHeight: "80px" }}>
                <Text type="secondary">
                  {course.description ||
                    "Learn about contextualising benchmarks and income drivers."}
                </Text>
              </div>
              <div style={{ marginTop: "16px" }}>
                <Badge
                  status={
                    progress[course.id]?.completed ? "success" : "processing"
                  }
                  text={`${course.chapterCount || 1} Modules`}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default AcademyLibrary;
