import React from 'react';

const RideDetailsTab = ({ ride }) => {
  const { 
    origin, 
    destination, 
    departureDatetime, 
    platform, 
    maxRiders, 
    notes, 
    createdAt,
    rideDetails 
  } = ride;

  const departureObj = departureDatetime ? new Date(departureDatetime) : null;
  const departureDate = departureObj ? departureObj.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '/') : 'Not specified';
  const departureTime = departureObj ? departureObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Not specified';

  return (
    <div className="ride-details">
      <div className="detail-row">
        <span className="detail-label">Created by:</span>
        <span className="detail-value">{rideDetails?.driver || 'John Doe'}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Departure Date:</span>
        <span className="detail-value">{departureDate}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Departure Time:</span>
        <span className="detail-value">{departureTime}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">From:</span>
        <span className="detail-value">{origin || 'Westwood'}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">To:</span>
        <span className="detail-value">{destination || 'Downtown LA'}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Platform:</span>
        <span className="detail-value">{platform || 'Not specified'}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Max Riders:</span>
        <span className="detail-value">{maxRiders || '3'}</span>
      </div>
      {notes && (
        <div className="detail-row">
          <span className="detail-label">Notes:</span>
          <span className="detail-value">{notes}</span>
        </div>
      )}
      {createdAt && (
        <div className="detail-row">
          <span className="detail-label">Posted:</span>
          <span className="detail-value">{new Date(createdAt).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

export default RideDetailsTab;
