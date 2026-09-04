import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import NotificationDropdown from './NotificationDropdown';

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const SOCKET_BASE = import.meta.env.VITE_SOCKET_URL || window.location.origin;

const NotificationBell = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const socketRef = useRef(null);

  // Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE}/notifications?userId=${userId}`);
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.readStatus).length);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotifications();
  }, [userId]);

  // Socket.io real-time notifications
  useEffect(() => {
    const socket = io(SOCKET_BASE, {
      path: '/socket.io',
      transports: ['websocket'],
      withCredentials: true,
    });
    socketRef.current = socket;
    socket.on('newNotification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  // Mark all as read
  const handleMarkAllAsRead = async () => {
      try {
      await fetch(`${API_BASE}/notifications/markAllRead?userId=${userId}`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  };

  // Mark single as read
  const handleMarkAsRead = async (id) => {
      try {
      await fetch(`${API_BASE}/notifications/${id}/markRead`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, readStatus: true } : n));
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        className="relative focus:outline-none"
        onClick={() => setDropdownOpen((open) => !open)}
        aria-label="Notifications"
      >
        <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
        />
      )}
    </div>
  );
};

export default NotificationBell;
