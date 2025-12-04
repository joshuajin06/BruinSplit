import { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom";
import { useAuth } from '../context/AuthContext'
import "./navbar.css"; // Import the CSS file

export default function Navbar() {
  // const [loginClicked, setLoginClicked] = useState(false);
  const menuRef = useRef(null);
  const { logout, isAuthenticated, user } = useAuth();

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

      <ul className="nav-linksR">
        <li><Link to="/postings">Postings</Link></li>
        <li className="myrides"><Link to="/myrides">My Rides</Link></li>

        <li className="navButtonLogin" ref={menuRef}>
          <a className="profileButton">
            {isAuthenticated && user?.profile_photo_url ? (
              <img src={user.profile_photo_url} alt="Profile" className="navbar-profile-pic" />
            ) : isAuthenticated ? (
              <div className="navbar-profile-placeholder">
                {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
              </div>
            ) : (
              "Profile"
            )}
          </a>
            <div className="submenu">
              {isAuthenticated &&
                <Link to="/profile"
                className="submenu-item">
                  View Profile
                </Link>
              }
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