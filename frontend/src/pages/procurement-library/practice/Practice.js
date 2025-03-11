import React, { useCallback, useEffect, useState } from "react";
import { Button, message, Skeleton, Space, Tabs } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../../lib";
import {
  PROCUREMENT_COLOR_SCALE,
  PROCUREMENT_IMPACT_AREAS,
  PROCUREMENT_SCALE,
  PROCUREMENT_TABS,
} from "../config";
import {
  ArrowRight,
  ChevronRightIcon,
  DownPointingIcon,
} from "../../../lib/icon";
import { ImpactAreaIcons, ProcurementBadge } from "../components";
import "./practice.scss";

const Practice = () => {
  const { practiceId } = useParams();
  const [loading, setLoading] = useState(true);
  const [practice, setPractice] = useState(null);
  const navigate = useNavigate();

  const [primaryDesc, secondaryDesc] =
    practice?.intervention_definition?.split(
      "\n<b>Additional Details:</b>\n"
    ) || [];
  const isEnv =
    practice?.scores?.find(
      (s) => s?.indicator_name === PROCUREMENT_IMPACT_AREAS.env
    )?.score > 3;
  const isIncome =
    practice?.scores?.find(
      (s) => s?.indicator_name === PROCUREMENT_IMPACT_AREAS.income
    )?.score > 3;

  const fetchPractice = useCallback(async () => {
    try {
      const { data: _practice } = await api.get(`/pl/practice/${practiceId}`);
      setPractice(_practice);
      setLoading(false);
    } catch (err) {
      console.error(err?.response);
      setLoading(false);
      if (err?.response?.status === 404) {
        message.error(err.response?.data?.detail);
        navigate("/404");
      } else {
        navigate("/procurement-library");
      }
    }
  }, [practiceId, navigate]);

  useEffect(() => {
    fetchPractice();
  }, [fetchPractice]);

  return (
    <div className="practice-container">
      <div className="practice-sidebar">
        <ul>
          {PROCUREMENT_SCALE.map((scale) => {
            const findScore = practice?.scores?.find(
              (score) => score?.indicator_name === scale.key
            );
            return (
              <li key={scale.key}>
                <div className="scale-label">{scale.label}</div>

                <ul className="scale-bar">
                  {PROCUREMENT_COLOR_SCALE.map((color, index) => (
                    <li key={index}>
                      <span className="scale-bar-icon">
                        {index + 1 === findScore?.score && <DownPointingIcon />}
                      </span>
                      <div
                        style={{
                          backgroundColor: color,
                        }}
                        className="scale-bar-item"
                      >
                        {index + 1}
                      </div>
                      <span className="scale-bar-label">
                        {index === 0 && <>{scale?.reversed ? "High" : "Low"}</>}
                        {index + 1 === PROCUREMENT_COLOR_SCALE.length && (
                          <>{scale?.reversed ? "Low" : "High"}</>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="practice-content">
        <div className="practice-content-header">
          <Button type="link" onClick={() => navigate(-1)} className="back-btn">
            <Space>
              <span className="back-icon">
                <ArrowRight />
              </span>
              <span className="back-text">Procurement Library</span>
            </Space>
          </Button>
        </div>
        <div className="practice-content-body">
          <Skeleton loading={loading} paragraph={{ rows: 10 }} active>
            <div className="practice-card">
              <div className="practice-card-description">
                <h1>{practice?.label}</h1>
                <div
                  className="font-tablet-gothic"
                  dangerouslySetInnerHTML={{
                    __html: primaryDesc
                      ?.replace("<h3>Definition</h3>", "")
                      ?.replace("<p>Defintion:</p>", ""),
                  }}
                ></div>
              </div>
              <div className="practice-card-categories">
                <ProcurementBadge
                  id={practice?.procurement_process_id}
                  text={practice?.procurement_process_label}
                  block
                />
                <ImpactAreaIcons {...{ isEnv, isIncome }} />
              </div>
            </div>

            <div className="practice-details-card">
              <div
                className="practice-secondary-desc font-tablet-gothic"
                dangerouslySetInnerHTML={{
                  __html: secondaryDesc,
                }}
              />

              <div className="practice-content-details">
                <Tabs
                  tabPosition="left"
                  indicator={0}
                  items={PROCUREMENT_TABS.map(({ key, label }) => {
                    return {
                      key,
                      label: (
                        <div className="tab-label">
                          <span>{label}</span>
                          <span className="tab-icon">
                            <ChevronRightIcon />
                          </span>
                        </div>
                      ),
                      children: (
                        <div
                          className="font-tablet-gothic"
                          dangerouslySetInnerHTML={{
                            __html: practice?.[key],
                          }}
                        ></div>
                      ),
                    };
                  })}
                />
              </div>
            </div>
          </Skeleton>
        </div>
      </div>
    </div>
  );
};

export default Practice;
