import React from 'react';
import './card.css';

export default function Card({ title, content }) {
    return (
        <div className="card-container">
            <h2 className="card-title">{title}</h2>
            <p className="card-content">{content}</p>
        </div>
    );
}   