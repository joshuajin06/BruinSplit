import React from 'react';
import './SkeletonCard.css';

const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
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