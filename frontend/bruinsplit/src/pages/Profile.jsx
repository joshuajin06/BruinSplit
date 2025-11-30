import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>My Profile</h1>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <h2>Personal Information</h2>
            <div className="profile-grid">
              <div className="profile-field">
                <label>First Name</label>
                <p>{user.first_name || 'Not provided'}</p>
              </div>

              <div className="profile-field">
                <label>Last Name</label>
                <p>{user.last_name || 'Not provided'}</p>
              </div>

              <div className="profile-field">
                <label>Username</label>
                <p>{user.username}</p>
              </div>

              <div className="profile-field">
                <label>Email</label>
                <p>{user.email}</p>
              </div>

              {user.created_at && (
                <div className="profile-field">
                  <label>Member Since</label>
                  <p>{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
