import React, { useState } from "react";
import AliceCarousel from "react-alice-carousel";
import "react-alice-carousel/lib/alice-carousel.css";
import { Button, Image } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { CIIContent } from "./static";

const responsive = {
  0: { items: 1 },
  568: { items: 2 },
  1024: { items: 3 },
};

const items = CIIContent.indicatorContent.map((item, i) => (
  <div key={`${item.icon}-${i}`} className="indicator-item" data-value={i}>
    <Image src={item.icon} preview={false} height={52} />
    <p>{item.title}</p>
  </div>
));

const IndicatorCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const slidePrev = () => setActiveIndex(activeIndex - 1);
  const slideNext = () => setActiveIndex(activeIndex + 1);

  return (
    <div className="indicator-carousel-wrapper">
      <AliceCarousel
        activeIndex={activeIndex}
        mouseTracking
        items={items}
        responsive={responsive}
        controlsStrategy="alternate"
        disableButtonsControls
        onSlideChanged={(e) => setActiveIndex(e.item)}
      />
      <Button
        className="btn-prev"
        onClick={slidePrev}
        icon={<LeftOutlined />}
      />
      <Button
        className="btn-next"
        onClick={slideNext}
        icon={<RightOutlined />}
      />
    </div>
  );
};

export default IndicatorCarousel;
