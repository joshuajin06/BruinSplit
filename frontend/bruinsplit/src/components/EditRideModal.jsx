import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { updateRide } from '../pages/api/rides';
import { formatDatetimeLocal } from './utils/cardUtils';
import './card.css';

const EditRideModal = ({ isOpen, onClose, ride, onEditSuccess }) => {
  const [form, setForm] = useState({
    origin_text: '',
    destination_text: '',
    depart_at: '',
    platform: 'LYFT',
    max_seats: 2,
    notes: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ride) {
      setForm({
        origin_text: ride.origin || '',
        destination_text: ride.destination || '',
        depart_at: formatDatetimeLocal(ride.departureDatetime) || '',
        platform: ride.platform || 'LYFT',
        max_seats: ride.maxRiders || 2,
        notes: ride.notes || ''
      });
    }
  }, [ride]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updateRide(ride.rideId, form);
      if (onEditSuccess) {
        onEditSuccess(ride.rideId);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update ride.');
      console.error("Edit ride error:", err);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <section className="ride-form" onClick={onClose}>
      <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
          type="button"
        >
          ×
        </button>
        <h2>Edit Ride</h2>
        {error && <p className="error">{error}</p>}

        <label>
          Origin
          <input name="origin_text" value={form.origin_text} onChange={handleChange} />
        </label>

        <label>
          Destination
          <input name="destination_text" value={form.destination_text} onChange={handleChange} />
        </label>

        <label>
          Departure
          <input name="depart_at" type="datetime-local" value={form.depart_at} onChange={handleChange} />
        </label>

        <label>
          Platform
          <select name="platform" value={form.platform} onChange={handleChange}>
            <option>LYFT</option>
            <option>UBER</option>
            <option>WAYMO</option>
            <option>OTHER</option>
          </select>
        </label>

        <label>
          Max Seats
          <input name="max_seats" type="number" min="2" max="6" value={form.max_seats} onChange={handleChange} />
        </label>

        <label>
          Notes
          <textarea name="notes" value={form.notes} onChange={handleChange} />
        </label>

        <div className="form-actions">
          <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </section>,
    document.getElementById('modal-root')
  );
};

export default EditRideModal;
