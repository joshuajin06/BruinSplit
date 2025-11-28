import React, { useState } from 'react';
import "./eventCard.css"

export default function EventCard ({title, description, location, dateTime, type, eventId, createdBy, currentUserId, onDelete}){
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Delete only allowed if current user is the creator
    const handleDelete = async(e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try{
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete event');
            }
            if (onDelete) onDelete(eventId);
        }
        catch (err){
            setError(err.message || 'Error deleting event');
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className="card-container">
                {currentUserId && createdBy && currentUserId === createdBy ? (
                    <button className='card-delete' onClick={handleDelete} disabled={loading}>{loading ? '...' : 'x'}</button>
                ) : null}
                <h2 className="title">{title}</h2>
                <p className='type'>{type}</p>
                <p className='location'>{location}</p>
                <p className='date-time'>{dateTime}</p>
                <p className="content">{description}</p>
            </div>
        </>
    );
}