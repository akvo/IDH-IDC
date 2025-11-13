import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Button, message, Skeleton, Space, Tabs, Tooltip, Tag } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../../lib";
import {
  PROCUREMENT_COLOR_SCALE,
  PROCUREMENT_IMPACT_AREAS,
  PROCUREMENT_SCALE,
  PROCUREMENT_TABS,
  PROCUREMENT_CATEGORIES_ID,
  SOURCING_STRATEGY_ICONS,
  SEARCHBOX_ICONS,
} from "../config";
import {
  ArrowRight,
  ChevronRightIcon,
  DownPointingIcon,
} from "../../../lib/icon";
import { ImpactAreaIcons } from "../components";
import "./practice.scss";
import { PLState } from "../../../store";

const Practice = () => {
  const { practiceId } = useParams();
  const [loading, setLoading] = useState(true);
  const [practice, setPractice] = useState(null);
  const navigate = useNavigate();
  const categoryWithAttributes = PLState.useState(
    (s) => s.categoryWithAttributes
  );

  const [primaryDesc, secondaryDesc] =
    practice?.intervention_definition?.split(
      /<h3>(?:Additional Details:|Process:|Details of the process:|Additional details:|Additional Detail:|Additional Information:)<\/h3>/
    ) || [];
  const isEnv =
    practice?.scores?.find(
      (s) => s?.indicator_name === PROCUREMENT_IMPACT_AREAS.env
    )?.score > 3;
  const isIncome =
    practice?.scores?.find(
      (s) => s?.indicator_name === PROCUREMENT_IMPACT_AREAS.income
    )?.score > 3;

  const sourcingStrategyCycleTags = useMemo(
    () =>
      practice?.tags?.filter(
        (tag) =>
          tag.category_id === PROCUREMENT_CATEGORIES_ID.sourcing_strategy_cycle
      ) || [],
    [practice]
  );

  const procurementPrincipleOptions = useMemo(
    () =>
      categoryWithAttributes
        .find(
          (attr) => attr.id === PROCUREMENT_CATEGORIES_ID.procurement_principles
        )
        ?.attributes?.map((it) => ({ label: it.label, value: it.id })),
    [categoryWithAttributes]
  );

  const sourcingPrinciplesTags = useMemo(() => {
    if (!practice?.tags) {
      return [];
    }
    const sourcingPrinciplesIds = procurementPrincipleOptions.map(
      (p) => p.value
    );
    return practice?.tags?.filter((tag) =>
      sourcingPrinciplesIds.includes(tag.id)
    );
  }, [procurementPrincipleOptions, practice?.tags]);

  const fetchPractice = useCallback(async () => {
    try {
      const { data: _practice } = await api.get(`/plv2/practice/${practiceId}`);
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

  const RenderSourcingStrategryCycleTags = () =>
    sourcingStrategyCycleTags.map((tag) => {
      let icon = null;
      let tooltipTitle = "";
      const label = tag.label.toLowerCase();
      if (label.includes("internal")) {
        icon = SOURCING_STRATEGY_ICONS.internal;
        tooltipTitle = SEARCHBOX_ICONS[0]?.name || "";
      } else if (label.includes("external")) {
        icon = SOURCING_STRATEGY_ICONS.external;
        tooltipTitle = SEARCHBOX_ICONS[1]?.name || "";
      } else if (label.includes("strategic")) {
        icon = SOURCING_STRATEGY_ICONS.strategic;
        tooltipTitle = SEARCHBOX_ICONS[2]?.name || "";
      } else if (label.includes("implementation")) {
        icon = SOURCING_STRATEGY_ICONS.implementation;
        tooltipTitle = SEARCHBOX_ICONS[3]?.name || "";
      } else {
        icon = null;
        tooltipTitle = "";
      }
      return icon ? (
        <Tooltip title={tooltipTitle}>
          <img src={icon} alt="label" className="ssc-tag" />
        </Tooltip>
      ) : (
        ""
      );
    });

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
                        {/* {index + 1} */}
                        &nbsp;
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
          <Button
            type="link"
            onClick={() =>
              navigate("/procurement-library/intervention-library")
            }
            className="back-btn"
          >
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
                      ?.replace("<h4>Definition</h4>", "")
                      ?.replace("<h3>Defintion:</h3>", ""),
                  }}
                ></div>
                {sourcingPrinciplesTags?.length ? (
                  <div className="practice-tags">
                    <div className="pt-title">Sourcing principles</div>
                    <div className="pt-tags-wrapper">
                      {sourcingPrinciplesTags?.map((tag) => (
                        <Tag key={`pt-tag-${tag.id}`}>{tag.label}</Tag>
                      ))}
                    </div>
                  </div>
                ) : (
                  ""
                )}
              </div>
              <div className="practice-card-categories">
                <Space>
                  <RenderSourcingStrategryCycleTags />
                  <ImpactAreaIcons {...{ isEnv, isIncome }} />
                </Space>
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
                          className="practice-content-text font-tablet-gothic"
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
