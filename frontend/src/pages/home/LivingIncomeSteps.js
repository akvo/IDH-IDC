import { Image, Popconfirm, Row, Col, Card } from "antd";
import LivingIncomeRoadmap from "../../assets/images/living-income-roadmap.png";
import "./living_income_steps.scss";
import { toolResourceItems } from "./tools-resources-content";
import { Link } from "react-router-dom";
import { useWindowDimensions } from "../../hooks";

const [IncomeMeasurement, IDC, PL, CII, IDHBn] = toolResourceItems;

const roadmapSteps = [
  {
    key: 2,
    top: "37%",
    left: "27.5%",
    title: "Step 2: tools to explore",
    tools: [IncomeMeasurement, IDHBn],
  },
  {
    key: 3,
    top: "9%",
    left: "51.5%",
    title: "Step 3: tools to explore",
    tools: [IDC, IDHBn],
  },
  {
    key: 4,
    top: "67%",
    left: "55%",
    title: "Step 4: tools to explore",
    tools: [IDC, PL, CII, IDHBn],
  },
  {
    key: 5,
    top: "30%",
    left: "83%",
    title: "Step 5: tools to explore",
    tools: [CII],
  },
];

const LivingIncomeSteps = () => {
  const { isMobile, windowInnerWidth } = useWindowDimensions();

  return (
    <div className={`roadmap-container ${isMobile ? "mobile-screen" : ""}`}>
      <Image
        src={LivingIncomeRoadmap}
        preview={false}
        width={isMobile ? windowInnerWidth - 48 : 800}
        className="roadmap-image"
      />
      <div className="roadmap-overlay">
        {roadmapSteps.map(({ key, top, left, title, tools }) => (
          <Popconfirm
            key={`step-${key}`}
            title={<div className="tooltip-title">{title}</div>}
            description={
              <Row gutter={[20, 20]} className="tooltip-description">
                {tools.map((tool, idx) => {
                  const LinkButton = ({ children }) => {
                    if (tool?.button?.type === "download") {
                      return (
                        <a href={tool.button.href} download>
                          {children}
                        </a>
                      );
                    }

                    if (tool?.button?.type === "new-window") {
                      return (
                        <a
                          href={tool.button.href}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          {children}
                        </a>
                      );
                    }

                    return <Link to={tool.button.href}>{children}</Link>;
                  };

                  return (
                    <Col span={24} key={`tool-${idx}`}>
                      <Card>
                        <Row align="middle" justify="space-between">
                          <Col span={20}>
                            <h4>{tool.title}</h4>
                          </Col>
                          <Col span={4} align="end">
                            <Image
                              src={tool.icon}
                              preview={false}
                              width={32}
                              style={{ marginLeft: isMobile ? 0 : "10px" }}
                            />
                          </Col>
                        </Row>
                        <LinkButton>{tool.button.text}</LinkButton>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            }
            icon={null}
            showCancel={false}
            okButtonProps={{
              style: {
                display: "none",
              },
            }}
            trigger="hover"
            overlayInnerStyle={{ width: 300 }}
          >
            <div className="roadmap-step" style={{ top, left }}></div>
          </Popconfirm>
        ))}
      </div>
    </div>
  );
};

export default LivingIncomeSteps;
