import { useState, useEffect, useRef } from 'react';
import { postMessage, getMessages, getConversations } from '../pages/api/messages';
import { useAuth } from '../context/AuthContext';
import AudioCall from './audioCall.jsx' 

import './MessagesSidebar.css';

const POLL_INTERVAL = 500; // Poll every 1 second

export default function MessagesSidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const conversationsRef = useRef(conversations);
  const scrollContainerRef = useRef(null);
  const previousMessageCountRef = useRef(0);

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

  // Scroll to bottom only when NEW messages are added (not on every poll)
  useEffect(() => {
    if (!selectedConversation) return;

    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return;

    const currentMessageCount = conversation.messages?.length || 0;
    const previousCount = previousMessageCountRef.current;

    // Only scroll if message count increased (new message added)
    if (currentMessageCount > previousCount) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 0);
    }

    previousMessageCountRef.current = currentMessageCount;
  }, [conversations, selectedConversation]);

  const handleBack = () => {
    setSelectedConversation(null);
  };

  const handleSendMessage = async (rideId) => {
    try {
      const messageSent = await postMessage(rideId, messageInput);
      console.log("Message sent: ", messageSent);
      setMessageInput('');
    } catch(error) {
      console.error("Failed to send message: ", error);
      setError(error.message);
    }
  }

  if (selectedConversation) {
    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return null;

    // Handle both 'members' (new) and 'other_users' (old) for backward compatibility
    const members = conversation.members || conversation.other_users || [];
    const groupName = `${conversation.origin} → ${conversation.destination}`;

    return (
      <>
        {isOpen && (
          <div className="sidebar-overlay" onClick={onClose} />
        )}

        <div className={`messages-sidebar ${isOpen ? 'open' : ''}`}>
          <div className="conversation-header">
            <button className="back-btn" onClick={handleBack}>←</button>
            <AudioCall userId={user?.id} rideId={conversation.ride_id} />
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="conversation-title">
            <h2>{groupName}</h2>
            <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
              {conversation.members?.map(m => m.first_name).join(', ') || 'No members'}
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#bbb' }}>
              {conversation.member_count} members
            </p>
          </div>

          <div className="conversation-view" ref={scrollContainerRef}>
            {loading && <p style={{ textAlign: 'center', color: '#999' }}>Loading messages...</p>}
            {error && <p style={{ textAlign: 'center', color: '#f44336' }}>{error}</p>}
            {!loading && !error && (
              conversation.messages && conversation.messages.length > 0 ? (
                (() => {
                  const messageGroups = [];
                  let currentGroup = null;
                  const TIME_THRESHOLD = 5 * 60 * 1000; // 5 minutes

                  conversation.messages.forEach((msg, index) => {
                    const isSent = msg.user_id === user?.id;
                    const prevMsg = conversation.messages[index - 1];
                    const shouldGroup = prevMsg &&
                      prevMsg.user_id === msg.user_id &&
                      (new Date(msg.sent_at) - new Date(prevMsg.sent_at)) < TIME_THRESHOLD;

                    if (!shouldGroup) {
                      currentGroup = {
                        userId: msg.user_id,
                        isSent,
                        messages: [msg]
                      };
                      messageGroups.push(currentGroup);
                    } else {
                      currentGroup.messages.push(msg);
                    }
                  });

                  return messageGroups.map((group, groupIndex) => {
                    const sender = members?.find(m => m.id === group.userId);
                    const senderName = sender?.first_name || 'Unknown User';
                    const lastMsg = group.messages[group.messages.length - 1];

                    return (
                      <div key={`group-${groupIndex}`} className={`message-group ${group.isSent ? 'sent' : 'received'}`}>
                        <p className="chat-sender">{senderName}</p>
                        {group.messages.map((msg) => (
                          <p key={msg.id} className="chat-text">{msg.content}</p>
                        ))}
                        <p className="chat-time">{new Date(lastMsg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    );
                  });
                })()
              ) : (
                <p style={{ textAlign: 'center', color: '#999' }}>No messages yet</p>
              )
            )}
          </div>

          <div className="message-input-container">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && messageInput.trim()) {
                  // Placeholder for send handler - you'll connect this to your backend
                  handleSendMessage(conversation.ride_id);
                }
              }}
              placeholder="Type a message..."
              className="message-input"
              disabled={sending}
            />
            <button
              className="message-send-btn"
              disabled={sending || !messageInput.trim()}
              onClick={() => {
                // Placeholder for send handler - you'll connect this to your backend
                handleSendMessage(conversation.ride_id);
              }}
            >
              {sending ? '...' : 'Send'}
            </button>
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
                const groupName = `${conv.origin} → ${conv.destination}` || 'Group Chat';
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
