import React, { useState } from 'react';
import "./card.css"

const DEFAULT_RIDE_IMAGE = "https://wp.dailybruin.com/images/2021/11/web.news_.globalranking2021.ND_.jpg";

export default function Card({ title, content, image, rideDetails }) {
    const [showModal, setShowModal] = useState(false);

    const handleJoinClick = () => {
        setShowModal(true);
    };

    const handleConfirmJoin = () => {
        // Here you would call your API to join the ride
        alert(`Successfully joined: ${title}`);
        setShowModal(false);
    };

    return (
        <>
            <div className="card-container">
                <img  src={image || DEFAULT_RIDE_IMAGE}  alt={title} className="card-image" />
                <h2 className="card-title">{title}</h2>
                <p className="card-content">{content}</p>
                <button 
                    className="card-button" 
                    onClick={handleJoinClick}
                    type="button">
                    Join Ride
                </button>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button 
                            className="modal-close" 
                            onClick={() => setShowModal(false)}
                            aria-label="Close modal"
                        >
                            ×
                        </button>
                        
                        <h2 className="modal-title">{title}</h2>
                        
                        <div className="ride-details">
                            <div className="detail-row">
                                <span className="detail-label">Driver:</span>
                                <span className="detail-value">{rideDetails?.driver || 'John Doe'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Departure:</span>
                                <span className="detail-value">{rideDetails?.departure || '8:00 AM'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">From:</span>
                                <span className="detail-value">{rideDetails?.from || 'Westwood'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">To:</span>
                                <span className="detail-value">{rideDetails?.to || 'Downtown LA'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Seats Available:</span>
                                <span className="detail-value">{rideDetails?.seats || '3'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Price:</span>
                                <span className="detail-value">{rideDetails?.price || '$10'}</span>
                            </div>
                        </div>

                        <p className="modal-description">{content}</p>

                        <div className="modal-actions">
                            <button 
                                className="btn-secondary" 
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-primary" 
                                onClick={handleConfirmJoin}
                            >
                                Confirm Join
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}