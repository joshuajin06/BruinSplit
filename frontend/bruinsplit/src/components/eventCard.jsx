import React, { useState } from 'react';
import "./eventCard.css"

export default function EventCard ({title, description, location, dateTime, type}){
    return (
        <>
            <div className="card-container">
                <h2 className="title">{title}</h2>
                <p className='type'>{type}</p>
                <p className='location'>{location}</p>
                <p className='date-time'>{dateTime}</p>
                <p className="content">{description}</p>
            </div>
        </>
    );
}