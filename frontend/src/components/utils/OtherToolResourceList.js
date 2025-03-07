import React from "react";
import { otherToolsAndResourcesContent } from "../../store/static-other-tools-resources-content";
import { Button, Image, Tag } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const OtherToolResourceList = ({ size = 5, showMoreButton = false }) => {
  const navigate = useNavigate();

  return (
    <div className="other-tool-resource-list-container">
      <div className="other-tool-resource-list">
        {otherToolsAndResourcesContent
          .filter((item) => item.order <= size)
          .map((item, ti) => {
            return (
              <div key={`otr-${ti}`} className="otr-item-wrapper">
                <Image
                  src={item.image}
                  preview={false}
                  style={{ borderRadius: 20, marginBottom: 20 }}
                />
                <Tag
                  bordered={false}
                  color="#01625F"
                  style={{ borderRadius: 20, padding: "2px 10px" }}
                >
                  {item.tag}
                </Tag>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                {item?.button?.text && (
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
                )}
              </div>
            );
          })}
      </div>
      {showMoreButton && (
        <div className="button-wrapper">
          <Button onClick={() => navigate("/other-resources")}>
            Explore more Tools & Resources <ArrowRightOutlined />
          </Button>
        </div>
      )}
    </div>
  );
};

export default OtherToolResourceList;
