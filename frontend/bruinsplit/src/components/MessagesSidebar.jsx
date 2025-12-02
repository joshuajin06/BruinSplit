import { useState } from 'react';
import './MessagesSidebar.css';

export default function MessagesSidebar({ isOpen, onClose }) {
  const [selectedConversation, setSelectedConversation] = useState(null);

  // User data
  const users = {
    'user-1': { id: 'user-1', name: 'John Doe', username: 'johndoe' },
    'user-2': { id: 'user-2', name: 'Jane Smith', username: 'janesmith' },
    'user-3': { id: 'user-3', name: 'Mike Johnson', username: 'mikejohnson' },
    'current-user': { id: 'current-user', name: 'You', username: 'currentuser' }
  };

  // Ride data
  const rides = {
    'ride-1': { id: 'ride-1', origin: 'UCLA', destination: 'Downtown LA', date: '2024-01-15' },
    'ride-2': { id: 'ride-2', origin: 'Westwood', destination: 'Santa Monica', date: '2024-01-16' },
    'ride-3': { id: 'ride-3', origin: 'Bel Air', destination: 'Downtown LA', date: '2024-01-17' }
  };

  // Static conversations data with proper message structure
  const conversations = [
    {
      id: 1,
      ride_id: 'ride-1',
      other_user_id: 'user-1',
      preview: 'Hey, are you still interested in the ride?',
      time: '2 min ago',
      messages: [
        { id: 1, ride_id: 'ride-1', user_id: 'user-1', content: 'Hey, are you still interested in the ride?', sent_at: '2024-01-15T14:58:00Z' },
        { id: 2, ride_id: 'ride-1', user_id: 'current-user', content: 'Yeah, what time are you picking me up?', sent_at: '2024-01-15T14:59:00Z' },
        { id: 3, ride_id: 'ride-1', user_id: 'user-1', content: 'Around 3 PM at the parking lot', sent_at: '2024-01-15T15:00:00Z' }
      ]
    },
    {
      id: 2,
      ride_id: 'ride-2',
      other_user_id: 'user-2',
      preview: 'Thanks for the event invite! I\'ll be there',
      time: '1 hour ago',
      messages: [
        { id: 1, ride_id: 'ride-2', user_id: 'user-2', content: 'Thanks for the event invite!', sent_at: '2024-01-15T13:00:00Z' },
        { id: 2, ride_id: 'ride-2', user_id: 'current-user', content: 'You\'re welcome! See you there', sent_at: '2024-01-15T13:02:00Z' },
        { id: 3, ride_id: 'ride-2', user_id: 'user-2', content: 'I\'ll be there', sent_at: '2024-01-15T13:30:00Z' }
      ]
    },
    {
      id: 3,
      ride_id: 'ride-3',
      other_user_id: 'user-3',
      preview: 'Can you confirm the meeting time?',
      time: '3 hours ago',
      messages: [
        { id: 1, ride_id: 'ride-3', user_id: 'user-3', content: 'Can you confirm the meeting time?', sent_at: '2024-01-15T12:00:00Z' },
        { id: 2, ride_id: 'ride-3', user_id: 'current-user', content: 'Yes, 4 PM works', sent_at: '2024-01-15T12:58:00Z' },
        { id: 3, ride_id: 'ride-3', user_id: 'user-3', content: 'Great, see you then', sent_at: '2024-01-15T13:00:00Z' }
      ]
    }
  ];

  const handleBack = () => {
    setSelectedConversation(null);
  };

  if (selectedConversation) {
    const conversation = conversations.find(c => c.id === selectedConversation);
    return (
      <>
        {isOpen && (
          <div className="sidebar-overlay" onClick={onClose} />
        )}

        <div className={`messages-sidebar ${isOpen ? 'open' : ''}`}>
          <div className="conversation-header">
            <button className="back-btn" onClick={handleBack}>← Back</button>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="conversation-title">
            <h2>{users[conversation.other_user_id].name}</h2>
            <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
              {rides[conversation.ride_id].origin} → {rides[conversation.ride_id].destination}
            </p>
          </div>

          <div className="conversation-view">
            {conversation.messages.map((msg) => {
              const sender = users[msg.user_id];
              const isSent = msg.user_id === 'current-user';
              return (
                <div key={msg.id} className={`chat-message ${isSent ? 'sent' : 'received'}`}>
                  <p className="chat-sender">{sender.name}</p>
                  <p className="chat-text">{msg.content}</p>
                  <p className="chat-time">{new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      <div className={`messages-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Messages</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="sidebar-content">
          {conversations.length === 0 ? (
            <p className="no-messages">No messages</p>
          ) : (
            <div className="messages-list">
              {conversations.map((message) => (
                <div
                  key={message.id}
                  className="message-item"
                  onClick={() => setSelectedConversation(message.id)}
                >
                  <p className="message-sender">{users[message.other_user_id].name}</p>
                  <p className="message-preview">{message.preview}</p>
                  <p className="message-time">{message.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
