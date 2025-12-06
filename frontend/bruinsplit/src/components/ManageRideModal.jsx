import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './card.css';
import RideDetailsTab from './manageRideModal/RideDetailsTab';
import RidersTab from './manageRideModal/RidersTab';
import RequestsTab from './manageRideModal/RequestsTab';
import { getPendingRequests } from '../pages/api/rides';

const ManageRideModal = ({ isOpen, onClose, ride, isOwner, ownerId, membershipStatus, onJoin, onLeave }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);

  const fetchRequests = useCallback(async () => {
    if (!ride.rideId || !isOwner) return;
    try {
      const data = await getPendingRequests(ride.rideId);
      setRequests(data?.pending_requests || []);
    } catch (err) {
      console.error('Failed to load requests:', err);
    }
  }, [ride.rideId, isOwner]);

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen, fetchRequests]);

  if (!isOpen) {
    return null;
  }

  const displayTitle = ride.origin && ride.destination ? `${ride.origin} ➡ ${ride.destination}` : ride.title;

  const handleConfirmJoin = async () => {
    setJoining(true);
    setError(null);
    try {
      await onJoin();
      onClose();
    } catch (err) {
      setError(err.message || 'Error joining ride');
    } finally {
      setJoining(false);
    }
  };

  const handleConfirmLeave = async () => {
    setJoining(true);
    setError(null);
    try {
      await onLeave();
      onClose();
    } catch (err) {
      setError(err.message || 'Error leaving ride');
    } finally {
      setJoining(false);
    }
  };

  const handleRequestsUpdated = () => {
    fetchRequests();
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>

        <h2 className="modal-title">{displayTitle}</h2>

        <div className="modal-tabs">
          <button
            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
            type="button"
          >
            Ride Details
          </button>
          <button
            className={`tab-button ${activeTab === 'riders' ? 'active' : ''}`}
            onClick={() => setActiveTab('riders')}
            type="button"
          >
            Current Riders ({ride.rideDetails?.current_members || 0})
          </button>
          {isOwner && (
            <button
              className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
              type="button"
            >
              Requests ({requests.length})
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'details' && <RideDetailsTab ride={ride} />}
          {activeTab === 'riders' && <RidersTab rideId={ride.rideId} ownerId={ownerId} isOwner={isOwner} />}
          {activeTab === 'requests' && isOwner && (
            <RequestsTab
              rideId={ride.rideId}
              requests={requests}
              onRequestsUpdated={handleRequestsUpdated}
            />
          )}
        </div>
        

        {error && <p className="error">{error}</p>}

        <div className="modal-actions">
          <button
            className="btn-secondary"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          {!isOwner && (
            <button
              className="btn-primary"
              onClick={membershipStatus ? handleConfirmLeave : handleConfirmJoin}
              disabled={joining}
              type="button"
            >
              {joining ? (membershipStatus ? 'Canceling…' : 'Joining…') : (membershipStatus ? 'Cancel Request' : 'Confirm Join')}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default ManageRideModal;
