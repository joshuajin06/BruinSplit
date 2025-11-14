import { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom";
import "./navbar.css"; // Import the CSS file

export default function Navbar() {
  const [loginClicked, setLoginClicked] = useState(false);
  const menuRef = useRef(null);

  //written with the aid of claude ai
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setLoginMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <h2 className="siteTitle"><Link to="/">BruinSplit</Link></h2> 
      <ul className="nav-linksC">
        <li><Link to="/postings">Postings</Link></li>
        <li><Link to="/events">Events</Link></li>
      </ul>
      <ul className="nav-linksR" ref={menuRef}>
        <li className="myrides"><Link to="/myrides">My Rides</Link></li>

        <li className="navButtonLogin">
          <button className="profileButton" onClick={() => setLoginClicked(!loginClicked)}>Profile</button>
        
          {loginClicked && (
              <div className="submenu">
                <Link to="/login" className="submenu-item">Sign In</Link>
              </div>
            )}
        </li>



      </ul>
    </nav>
  );
}   