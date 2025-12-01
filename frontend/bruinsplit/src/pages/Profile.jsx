import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

import { updateProfile, updatePassword, getProfileById } from './api/profile.js';
import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [viewingUser, setViewingUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState('');

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

  // Update formData when user changes
  useEffect(() => {
    if (user && !userId) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || ''
      });
    }
  }, [user, userId]);

  // Load other user's profile if userId is provided
  useEffect(() => {
    if (userId && userId !== user?.id) {
      loadUserProfile(userId);
    }
  }, [userId, user]);

  async function loadUserProfile(id) {
    setLoadingProfile(true);
    setError('');
    try {
      const profileData = await getProfileById(id);
      setViewingUser(profileData);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoadingProfile(false);
    }
  }

  // Determine which user to display
  const displayUser = userId && userId !== user?.id ? viewingUser : user;
  const isOwnProfile = !userId || userId === user?.id;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleInputChange = (e) => {
    setError('');
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
      setError('');
      
      if (!isOwnProfile) {
        setError('You can only edit your own profile');
        return;
      }
      
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
        console.log('Password Updated Successfully:', updatedPassword);
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        })
      }
    }
    catch (error) {
      console.error("Failed to update profile: ", error);
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
    setError('');
  };

  // Show loading state when fetching another user's profile
  if (loadingProfile) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p>Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>{isOwnProfile ? 'My Profile' : `${displayUser.username || displayUser.first_name || 'User'}'s Profile`}</h1>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <h2>Personal Information</h2>
            <div className="profile-grid">
              <div className="profile-field">
                <label>First Name</label>
                {isOwnProfile && isEditing ? (
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="First Name"
                  />
                ) : (
                  <p>{displayUser.first_name || 'Not provided'}</p>
                )}
              </div>

              <div className="profile-field">
                <label>Last Name</label>
                {isOwnProfile && isEditing ? (
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Last Name"
                  />
                ) : (
                  <p>{displayUser.last_name || 'Not provided'}</p>
                )}
              </div>

              <div className="profile-field">
                <label>Username</label>
                {isOwnProfile && isEditing ? (
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Username"
                  />
                ) : (
                  <p>{displayUser.username || 'Not provided'}</p>
                )}
              </div>

              <div className="profile-field">
                <label>Email</label>
                <p>{displayUser.email}</p>
              </div>

              {displayUser.phone_number && (
                <div className="profile-field">
                  <label>Phone Number</label>
                  <p>{displayUser.phone_number}</p>
                </div>
              )}

              {/* Only show password change for own profile */}
              {isOwnProfile && isChangingPassword && (
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

              {displayUser.created_at && (
                <div className="profile-field">
                  <label>Member Since</label>
                  <p>{new Date(displayUser.created_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
          <div className="error-message">{error}</div>

          {/* Only show edit buttons for own profile */}
          {isOwnProfile && (
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
          )}
          
          {isOwnProfile && (
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
}