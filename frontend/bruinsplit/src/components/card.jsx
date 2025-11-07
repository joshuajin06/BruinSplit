import React from 'react';
import './card.css';

export default function Card({ title, content, image = "https://wp.dailybruin.com/images/2021/11/web.news_.globalranking2021.ND_.jpg" }) {
    return (
        <div className="card-container">
            {image && <img src={image} alt={title} className="card-image" />}
            <h2 className="card-title">{title}</h2>
            <p className="card-content">{content}</p>
            <button className="card-button">Join Ride</button>
        </div>
    );
}   