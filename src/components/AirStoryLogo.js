import React from 'react';
import './AirStoryLogo.css';

export default function AirStoryLogo() {
  return (
    <div className="logo-wrap" aria-label="Air Story">
      <span className="word-air">
        <span className="air-text">Air</span>
        <span className="story-container" aria-hidden="true">
          <span className="story-letter s1">S</span>
          <span className="story-letter s2">t</span>
          <span className="story-letter s3">o</span>
          <span className="story-letter s4">r</span>
          <span className="story-letter s5">y</span>
        </span>
      </span>
    </div>
  );
}

