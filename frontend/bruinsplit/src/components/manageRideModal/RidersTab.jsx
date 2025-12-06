import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRideById, kickMember, transferOwnership } from '../../pages/api/rides';
import { getTimeAgo } from '../utils/cardUtils';

const RidersTab = ({ rideId, ownerId, isOwner }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchRiders = useCallback(async () => {
    if (!rideId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getRideById(rideId);
      const confirmedMembers = (data?.ride?.members || []).filter(m => m.status === 'CONFIRMED JOINING' || m.status === 'JOINED');
      setMembers(confirmedMembers);
    } catch (err) {
      setError(err.message || 'Failed to load riders.');
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  const handleKickMember = async (memberId) => {
    try {
      await kickMember(rideId, memberId);
      fetchRiders(); // Refresh list
    } catch (err) {
      alert('Failed to kick member.');
      console.error("Kick error:", err);
    }
  };

  const handleTransferOwnership = async (newOwnerId) => {
    if (!window.confirm('Are you sure you want to transfer ownership? This cannot be undone.')) return;
    try {
      await transferOwnership(rideId, newOwnerId);
      fetchRiders(); // Refresh list
      // You might want to pass an onOwnershipChange callback up to the parent if the ownerId needs to be updated there
    } catch (err) {
      alert('Failed to transfer ownership.');
      console.error("Transfer ownership error:", err);
    }
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) return <div className="riders-loading">Loading riders...</div>;
  if (error) return <div className="riders-error">{error}</div>;
  if (members.length === 0) return <div className="riders-empty">No confirmed riders yet</div>;

  return (
    <div className="riders-list">
      {members.map((rider) => {
        const profile = rider.profile || {};
        const fullName = profile.first_name && profile.last_name
          ? `${profile.first_name} ${profile.last_name}`
          : profile.username || 'Unknown User';
        const isRiderOwner = rider.user_id === ownerId;

        return (
          <div key={rider.id} className="rider-card">
            <div className="rider-avatar">
              {profile?.profile_photo_url ? (
                <img src={profile.profile_photo_url} alt="Profile" className="navbar-profile-pic" />
              ) : (
                <div className="navbar-profile-placeholder">
                  {profile?.first_name?.charAt(0)}
                </div>
              )}
            </div>
            <div className="rider-info">
              <div className="rider-name">
                <a href="#" onClick={(e) => { e.preventDefault(); handleViewProfile(rider.user_id); }}>
                  {fullName}
                </a>
                {isRiderOwner && <span className="owner-badge">Owner</span>}
              </div>
              {profile.username && <div className="rider-username">@{profile.username}</div>}
              <div className="rider-joined">Joined {getTimeAgo(new Date(rider.joined_at))}</div>
            </div>
            {isOwner && !isRiderOwner && (
              <div className='ride-member-options'>
                <button className='kickButton' onClick={() => handleKickMember(rider.user_id)}>Kick</button>
                <button className='makeOwner' onClick={() => handleTransferOwnership(rider.user_id)}>Make Owner</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RidersTab;
