import React from 'react';
import { manageRequest } from '../../pages/api/rides';

const RequestsTab = ({ rideId, requests, onRequestsUpdated }) => {
  const handleRequestAction = async (memberId, action) => {
    try {
      await manageRequest(rideId, memberId, action);
      if (onRequestsUpdated) {
        onRequestsUpdated();
      }
    } catch (err) {
      alert(`Failed to ${action} request.`);
      console.error(`Error during ${action} member:`, err);
    }
  };

  if (requests.length === 0) return <div className="riders-empty">No pending requests</div>;

  return (
    <div className="requests-list">
      {requests.map((request) => (
        <div key={request.user_id} className="request-card">
          <div className="rider-avatar">
            {request.profile?.profile_photo_url ? (
              <img src={request.profile.profile_photo_url} alt="Profile" className="navbar-profile-pic" />
            ) : (
              <div className="navbar-profile-placeholder">
                {request.profile?.first_name?.charAt(0)}
              </div>
            )}
          </div>
          <div className="rider-info">
            <strong>{request.profile?.first_name} {request.profile?.last_name}</strong>
            <div className="rider-username">@{request.profile?.username}</div>
          </div>
          <div className="request-actions">
            <button
              className="btn-approve"
              onClick={() => handleRequestAction(request.user_id, 'approve')}
            >
              Approve
            </button>
            <button
              className="btn-reject"
              onClick={() => handleRequestAction(request.user_id, 'reject')}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RequestsTab;
