import React from "react";
import PropTypes from "prop-types";

const YouTubePlayer = ({ videoId, title, className = "" }) => {
  if (!videoId) {
    return null;
  }

  return (
    <div className={`youtube-embed-col ${className}`}>
      {title && (
        <div className="video-label-wrapper">
          <h3 className="video-label">{title}</h3>
        </div>
      )}
      <div className="youtube-player-container">
        <div className="youtube-embed-wrapper">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}`}
            title={title || "YouTube Video"}
            frameBorder="0"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
};

YouTubePlayer.propTypes = {
  videoId: PropTypes.string.isRequired,
  title: PropTypes.string,
  className: PropTypes.string,
};

export default YouTubePlayer;
