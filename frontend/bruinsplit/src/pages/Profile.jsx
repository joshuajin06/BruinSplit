import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import Card from '../components/card.jsx'; // Import the Card component

import { updateProfile, updatePassword, updateProfilePic, getProfileById } from './api/profile.js';
import { getFriendCount, getFriends, getPendingRequests, acceptFriendRequest, rejectFriendRequest, getFriendRides, sendFriendRequest, getUserFriends } from './api/friends.js';
import './Profile.css';


export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [friendCount, setFriendCount] = useState(null);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [pendingRequests, setPendingRequests] = useState({ sent: [], received: [] });
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingRequest, setProcessingRequest] = useState({});
  const [joinedRides, setJoinedRides] = useState([]);

  const [friendshipStatus, setFriendshipStatus] = useState(null); // 'friends', 'pending', 'not_friends'

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const isOwnProfile = !userId || (user && userId === user.id);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setError('');
                setProfile(null);
                setJoinedRides([]);
                setFriendshipStatus(null);
                const targetId = userId || user?.id;
                if (!targetId) return;

                let profileData;
                if (userId) {
                    try {
                        profileData = await getProfileById(userId);
                    } catch (error) {
                        console.error('Failed to fetch profile by ID:', error);
                        setError('Failed to fetch profile data. Please try again later.');
                        return;
                    }
                } else {
                    profileData = user;
                }

                if (!profileData) {
                    setError('Profile not found.');
                    return;
                }

                setProfile(profileData);
                setFormData({
                    first_name: profileData?.first_name || '',
                    last_name: profileData?.last_name || '',
                    username: profileData?.username || ''
                });

                try {
                    const friendCountData = await getFriendCount(targetId);
                    setFriendCount(friendCountData.friend_count);
                } catch (error) {
                    console.error('Failed to fetch friend count:', error);
                    setError('Failed to fetch friend count. Please try again later.');
                }

                try {
                    const ridesData = await getFriendRides(targetId);
                    setJoinedRides(ridesData.rides || []);
                } catch (error) {
                    console.error('Failed to fetch friend rides:', error);
                    setError('Failed to fetch friend rides. Please try again later.');
                }

                // If viewing another user's profile, determine friendship status
                if (userId && user.id !== userId) {
                    try {
                        const [myFriendsData, myPendingData] = await Promise.all([
                            getFriends(),
                            getPendingRequests()
                        ]);

                        const isFriend = (myFriendsData.friends || []).some(f => f.id === userId);
                        const isRequestSent = (myPendingData.sent || []).some(r => r.id === userId);

                        if (isFriend) setFriendshipStatus('friends');
                        else if (isRequestSent) setFriendshipStatus('pending');
                        else setFriendshipStatus('not_friends');

                    } catch (error) {
                        console.error("Failed to determine friendship status:", error);
                    }
                }
            } catch (error) {
                console.error('An unexpected error occurred:', error);
                setError('An unexpected error occurred. Please try again later.');
            }
        };

    if (user) {
        fetchProfileData();
    }
  }, [userId, user]);

  const handleSendFriendRequest = async () => {
    if (!userId) return;
    try {
        await sendFriendRequest(userId);
        setFriendshipStatus('pending'); // Optimistically update UI
    } catch (error) {
        console.error("Failed to send friend request:", error);
        alert(error.message || "Could not send friend request.");
    }
  };

  const handleShowFriends = async () => {
    setShowFriendsModal(true);
    setLoadingFriends(true);
    try {
      const data = isOwnProfile ? await getFriends() : await getUserFriends(userId);
      setFriends(data.friends || []);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleShowRequests = async () => {
    setShowRequestsModal(true);
    setLoadingRequests(true);
    try {
      const data = await getPendingRequests();
      setPendingRequests({
        sent: data.sent || [],
        received: data.received || []
      });
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleAcceptRequest = async (requesterId) => {
    setProcessingRequest(prev => ({ ...prev, [requesterId]: true }));
    try {
      await acceptFriendRequest(requesterId);
      // Refresh pending requests
      const data = await getPendingRequests();
      setPendingRequests({
        sent: data.sent || [],
        received: data.received || []
      });
      // Refresh friend count
      const countData = await getFriendCount(user.id);
      setFriendCount(countData.friend_count);
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      alert('Failed to accept friend request');
    } finally {
      setProcessingRequest(prev => ({ ...prev, [requesterId]: false }));
    }
  };

  const handleRejectRequest = async (requesterId) => {
    setProcessingRequest(prev => ({ ...prev, [requesterId]: true }));
    try {
      await rejectFriendRequest(requesterId);
      // Refresh pending requests
      const data = await getPendingRequests();
      setPendingRequests({
        sent: data.sent || [],
        received: data.received || []
      });
    } catch (error) {
      console.error('Failed to reject friend request:', error);
      alert('Failed to reject friend request');
    } finally {
      setProcessingRequest(prev => ({ ...prev, [requesterId]: false }));
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
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      username: profile?.username || ''
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

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '2rem', padding: '2rem' }}>
      <div className="profile-card">
        {isOwnProfile && <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          style={{ display: 'none' }}
        />}
        <div className="profile-header">
          <div className="profile-picture-section">
            <div className="profile-picture-wrapper">
              {profile?.profile_photo_url ? (
                <img src={profile.profile_photo_url} alt="Profile" className="profile-picture" />
              ) : (
                <div className="profile-picture-placeholder">
                  <span>{profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}</span>
                </div>
              )}
              {isOwnProfile && <button
                className="profile-edit-btn"
                title="Edit profile picture"
                onClick={handleEditPhotoClick}
                disabled={uploading}
              >
                {uploading ? '⏳' : '📷'}
              </button>}
            </div>
          </div>
          <h1>{isOwnProfile ? "My Profile" : `${profile.first_name}'s Profile`}</h1>
          <div className="profile-stats">
            {friendCount !== null && (
              <button className="friend-count" onClick={handleShowFriends}>
                <span className="friend-count-number">{friendCount}</span>
                <span className="friend-count-label">Friend{friendCount !== 1 ? 's' : ''}</span>
              </button>
            )}
            {isOwnProfile && <button className="requests-btn" onClick={handleShowRequests}>
              <span className="requests-icon">👥</span>
              <span className="requests-label">Requests</span>
            </button>}
            {!isOwnProfile && friendshipStatus === 'not_friends' && (
                <button className="btn-edit" onClick={handleSendFriendRequest}>
                    Send Friend Request
                </button>
            )}
            {!isOwnProfile && friendshipStatus === 'pending' && (
                <button className="btn-change-password pending" disabled>
                    Request Sent
                </button>
            )}
          </div>
        </div>

        {showFriendsModal && (
          <>
            <div className="modal-overlay" onClick={() => setShowFriendsModal(false)} />
            <div className="friends-modal">
              <div className="friends-modal-header">
                <h2>{isOwnProfile ? "My Friends" : `${profile.first_name}'s Friends`}</h2>
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
                        <Link to={`/profile/${friend.id}`} className="friend-info-link" onClick={() => setShowFriendsModal(false)}>
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
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}

        {isOwnProfile && showRequestsModal && (
          <>
            <div className="modal-overlay" onClick={() => setShowRequestsModal(false)} />
            <div className="friends-modal">
              <div className="friends-modal-header">
                <h2>Friend Requests</h2>
                <button className="close-modal-btn" onClick={() => setShowRequestsModal(false)}>✕</button>
              </div>
              <div className="friends-modal-content">
                {loadingRequests ? (
                  <p className="loading-text">Loading requests...</p>
                ) : (
                  <>
                    <div className="requests-section">
                      <h3 style={{ color: '#333', marginBottom: '15px' }}>Received ({pendingRequests.received.length})</h3>
                      {pendingRequests.received.length === 0 ? (
                        <p className="no-friends-text">No pending requests</p>
                      ) : (
                        <ul className="friends-list">
                          {pendingRequests.received.map((request) => (
                            <li key={request.id} className="friend-item">
                              <div className="friend-info">
                                {request.profile_photo_url ? (
                                  <img src={request.profile_photo_url} alt={request.first_name} className="friend-avatar" />
                                ) : (
                                  <div className="friend-avatar-placeholder">
                                    {request.first_name?.charAt(0)}{request.last_name?.charAt(0)}
                                  </div>
                                )}
                                <div className="friend-details">
                                  <span className="friend-name">{request.first_name} {request.last_name}</span>
                                  <span className="friend-username">@{request.username}</span>
                                </div>
                              </div>
                              <div className="request-actions">
                                <button
                                  className="accept-btn"
                                  onClick={() => handleAcceptRequest(request.id)}
                                  disabled={processingRequest[request.id]}
                                >
                                  {processingRequest[request.id] ? '...' : '✓'}
                                </button>
                                <button
                                  className="reject-btn"
                                  onClick={() => handleRejectRequest(request.id)}
                                  disabled={processingRequest[request.id]}
                                >
                                  {processingRequest[request.id] ? '...' : '✕'}
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="requests-section" style={{ marginTop: '30px' }}>
                      <h3 style={{ color: '#333', marginBottom: '15px' }}>Sent ({pendingRequests.sent.length})</h3>
                      {pendingRequests.sent.length === 0 ? (
                        <p className="no-friends-text">No pending requests</p>
                      ) : (
                        <ul className="friends-list">
                          {pendingRequests.sent.map((request) => {
                            const firstName = request.first_name || '';
                            const lastName = request.last_name || '';
                            const username = request.username || 'Unknown';
                            const initials = `${firstName.charAt(0) || '?'}${lastName.charAt(0) || '?'}`;

                            return (
                              <li key={request.id} className="friend-item">
                                <div className="friend-info">
                                  {request.profile_photo_url ? (
                                    <img src={request.profile_photo_url} alt={firstName} className="friend-avatar" />
                                  ) : (
                                    <div className="friend-avatar-placeholder">
                                      {initials}
                                    </div>
                                  )}
                                  <div className="friend-details">
                                    <span className="friend-name">
                                      {firstName && lastName ? `${firstName} ${lastName}` : username}
                                    </span>
                                    <span className="friend-username">@{username}</span>
                                    <span className="pending-label">Pending</span>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </>
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
                {isEditing && isOwnProfile ? (
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
                {isEditing && isOwnProfile ? (
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
                {isEditing && isOwnProfile ? (
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
                <p>{profile.email}</p>
              </div>

              {isChangingPassword && isOwnProfile && (
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

              {profile.created_at && (
                <div className="profile-field">
                  <label>Member Since</label>
                  <p>{new Date(profile.created_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
          {photoError && <div className="error-message">{photoError}</div>}
          {error && <div className="error-message">{error}</div>}

          {isOwnProfile && <div className="profile-actions">
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
          </div>}
          {isOwnProfile && <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>}
        </div>
      </div>
      {!isOwnProfile && <div className="profile-rides-sidebar">
          <h3>Joined Rides</h3>
          <div className="rides-list">
              {joinedRides.length > 0 ? (
                  joinedRides.map(ride => (
                      <Card
                          key={ride.id}
                          rideId={ride.id}
                          title={`${ride.origin_text} ➡ ${ride.destination_text}`}
                          origin={ride.origin_text}
                          destination={ride.destination_text}
                          departureDatetime={ride.depart_at}
                          platform={ride.platform}
                          notes={ride.notes}
                          maxRiders={ride.max_seats}
                          createdAt={ride.created_at}
                          ownerId={ride.owner_id}
                          rideDetails={ride}
                          // Since this is for display on a friend's profile, we likely don't want
                          // interactive buttons like Join/Edit/Delete. We can omit the onJoin,
                          // onDelete, onTransferOwnership, onEdit, onLeave props, or pass no-op functions.
                          // The Card component will conditionally render owner-specific buttons anyway.
                      />
                  ))
              ) : (
                  <p>No joined rides to show.</p>
              )}
          </div>
      </div>}
    </div>
  );
}