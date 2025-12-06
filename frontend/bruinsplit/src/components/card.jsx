import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { hashString } from './utils/cardUtils';
import { getRideById, joinRide, leaveRide, deleteRide } from '../pages/api/rides';

import MemberAvatars from './MemberAvatars';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import EditRideModal from './EditRideModal';
import ManageRideModal from './ManageRideModal';
import OwnerControls from './OwnerControls';
import RideActionButtons from './RideActionButtons';
import "./card.css";

const gradients = [
  "gradient-blue", "gradient-purple", "gradient-green",
  "gradient-orange", "gradient-pink", "gradient-red",
];

export default function Card({
  title, origin, destination, content, rideDetails, departureDatetime,
  platform, notes, maxRiders, createdAt, rideId, onJoin, ownerId,
  onDelete, onTransferOwnership, onEdit, onLeave
}) {

  const { user: currentUser } = useAuth();
  const isOwner = currentUser && ownerId && (currentUser.id === ownerId);

  const [openModal, setOpenModal] = useState(null); // null, 'edit', 'delete', 'manage'
  const [membershipStatus, setMembershipStatus] = useState(rideDetails?.membership_status || null);
  const [cardMembers, setCardMembers] = useState([]);
  
  const [actionState, setActionState] = useState({ loading: false, error: null });

  // Fetch members for the card face display
  useEffect(() => {
    const fetchCardMembers = async () => {
      if (!rideId) return;
      try {
        const data = await getRideById(rideId);
        const members = data?.ride?.members || [];
        const confirmed = members.filter(m => m.status === 'CONFIRMED JOINING' || m.status === 'JOINED');
        setCardMembers(confirmed);
      } catch (err) {
        console.debug('Could not fetch members for card', err);
      }
    };
    fetchCardMembers();
  }, [rideId]);
  
    // Update membership status from parent
  useEffect(() => {
    setMembershipStatus(rideDetails?.membership_status);
  }, [rideDetails?.membership_status]);

  const gradientClass = gradients[hashString(rideId || title) % gradients.length];
  const displayTitle = origin && destination ? `${origin} ➡ ${destination}` : title;

  const totalSeats = maxRiders || 3;
  const availableSeats = totalSeats - cardMembers.length;

  const departureObj = departureDatetime ? new Date(departureDatetime) : null;
  const formattedDatetime = departureObj ? departureObj.toLocaleString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  }) : 'Not specified';

  // --- Handlers for Actions ---
  const executeDelete = async () => {
    setActionState({ loading: true, error: null });
    try {
      await deleteRide(rideId);
      if (onDelete) onDelete(rideId);
      setOpenModal(null);
    } catch (err) {
      setActionState({ loading: false, error: err.message || 'Error deleting ride' });
    } finally {
        if (!actionState.error) {
            setActionState({ loading: false, error: null });
        }
    }
  };

  const handleJoin = async () => {
    await joinRide(rideId);
    setMembershipStatus('PENDING');
    if (onJoin) onJoin(rideId);
  };

  const handleLeave = async () => {
    await leaveRide(rideId);
    setMembershipStatus(null);
    if (onLeave) onLeave(rideId);
  };
  
  const handleEditSuccess = (editedRideId) => {
    if (onEdit) onEdit(editedRideId);
  };

  return (
    <>
      <div className={`card-container ${gradientClass}`}>
        <OwnerControls
          isOwner={isOwner}
          onEditClick={() => setOpenModal('edit')}
          onDeleteClick={() => setOpenModal('delete')}
          deleteLoading={actionState.loading && openModal === 'delete'}
        />
        <h2 className={`card-title`}>{displayTitle}</h2>
        
        <MemberAvatars members={cardMembers} />

        <p className="card-datetime">Departing at: {formattedDatetime}</p>
        <p className="card-seats">
          <span className="seats-badge">{availableSeats} of {totalSeats} seats available</span>
        </p>
        <p className="card-content">{content}</p>

        <RideActionButtons
          isOwner={isOwner}
          membershipStatus={membershipStatus}
          onDetailsClick={() => setOpenModal('manage')}
          onJoinViewClick={() => setOpenModal('manage')}
        />
      </div>

      <EditRideModal
        isOpen={openModal === 'edit'}
        onClose={() => setOpenModal(null)}
        ride={{ rideId, origin, destination, departureDatetime, platform, maxRiders, notes }}
        onEditSuccess={handleEditSuccess}
      />

      <DeleteConfirmationModal
        isOpen={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        onConfirm={executeDelete}
        isLoading={actionState.loading}
        error={actionState.error}
      />
      
      <ManageRideModal
        isOpen={openModal === 'manage'}
        onClose={() => setOpenModal(null)}
        ride={{ rideId, origin, destination, departureDatetime, platform, maxRiders, notes, createdAt, rideDetails }}
        isOwner={isOwner}
        ownerId={ownerId}
        membershipStatus={membershipStatus}
        onJoin={handleJoin}
        onLeave={handleLeave}
      />
    </>
  );
}