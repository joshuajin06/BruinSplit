"use client"

import "./Home.css"
import { useState, useEffect } from "react"
import { useNavigate } from 'react-router-dom';
import driving1 from '../assets/final.png';

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate('/postings');
  };

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null;

  return (
    <div className="page-container">
      {/* Main Section */}
      <div className="main-section">
        <div className="content-wrapper">
          <h1 className="main-heading">
            Split rides. <br />
            <span>Save money.</span>
          </h1>
          <p className="sub-heading">
            The easiest way for UCLA students to share rides to LAX, concerts, and home. Verified, safe, and simple.
          </p>

          <div className="search-box">
            <input 
              type="text" 
              placeholder="Where are you heading?" 
              className="search-input" 
            />
            <button className="btn-search" onClick={handleNavigation}>Search</button>
          </div>
          <p className="search-hint">Trending: Wherever your heart desires</p>
        </div>

        <div className="visual-container">
          <div className="image-card">
            <img 
               src={driving1}
               alt="Driving" 
            />
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="features-section">
        <div className="section-header">
          <h2>How it works</h2>
          <p>Seamless ride sharing designed for students.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <h3>Search</h3>
            <p>Enter your destination and find other students heading the same way.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3>Connect</h3>
            <p>Chat with verified students and coordinate pickup details securely.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </div>
            <h3>Split</h3>
            <p>Save your change, split the cost.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="cta-banner">
          <h2>Ready to go?</h2>
          <p>Join the community today.</p>
          <button className="btn-large" onClick={handleNavigation}>Get Started</button>
        </div>
      </section>
    </div>
  )
}