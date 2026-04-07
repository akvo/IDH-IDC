import React, { useState, useEffect } from "react";
import { Card, Col, Row, Typography, Button, Spin, Tag, Badge } from "antd";
import { BookOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { routePath } from "../../components/route";
import AcademyService from "./AcademyService";
import "./AcademyLibrary.scss";

const { Title, Text, Paragraph } = Typography;

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

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px" }}>
        <Spin size="large" tip="Loading Academy..." />
      </div>
    );
  }

  return (
    <div className="academy-library-container">
      <div className="library-header">
        <Title>IDC Academy</Title>
        <Paragraph type="secondary" style={{ fontSize: "16px" }}>
          Master the tools and methodology of the Income Driver Calculator. Our
          modules provide structured training on benchmarks, data
          contextualization, and advanced modelling.
        </Paragraph>
      </div>

      <Row gutter={[32, 32]}>
        {courses.map((course) => (
          <Col xs={24} sm={12} lg={8} key={course.id}>
            <Card
              className="course-card-premium"
              cover={
                <div className="card-cover-icon">
                  <BookOutlined />
                </div>
              }
              extra={
                <Tag
                  color={
                    progress[course.id]?.status === "completed"
                      ? "success"
                      : progress[course.id]?.status === "in-progress"
                      ? "processing"
                      : "default"
                  }
                  style={{ borderRadius: "10px", padding: "0 12px" }}
                >
                  {progress[course.id]?.status === "completed"
                    ? "Completed"
                    : progress[course.id]?.status === "in-progress"
                    ? "In Progress"
                    : "Available"}
                </Tag>
              }
              actions={[
                <Button
                  key="start-btn"
                  type="primary"
                  block
                  className="course-action-btn"
                  onClick={() =>
                    navigate(`${routePath.idc.academy}/${course.id}`)
                  }
                >
                  {progress[course.id]?.status === "completed"
                    ? "Review Course"
                    : progress[course.id]?.status === "in-progress"
                    ? "Continue Learning"
                    : "Start Course"}
                </Button>,
              ]}
            >
              <Card.Meta
                title={course.title}
                description={
                  <div style={{ minHeight: "100px" }}>
                    <Paragraph
                      type="secondary"
                      ellipsis={{ rows: 3 }}
                      style={{ marginBottom: "16px" }}
                    >
                      {course.description ||
                        "Explore how living income benchmarks are calculated and adjusted for local contexts."}
                    </Paragraph>
                    <div style={{ position: "absolute", bottom: "84px" }}>
                      <Badge
                        status={
                          progress[course.id]?.completed
                            ? "success"
                            : "processing"
                        }
                        text={
                          <Text strong style={{ color: "#1B625F" }}>
                            {course.chapterCount || 1} Modules
                          </Text>
                        }
                      />
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default AcademyLibrary;
