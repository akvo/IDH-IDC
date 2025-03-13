import React from "react";
import { Image, Carousel } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { CIIContent } from "./static";

const IndicatorCarousel = () => {
  const settings = {
    autoplay: true,
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 6,
    slidesToScroll: 1,
    arrows: true,
    nextArrow: <RightOutlined />,
    prevArrow: <LeftOutlined />,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 5,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <Carousel {...settings} className="indicator-carousel-wrapper">
      {CIIContent.indicatorContent.map((item, i) => (
        <div
          key={`${item.icon}-${i}`}
          className="indicator-item"
          data-value={i}
        >
          <Image src={item.icon} preview={false} height={52} />
          <p>{item.title}</p>
        </div>
      ))}
    </Carousel>
  );
};

export default IndicatorCarousel;
