import React, { useState, useEffect } from "react";
import "./welcome.scss";
import { Row, Col, Card, Button } from "antd";
import { UserState } from "../../store";
import { ArrowRightOutlined } from "@ant-design/icons";
import { MapView } from "akvo-charts";
import { api } from "../../lib";

const Welcome = () => {
  const { fullname: username } = UserState.useState((s) => s);
  const [mapData, setMapData] = useState([]);

  useEffect(() => {
    if (!mapData?.length) {
      api
        .get("/map/case-by-country")
        .then((res) => {
          setMapData(res.data);
        })
        .catch((e) => console.error(`Error fetching map data: ${e}`));
    }
  }, [mapData]);

  const config = {
    center: [41, 10],
    zoom: 2.3,
    height: "75vh",
    width: "100%",
  };

  const tile = {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    maxZoom: 19,
    minZoom: 2,
    attribution: "© OpenStreetMap",
  };

  const onClick = (map, { target }) => {
    console.log(map, target);
    // map.fitBounds(target._bounds)
  };

  const layer = {
    source: "window.topojson",
    url: `${window.location.origin}/api/map/static/world_map.js`,
    style: {
      color: "#000",
      weight: 0,
      fillColor: "#EAF2F2",
      fillOpacity: 0.5,
    },
    color: [
      "#D0E2E2",
      "#B6D2D1",
      "#9CC2C1",
      "#82B2B1",
      "#69A2A0",
      "#4F9290",
      "#358280",
      "#1B726F",
      "#01625F",
    ],
    mapKey: "COUNTRY",
    choropleth: "case_count",
    onClick: onClick,
  };

  return (
    <Row id="welcome" align="middle" gutter={[20, 20]}>
      {/* Header */}
      <Col span={24} className="username-wrapper">
        Hello, {username}!
      </Col>

      {/* Jumbotron */}
      <Col span={24} className="jumbotron-card-wrapper">
        <Card className="welcome-card-wrapper">
          <div className="welcome-title">
            Welcome to the income driver calculator
          </div>
          <div className="welcome-subtitle">
            Enter in this creative world. Discover now the latest NFTs or start
            creating your own!
          </div>
        </Card>
        <Row
          align="middle"
          justify="center"
          gutter={[24, 24]}
          className="floating-card-wrapper"
        >
          <Col span={7}>
            <Card className="floating-card-item case-card-wrapper">
              <Row gutter={[12, 12]}>
                <Col span={24} className="title">
                  Cases
                </Col>
                <Col span={24} className="description">
                  Calculates actual household income and feasible changes in
                  income by using input data on the 5 key drivers of household
                  income.
                </Col>
                <Col span={24} align="end">
                  <Button className="button-explore">
                    Explore <ArrowRightOutlined />
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col span={7}>
            <Card className="floating-card-item explore-studies-card-wrapper">
              <Row gutter={[12, 12]}>
                <Col span={24} className="title">
                  Explore Studies for Insights
                </Col>
                <Col span={24} className="description">
                  To make the data entry process more informed and efficient, we
                  recommend visiting the &quot;Explore Studies&quot; section.
                </Col>
                <Col span={24} align="end">
                  <Button className="button-explore">
                    Explore <ArrowRightOutlined />
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col span={7}>
            <Card className="floating-card-item lib-card-wrapper">
              <Row gutter={[12, 12]}>
                <Col span={24} className="title">
                  Living income benchmarks
                </Col>
                <Col span={24} className="description">
                  To make the data entry process more informed and efficient, we
                  recommend visiting the &quot;Explore Studies&quot; section.
                </Col>
                <Col span={24} align="end">
                  <Button className="button-explore">
                    Explore <ArrowRightOutlined />
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Col>
      {/* EOL  Jumbotron */}

      {/* Map */}
      <Col span={24}>
        <Card className="map-card-wrapper">
          <MapView tile={tile} layer={layer} data={mapData} config={config} />
        </Card>
      </Col>
      {/* EOL Map */}
    </Row>
  );
};

export default Welcome;
