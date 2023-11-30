import React, { useEffect, useState } from "react";
import { Col, Steps } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";

const activeStyle = {
  color: "#26605f",
  fontWeight: "bold",
};
const menuList = [
  {
    name: "Case Profile",
  },
  {
    name: "Income Driver Data Entry",
  },
  {
    name: "Income Driver Dashboard",
  },
];

const SideMenu = ({ active, setActive, finished }) => {
  const [sideMenuTop, setSideMenuTop] = useState(129);

  useEffect(() => {
    const contentLayoutHeight =
      document.getElementById("content-layout")?.offsetHeight || 0;
    const pageHeaderHeight =
      document.getElementById("page-layout-header")?.offsetHeight || 0;
    setSideMenuTop(contentLayoutHeight + pageHeaderHeight);
  }, []);

  return (
    <Col span={24} style={{ marginTop: 40 }}>
      <div className="timeline-container" style={{ top: sideMenuTop }}>
        <Steps
          current={active}
          size="small"
          items={menuList.map((item) => {
            const isFinished = finished.includes(item.name);
            const result = {
              className: isFinished ? "finished-dot" : "",
              color: active === item.name ? activeStyle.color : "gray",
              status: isFinished ? "finish" : "wait",
              title: (
                <span
                  style={active === item.name || isFinished ? activeStyle : {}}
                  onClick={() => setActive(item.name)}
                >
                  {item.name}
                </span>
              ),
            };
            if (isFinished) {
              result.icon = (
                <CheckCircleFilled
                  color={activeStyle.color}
                  className="finished-dot"
                />
              );
            }
            return result;
          })}
        />
      </div>
    </Col>
  );
};

export default SideMenu;
