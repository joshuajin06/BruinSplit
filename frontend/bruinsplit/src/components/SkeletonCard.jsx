import React from 'react';
import './SkeletonCard.css';

const SkeletonCard = ({ index = 0 }) => {
  // Calculate stagger delay based on index (0.1s per card)
  const animationDelay = `${index * 0.1}s`;

  return (
    <div className="skeleton-card" style={{ '--skeleton-delay': animationDelay }}>
      <div className="skeleton-header"></div>
      <div className="skeleton-content">
        <div className="skeleton-line" style={{ width: '80%' }}></div>
        <div className="skeleton-line" style={{ width: '60%' }}></div>
        <div className="skeleton-line" style={{ width: '90%' }}></div>
        <div className="skeleton-buttons">
          <div className="skeleton-button"></div>
          <div className="skeleton-button"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;