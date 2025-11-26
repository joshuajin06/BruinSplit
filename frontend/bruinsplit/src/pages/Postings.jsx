import React from 'react';
import './pages.css';
import Card from '../components/card.jsx';

export default function Postings() {
    return (
    <>
        <div className="page-container">
            <h1>Posts</h1>
            <div className='card-grid'> 
                <Card title="Ride Dest 1 to Dest 2" content="Yeah this is a ride"/>
                <Card title="Ride Dest 3 to Dest 4" content="This is another ride" image="https://cdn.i-scmp.com/sites/default/files/styles/1200x800/public/images/methode/2017/05/19/2b2d8790-3c6a-11e7-8ee3-761f02c18070_1280x720_204107.jpg?itok=oBUq3Omm"/>
                <Card title="Ride Dest 5 to Dest 6" content="Yet another ride"/>

          </div>
        </div>;
    </>
    );
}