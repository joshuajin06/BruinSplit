import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { updateProfile } from './api/profile.js'
import './Profile.css';


export default function Profile() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    username: user?.username || ''
  });
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // TODO: Send updated data to backend
    console.log('Saving:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      username: user?.username || ''
    });
    setIsEditing(false);
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
                {isEditing ? (
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="First Name"
                  />
                ) : (
                  <p>{formData.first_name || 'Not provided'}</p>
                )}
              </div>

              <div className="profile-field">
                <label>Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Last Name"
                  />
                ) : (
                  <p>{formData.last_name || 'Not provided'}</p>
                )}
              </div>

              <div className="profile-field">
                <label>Username</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Username"
                  />
                ) : (
                  <p>{formData.username || 'Not provided'}</p>
                )}
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
            {isEditing ? (
              <>
                <button className="btn-save" onClick={handleSave}>
                  Save Changes
                </button>
                <button className="btn-cancel" onClick={handleCancel}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button className="btn-edit" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
                <button className="btn-logout" onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
