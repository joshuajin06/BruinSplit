import React from "react";
import { Link } from "react-router-dom";
import "./navbar.css"; // Import the CSS file

export default function Navbar() {
  return (
    <nav className="navbar">
      <h2>BruinSplit</h2>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/contact">Contact</Link></li>
      </ul>
    </nav>
  );
} 