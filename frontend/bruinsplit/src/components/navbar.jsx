import { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom";
import { useAuth } from '../context/AuthContext'
import "./navbar.css"; // Import the CSS file

export default function Navbar() {
  // const [loginClicked, setLoginClicked] = useState(false);
  const menuRef = useRef(null);
  const { logout, isAuthenticated } = useAuth();

  //  useEffect(() => {
  //   function handleClickOutside(e) {
  //     if (menuRef.current && !menuRef.current.contains(e.target)) {
  //       setLoginClicked(false);
  //     }
  //   }

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => document.removeEventListener("mousedown", handleClickOutside);
  // }, []);

  return (
    <nav className="navbar">
      <h2 className="siteTitle"><Link to="/">BruinSplit</Link></h2> 

      <ul className="nav-linksC">
        <li><Link to="/postings">Posts</Link></li>
        <a>|</a>
        <li><Link to="/events">Events</Link></li>
      </ul>

      <ul className="nav-linksR">
        <li className="myrides"><Link to="/myrides">My Rides</Link></li>

        <li className="navButtonLogin" ref={menuRef}>
          <a className="profileButton">Profile</a>
            <div className="submenu">
              <Link to="/login" 
                className="submenu-item" 
                onClick={() => {
                  if(isAuthenticated) logout();
                }}>
                {isAuthenticated ? "Logout" : "Sign In"}
              </Link>
            </div>
        </li>
      </ul>
    </nav>
  );
}   