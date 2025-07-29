import React from "react";
import { otherToolsAndResourcesContent } from "../../../store/static-other-tools-resources-content";
import { Button, Space, Tag } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useWindowDimensions } from "../../../hooks";
import { orderBy } from "lodash";

const OtherToolResourceList = ({
  size = otherToolsAndResourcesContent.length,
  showMoreButton = false,
  isLandingPage = false,
  toolsOrderForLandingPage = [],
}) => {
  const navigate = useNavigate();
  const { isMobile } = useWindowDimensions();

  return (
    <div
      className={`other-tool-resource-list-container ${
        isMobile ? "mobile-screen" : ""
      }`}
    >
      <div
        className={`other-tool-resource-list ${
          isLandingPage && !isMobile ? "force-3-in-a-row" : ""
        }`}
      >
        {orderBy(
          otherToolsAndResourcesContent
            .filter((item) => {
              if (toolsOrderForLandingPage?.length) {
                // filter by selected key order
                return toolsOrderForLandingPage.includes(item.key);
              }
              return item.order <= size;
            })
            .map((item) => {
              let itemOrder = item.order;
              if (toolsOrderForLandingPage?.length) {
                itemOrder = toolsOrderForLandingPage.indexOf(item.key);
              }
              item["new_order"] = itemOrder;
              return item;
            }),
          ["new_order"],
          "asc"
        ).map((item, ti) => {
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
              <div
                style={{
                  borderRadius: 20,
                  marginBottom: 20,
                  backgroundImage: `url(${item.image})`,
                  backgroundSize: "cover",
                  width: "100%",
                  height: "250px",
                }}
                className="otr-image"
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
