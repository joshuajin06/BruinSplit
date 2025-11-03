import React from 'react';
import './pages.css';
import Card from '../components/card.jsx';

export default function Home() {  
  return (
    <>
        <div className="page-container">
          <div className='content-wrap'>
          <h1>Welcome to BruinSplit!</h1>
          <div> 
            <Card title="Ride Dest 1 to Dest 2" content="Yeah this is a ride"/>
            <Card title="Ride Dest 3 to Dest 4" content="This is another ride"/>
          </div>
          </div>
        </div>
    </>
  );
} 