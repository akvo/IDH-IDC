import React from "react";
import CaseStudy from "./CaseStudy";
import "./case-studies.scss";

const caseStudies = [
  {
    id: 1,
    title: "Income Measurement Guidance",
    image: "https://iili.io/3KaQhzB.png",
    summary:
      "Donec pulvinar eros ante, sed imperdiet quam luctus non. Nullam varius mollis erat, id aliquam dolor maximus vitae.",
    url: "#",
    published_at: "2023-10-01",
    read_time: "2 minutes",
  },
  {
    id: 2,
    title: "Procurement tool",
    image: "https://iili.io/3KaQ8dJ.png",
    summary:
      "Donec pulvinar eros ante, sed imperdiet quam luctus non. Nullam varius mollis erat, id aliquam dolor maximus vitae.",
    url: "#",
    published_at: "2023-10-02",
    read_time: "2 minutes",
  },
  {
    id: 3,
    title: "CSDDD blog post",
    image: "https://iili.io/3KaQjWP.png",
    summary:
      "Donec pulvinar eros ante, sed imperdiet quam luctus non. Nullam varius mollis erat, id aliquam dolor maximus vitae.",
    url: "#",
    published_at: "2023-10-03",
    read_time: "2 minutes",
  },
  {
    id: 4,
    title: "CSDDD blog post",
    image: "https://iili.io/3KaQjWP.png",
    summary:
      "Donec pulvinar eros ante, sed imperdiet quam luctus non. Nullam varius mollis erat, id aliquam dolor maximus vitae.",
    url: "#",
    published_at: "2023-10-03",
    read_time: "2 minutes",
  },
  {
    id: 5,
    title: "CSDDD blog post",
    image: "https://iili.io/3KaQjWP.png",
    summary:
      "Donec pulvinar eros ante, sed imperdiet quam luctus non. Nullam varius mollis erat, id aliquam dolor maximus vitae.",
    url: "#",
    published_at: "2023-10-03",
    read_time: "2 minutes",
  },
];

const CaseStudies = () => {
  return (
    <div className="case-studies">
      <h2>Case Studies</h2>
      <div className="case-studies-list">
        {caseStudies.map((study) => (
          <CaseStudy study={study} key={study.id} />
        ))}
      </div>
    </div>
  );
};

export default CaseStudies;
