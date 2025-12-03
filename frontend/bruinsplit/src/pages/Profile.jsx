import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { updateProfile, updatePassword } from './api/profile.js'
import './Profile.css';
import { is } from 'zod/locales';


export default function Profile() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    username: user?.username || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleInputChange = (e) => {
    setError(null);
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

    const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    try {
      e.preventDefault();
      setError(null);
      // TODO: Send updated data to backend
      if(isEditing) {
        const updatedProfile = await updateProfile(formData);
        console.log('Profile Updated Successfully:', updatedProfile);
        setIsEditing(false);
      }
      else if(isChangingPassword) {
        if(passwordData.newPassword !== passwordData.confirmNewPassword) {
          setError("New passwords do not match");
          return;
        }
        const updatedPassword = await updatePassword(passwordData);
        console.log('Profile Updated Successfully:', updatedPassword);
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        })
      }
    }
    catch (error) {
      console.error("Failed to updated profile: ", error);
      setError(error.message);
    } 
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      username: user?.username || ''
    });
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    })
    setIsEditing(false);
    setIsChangingPassword(false);
    setError(null);
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
          <div className="profile-picture-section">
            {user?.profile_photo_url ? (
              <img src={user.profile_photo_url} alt="Profile" className="profile-picture" />
            ) : (
              <div className="profile-picture-placeholder">
                <span>{user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}</span>
              </div>
            )}
          </div>
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

              {isChangingPassword && (
                <>
                  <div className="profile-field">
                    <label>Old Password</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordInputChange}
                        placeholder="Old Password"
                      />
                  </div>

                  <div className="profile-field">
                    <label>New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordInputChange}
                        placeholder="New Password"
                      />
                  </div>
                  <div className="profile-field">
                    <label>Confirm New Password</label>
                      <input
                        type="password"
                        name="confirmNewPassword"
                        value={passwordData.confirmNewPassword}
                        onChange={handlePasswordInputChange}
                        placeholder="Confirm new Password"
                      />
                  </div>
                </>
              )}

              {user.created_at && (
                <div className="profile-field">
                  <label>Member Since</label>
                  <p>{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
          <div className="error-message">{error}</div>

          <div className="profile-actions">
            {(isEditing || isChangingPassword) ? (
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
                <button className="btn-change-password" onClick={() => {
                  setIsChangingPassword(true);
                }}>
                  Change Password
                </button>
              </>
            )}
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
