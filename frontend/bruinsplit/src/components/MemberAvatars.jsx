import React from 'react';

const MemberAvatars = ({ members }) => {
  if (!members || members.length === 0) {
    return null;
  }

  return (
    <div className="card-members">
      <div className="member-avatars">
        {members.slice(0, 4).map((member) => {
          const profile = member.profile || {};
          const fullName = profile.first_name && profile.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile.username || 'Unknown User';

          return (
            <div
              key={member.id || member.user_id}
              className="member-avatar-small"
              title={fullName}
            >
              {profile?.profile_photo_url ? (
                <img src={profile.profile_photo_url} alt="Profile" className="navbar-profile-pic" />
              ) : (
                <div className="navbar-profile-placeholder">
                  {profile?.first_name?.charAt(0)}
                </div>
              )}
            </div>
          );
        })}
        {members.length > 4 && (
          <div className="member-avatar-small member-avatar-more" title={`+${members.length - 4} more`}>
            +{members.length - 4}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberAvatars;
