import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

import { updateProfile, updatePassword, updateProfilePic } from './api/profile.js'
import { getFriendCount, getFriends } from './api/friends.js';
import './Profile.css';


export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [friendCount, setFriendCount] = useState(null);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

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

  // Fetch friend count on component mount
  useEffect(() => {
    const fetchFriendCount = async () => {
      if (user?.id) {
        try {
          const data = await getFriendCount(user.id);
          setFriendCount(data.friend_count);
        } catch (error) {
          console.error('Failed to fetch friend count:', error);
        }
      }
    };
    fetchFriendCount();
  }, [user?.id]);

  const handleShowFriends = async () => {
    setShowFriendsModal(true);
    setLoadingFriends(true);
    try {
      const data = await getFriends();
      setFriends(data.friends || []);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

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

  const handleEditPhotoClick = () => {
    fileInputRef.current?.click();
  }

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];

    if(!file) return;

    try {
      setUploading(true);
      setPhotoError('');
      const response = await updateProfilePic(file);

      // Update user in context with the new profile data from the response
      if (response.profile) {
        updateUser(response.profile);
      }
    }
    catch(error) {
      setPhotoError(error.message || 'Failed to upload profile picture');
    }
    finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          style={{ display: 'none' }}
        />
        <div className="profile-header">
          <div className="profile-picture-section">
            <div className="profile-picture-wrapper">
              {user?.profile_photo_url ? (
                <img src={user.profile_photo_url} alt="Profile" className="profile-picture" />
              ) : (
                <div className="profile-picture-placeholder">
                  <span>{user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}</span>
                </div>
              )}
              <button
                className="profile-edit-btn"
                title="Edit profile picture"
                onClick={handleEditPhotoClick}
                disabled={uploading}
              >
                {uploading ? '⏳' : '📷'}
              </button>
            </div>
          </div>
          <h1>My Profile</h1>
          {friendCount !== null && (
            <button className="friend-count" onClick={handleShowFriends}>
              <span className="friend-count-number">{friendCount}</span>
              <span className="friend-count-label">Friend{friendCount !== 1 ? 's' : ''}</span>
            </button>
          )}
        </div>

        {showFriendsModal && (
          <>
            <div className="modal-overlay" onClick={() => setShowFriendsModal(false)} />
            <div className="friends-modal">
              <div className="friends-modal-header">
                <h2>My Friends</h2>
                <button className="close-modal-btn" onClick={() => setShowFriendsModal(false)}>✕</button>
              </div>
              <div className="friends-modal-content">
                {loadingFriends ? (
                  <p className="loading-text">Loading friends...</p>
                ) : friends.length === 0 ? (
                  <p className="no-friends-text">No friends yet</p>
                ) : (
                  <ul className="friends-list">
                    {friends.map((friend) => (
                      <li key={friend.id} className="friend-item">
                        <div className="friend-info">
                          {friend.profile_photo_url ? (
                            <img src={friend.profile_photo_url} alt={friend.first_name} className="friend-avatar" />
                          ) : (
                            <div className="friend-avatar-placeholder">
                              {friend.first_name?.charAt(0)}{friend.last_name?.charAt(0)}
                            </div>
                          )}
                          <div className="friend-details">
                            <span className="friend-name">{friend.first_name} {friend.last_name}</span>
                            <span className="friend-username">@{friend.username}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}

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
          {photoError && <div className="error-message">{photoError}</div>}
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
