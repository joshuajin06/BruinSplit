import { useState, useEffect } from 'react';
import { getMessages, getConversations } from '../pages/api/messages';

import './MessagesSidebar.css';

export default function MessagesSidebar({ isOpen, onClose }) {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch conversations on component mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setInitialLoading(true);
    setError(null);
    try {
      const response = await getConversations();
      const conversationsList = response.conversations || [];
      setConversations(conversationsList);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setInitialLoading(false);
    }
  };

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === selectedConversation);
      if (conversation && !conversation.messages) {
        fetchMessagesForConversation(conversation.ride_id);
      }
    }
  }, [selectedConversation, conversations]);

  const fetchMessagesForConversation = async (rideId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMessages(rideId);
      const messages = response.messages || [];

      // Update the conversation with fetched messages
      setConversations(prev => prev.map(conv =>
        conv.ride_id === rideId
          ? { ...conv, messages }
          : conv
      ));
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  if (selectedConversation) {
    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return null;

    const primaryUser = conversation.other_users?.[0];

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
            <h2>{primaryUser?.first_name || (conversation.other_users?.length === 0 ? 'Solo Ride' : 'User')}</h2>
            <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
              {conversation.origin} → {conversation.destination}
            </p>
          </div>

          <div className="conversation-view">
            {loading && <p style={{ textAlign: 'center', color: '#999' }}>Loading messages...</p>}
            {error && <p style={{ textAlign: 'center', color: '#f44336' }}>{error}</p>}
            {!loading && !error && conversation.messages && conversation.messages.length > 0 ? (
              conversation.messages.map((msg) => {
                const isSent = msg.user_id === conversation.owner_id;
                const senderName = isSent ? 'You' : primaryUser?.first_name || 'User';
                return (
                  <div key={msg.id} className={`chat-message ${isSent ? 'sent' : 'received'}`}>
                    <p className="chat-sender">{senderName}</p>
                    <p className="chat-text">{msg.content}</p>
                    <p className="chat-time">{new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                );
              })
            ) : (
              !loading && <p style={{ textAlign: 'center', color: '#999' }}>No messages yet</p>
            )}
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={fetchConversations}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px 8px'
              }}
              title="Refresh"
            >
              🔄
            </button>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="sidebar-content">
          {initialLoading && <p className="no-messages">Loading conversations...</p>}
          {error && <p className="no-messages" style={{ color: '#f44336' }}>{error}</p>}
          {!initialLoading && conversations.length === 0 && !error && (
            <p className="no-messages">No conversations yet</p>
          )}
          {!initialLoading && conversations.length > 0 && (
            <div className="messages-list">
              {conversations.map((conv) => {
                const primaryUser = conv.other_users?.[0];
                const displayName = primaryUser?.first_name || (conv.other_users?.length === 0 ? 'Solo Ride' : 'User');
                return (
                  <div
                    key={conv.id}
                    className="message-item"
                    onClick={() => setSelectedConversation(conv.id)}
                  >
                    <p className="message-sender">{displayName}</p>
                    <p className="message-preview">{conv.preview}</p>
                    <p className="message-time">{conv.last_message_sent_at ? new Date(conv.last_message_sent_at).toLocaleString() : 'No messages'}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
