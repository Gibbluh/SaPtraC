import { useState, useContext } from 'react';
import NotificationDropdown from './NotificationDropdown';
import NotificationContext from '../../lib/NotificationContext';

const NotificationBell = ({ userId }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { notifications, unreadCount, handleMarkAllAsRead, handleMarkAsRead } = useContext(NotificationContext);

  return (
    <div className="relative inline-block text-left">
      <button
        className="relative focus:outline-none hover:scale-105 transition-transform"
        onClick={() => setDropdownOpen((open) => !open)}
        aria-label="Notifications"
      >
        <svg className="w-6 h-6 opacity-80 hover:opacity-100" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <NotificationDropdown
          notifications={notifications}
          onMarkAllAsRead={handleMarkAllAsRead}
          onMarkAsRead={handleMarkAsRead}
          onClose={() => setDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;

