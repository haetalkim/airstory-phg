import React from 'react';
import './AirStoryLogo.css';

/**
 * PHG variant: static "Air Story" wordmark. The original site animates the
 * "Story" letters in on hover; here we render the full word at all times so
 * there's no AS\u2192Air Story expansion.
 */
export default function AirStoryLogo() {
  return (
    <div className="logo-wrap" aria-label="Air Story">
      <span className="word-air">
        <span className="air-text">Air&nbsp;</span>
        <span className="story-container">
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
