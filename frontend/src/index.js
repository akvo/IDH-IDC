import React from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter as Router } from "react-router-dom";
import { ConfigProvider } from "antd";
import PiwikPro from "@piwikpro/react-piwik-pro";
import { init } from "@plausible-analytics/tracker";
import { PostHogProvider } from "posthog-js/react";

// PLAUSIBLE
init({
  domain: "synchronic-sondra-saccharic.ngrok-free.dev",
});

// POSTHOG
const posthogOptions = {
  api_host: process.env.REACT_APP_PUBLIC_POSTHOG_HOST,
  defaults: "2025-11-30",
};

// PIWIK
const origin = window?.location?.origin;
const ID =
  origin?.includes("test") || origin?.includes("localhost")
    ? "418c8745-6f9d-4e93-946c-ef65731f366d"
    : "9d53ab3a-14de-4429-85e9-4afa6f570013";
PiwikPro.initialize(ID, "https://akvo.piwik.pro");
// EOL PIWIK

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
      <PostHogProvider
        apiKey={process.env.REACT_APP_PUBLIC_POSTHOG_KEY}
        options={posthogOptions}
      >
        <App />
      </PostHogProvider>
    </ConfigProvider>
  </Router>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
