import React from "react";
import { Link } from "react-router-dom";
import "./navbar.css"; // Import the CSS file

export default function Navbar() {
  return (
    <nav className="navbar">
      <h2 className="siteTitle"><Link to="/">BruinSplit</Link></h2> 
      <ul className="nav-links">
        <li><Link to="/postings">Postings</Link></li>
        <li><Link to="/events">Events</Link></li>
        <li><Link to="/myrides">My Rides</Link></li>
        <li><Link to="/login">Login</Link></li>
      </ul>
    </nav>
  );
}   