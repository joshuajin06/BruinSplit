import React from 'react';

const RideActionButtons = ({ isOwner, membershipStatus, onDetailsClick, onJoinViewClick }) => {
  const getJoinButtonText = () => {
    if (isOwner) {
      return 'View Ride';
    }
    switch (membershipStatus) {
      case 'CONFIRMED JOINING':
        return 'Joined';
      case 'PENDING':
        return 'Pending';
      default:
        return 'Join Ride';
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <button className="card-button-details" onClick={onDetailsClick} type="button" style={{ flex: '1', minWidth: '100px' }}>
        Details
      </button>
      <button className="card-button-join" onClick={onJoinViewClick} type="button" style={{ flex: '1', minWidth: '100px' }}>
        {getJoinButtonText()}
      </button>
    </div>
  );
};

export default RideActionButtons;