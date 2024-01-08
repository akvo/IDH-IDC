import React from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter as Router } from "react-router-dom";
import { ConfigProvider } from "antd";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <Router>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#26605F",
        },
        components: {
          Breadcrumb: {
            linkColor: "#26605F",
            separatorColor: "#26605F",
          },
          Tabs: {
            cardBg: "#F0F0F0",
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </Router>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
