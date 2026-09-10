import { createContext, useState, useEffect, useRef, useContext } from 'react';
import { io } from 'socket.io-client';
import AuthContext from './AuthContext';

const NotificationContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const SOCKET_BASE = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  const userId = user?.id || user?._id;

  // Add some mock notifications for the UI showcase (Remittances, Maintenance)
  const loadMockData = () => {
    return [
      { _id: 'm1', type: 'remittances', message: 'Pending remittances to review', readStatus: false },
      { _id: 'm2', type: 'remittances', message: 'Failed remittance validation', readStatus: false },
      { _id: 'm3', type: 'remittances', message: 'New remittance logged', readStatus: false },
      { _id: 'm4', type: 'maintenance', message: 'Vehicle needs oil change', readStatus: false },
      { _id: 'm5', type: 'maintenance', message: 'Tire replacement required', readStatus: false },
      { _id: 'm6', type: 'maintenance', message: 'Scheduled maintenance due', readStatus: false },
    ];
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`${API_BASE}/notifications?userId=${userId}`);
        if (!res.ok) {
          // Fallback to mock data if backend not setup yet
          const mocks = loadMockData();
          setNotifications(mocks);
          setUnreadCount(mocks.length);
          return;
        }
        const text = await res.text();
        if (!text) return;
        const data = JSON.parse(text);
        
        // Let's mix in mocks if data is empty so we can see the feature
        if (!data || data.length === 0) {
            const mocks = loadMockData();
            setNotifications(mocks);
            setUnreadCount(mocks.length);
            return;
        }

        setNotifications(data);
        setUnreadCount(data.filter(n => !n.readStatus).length);
      } catch (err) {
        const mocks = loadMockData();
        setNotifications(mocks);
        setUnreadCount(mocks.length);
      }
    };
    fetchNotifications();
  }, [userId]);

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

  const handleMarkAllAsRead = async () => {
    try {
      if (userId) {
        await fetch(`${API_BASE}/notifications/markAllRead?userId=${userId}`, { method: 'PATCH' });
      }
      setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      if (userId && !String(id).startsWith('m')) {
        await fetch(`${API_BASE}/notifications/${id}/markRead`, { method: 'PATCH' });
      }
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, readStatus: true } : n));
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      handleMarkAllAsRead,
      handleMarkAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;

