import React from "react";
import { otherToolsAndResourcesContent } from "../../store/static-other-tools-resources-content";
import { Button, Image, Space, Tag } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const OtherToolResourceList = ({
  size = otherToolsAndResourcesContent.length,
  showMoreButton = false,
}) => {
  const navigate = useNavigate();

  return (
    <div className="other-tool-resource-list-container">
      <div className="other-tool-resource-list">
        {otherToolsAndResourcesContent
          .filter((item) => item.order <= size)
          .map((item, ti) => {
            const LinkButton = ({ children }) => {
              if (item?.button?.type === "download") {
                return (
                  <a href={item.button.href} download>
                    {children}
                  </a>
                );
              }

              if (item?.button?.type === "new-window") {
                return (
                  <a
                    href={item.button.href}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {children}
                  </a>
                );
              }

              return <Link to={item.button.href}>{children}</Link>;
            };

            return (
              <div key={`otr-${ti}`} className="otr-item-wrapper">
                <Image
                  src={item.image}
                  preview={false}
                  style={{ borderRadius: 20, marginBottom: 20 }}
                />
                <Space className="otr-tag-button-wrapper">
                  <Tag
                    bordered={false}
                    color="#01625F"
                    style={{
                      borderRadius: 20,
                      padding: "2px 10px",
                    }}
                  >
                    {item.tag}
                  </Tag>
                </Space>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                {item?.button?.text && (
                  <LinkButton>
                    <Button
                      type="link"
                      style={{
                        color: "#00625F",
                        fontWeight: 600,
                        padding: 0,
                        fontFamily: "RocGrotesk",
                      }}
                    >
                      {item.button.text}
                    </Button>
                  </LinkButton>
                )}
              </div>
            );
          })}
      </div>
      {showMoreButton && (
        <div className="button-wrapper">
          <Button onClick={() => navigate("/tools-and-resources")}>
            Explore more Tools & Resources <ArrowRightOutlined />
          </Button>
        </div>
      )}
    </div>
  );
};

export default OtherToolResourceList;
