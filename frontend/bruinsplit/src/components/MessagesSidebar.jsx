import './MessagesSidebar.css';

export default function MessagesSidebar({ isOpen, onClose }) {
  // Static messages data
  const messages = [
    {
      id: 1,
      sender: 'John Doe',
      preview: 'Hey, are you still interested in the ride?',
      time: '2 min ago'
    },
    {
      id: 2,
      sender: 'Jane Smith',
      preview: 'Thanks for the event invite! I\'ll be there',
      time: '1 hour ago'
    },
    {
      id: 3,
      sender: 'Mike Johnson',
      preview: 'Can you confirm the meeting time?',
      time: '3 hours ago'
    }
  ];

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
          {messages.length === 0 ? (
            <p className="no-messages">No messages</p>
          ) : (
            <div className="messages-list">
              {messages.map((message) => (
                <div key={message.id} className="message-item">
                  <p className="message-sender">{message.sender}</p>
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
