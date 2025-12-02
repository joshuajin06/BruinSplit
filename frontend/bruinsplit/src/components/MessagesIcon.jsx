import { useState } from 'react';
import MessagesSidebar from './MessagesSidebar';
import './MessagesIcon.css';

export default function MessagesIcon() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  return (
    <>
      <button
        className="messages-icon-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title="Messages"
      >
        <span className="icon">💬</span>
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      <MessagesSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </>
  );
}
