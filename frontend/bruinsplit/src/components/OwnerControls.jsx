import React from 'react';

const OwnerControls = ({ isOwner, onEditClick, onDeleteClick, deleteLoading }) => {
  if (!isOwner) {
    return null;
  }

  return (
    <div className='owner-utilities'>
      <button className='deleteButton' onClick={onDeleteClick} type="button" title="Delete Ride">
          {deleteLoading ? '...' : 'x'}
      </button>
      <button className='editButton' type='button' onClick={onEditClick}>edit</button>
    </div>
  );
};

export default OwnerControls;