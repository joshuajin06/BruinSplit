import { useState, useEffect, useRef } from 'react';
import { getMessages, getConversations } from '../pages/api/messages';

import './MessagesSidebar.css';

const POLL_INTERVAL = 500; // Poll every 1 second

export default function MessagesSidebar({ isOpen, onClose }) {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const conversationsRef = useRef(conversations);

  // Update ref whenever conversations change
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Fetch conversations on component mount
  useEffect(() => {
    fetchConversations(true);
  }, []);

  // Auto-poll conversations list
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(fetchConversations, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isOpen]);

  const fetchConversations = async (isInitial = false) => {
    if (isInitial) {
      setInitialLoading(true);
    }
    setError(null);
    try {
      const response = await getConversations();
      const conversationsList = response.conversations || [];

      setConversations(prev => {
        // Merge new conversations with existing ones, preserving messages
        const merged = conversationsList.map(newConv => {
          const existingConv = prev.find(c => c.id === newConv.id);
          // Keep existing messages if they exist
          return {
            ...newConv,
            messages: existingConv?.messages
          };
        });
        return merged;
      });
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      }
    }
  };

  const fetchMessagesForConversation = async (rideId, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
      setError(null);
    }
    try {
      const response = await getMessages(rideId);
      const messages = response.messages || [];

      // Update the conversation with fetched messages
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.ride_id === rideId) {
            return { ...conv, messages };
          }
          return conv;
        });
        return updated;
      });
    } catch (err) {
      console.error('Error fetching messages:', err);
      // Only show error on initial load, not during polling
      if (isInitial) {
        setError('Failed to load messages');
      }
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  // Consolidated: Auto-poll messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation || !isOpen) return;

    // Get the ride_id from the selected conversation using ref to avoid dependency
    const conv = conversationsRef.current.find(c => c.id === selectedConversation);
    if (!conv?.ride_id) return;

    const rideId = conv.ride_id;
    let hasInitialFetched = false;

    const fetchAndPoll = async () => {
      await fetchMessagesForConversation(rideId, !hasInitialFetched);
      hasInitialFetched = true;
    };

    // Fetch immediately on first selection
    fetchAndPoll();

    // Then poll every POLL_INTERVAL
    const interval = setInterval(fetchAndPoll, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [selectedConversation, isOpen]);

  const handleBack = () => {
    setSelectedConversation(null);
  };

  if (selectedConversation) {
    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return null;

    const groupName = conversation.members?.map(m => m.first_name).join(', ') || 'Group Chat';

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
            <h2>{groupName}</h2>
            <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
              {conversation.origin} → {conversation.destination}
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#bbb' }}>
              {conversation.member_count} members
            </p>
          </div>

          <div className="conversation-view">
            {loading && <p style={{ textAlign: 'center', color: '#999' }}>Loading messages...</p>}
            {error && <p style={{ textAlign: 'center', color: '#f44336' }}>{error}</p>}
            {!loading && !error && (
              conversation.messages && conversation.messages.length > 0 ? (
                conversation.messages.map((msg) => {
                  const sender = conversation.members?.find(m => m.id === msg.user_id);
                  const senderName = sender?.first_name || 'Unknown User';
                  const isSent = msg.user_id === conversation.owner_id;
                  return (
                    <div key={msg.id} className={`chat-message ${isSent ? 'sent' : 'received'}`}>
                      <p className="chat-sender">{senderName}</p>
                      <p className="chat-text">{msg.content}</p>
                      <p className="chat-time">{new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  );
                })
              ) : (
                <p style={{ textAlign: 'center', color: '#999' }}>No messages yet</p>
              )
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
          <button className="close-btn" onClick={onClose}>✕</button>
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
                const groupName = conv.members?.map(m => m.first_name).join(', ') || 'Group Chat';
                return (
                  <div
                    key={conv.id}
                    className="message-item"
                    onClick={() => setSelectedConversation(conv.id)}
                  >
                    <p className="message-sender">{groupName}</p>
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
