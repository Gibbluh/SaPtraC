import { useNavigate } from "react-router-dom";

const NotificationDropdown = ({ notifications, onMarkAllAsRead, onMarkAsRead, onClose }) => {
  const navigate = useNavigate();

  const handleNotificationClick = (n) => {
    // Mark as read if unread
    if (!n.readStatus) {
      onMarkAsRead(n._id);
    }
    
    // Navigate based on type
    if (n.type) {
      // Pass the notification ID to highlight it on the target page
      navigate(`/${n.type}`, { state: { highlightId: n._id } });
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
      <div className="py-2 px-4 border-b flex justify-between items-center">
        <span className="font-semibold text-gray-700">Notifications</span>
        <button
          className="text-xs text-blue-600 hover:underline focus:outline-none"
          onClick={onMarkAllAsRead}
        >
          Mark all as read
        </button>
      </div>
      <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100">
        {notifications.length === 0 && (
          <li className="py-4 px-4 text-gray-500 text-center text-sm">No notifications</li>
        )}
        {notifications.map((n) => (
          <li
            key={n._id}
            className={`flex items-start px-4 py-3 cursor-pointer hover:bg-gray-50 transition ${!n.readStatus ? 'bg-blue-50/50' : ''}`}
            onClick={() => handleNotificationClick(n)}
          >
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${!n.readStatus ? 'text-blue-700' : 'text-gray-800'}`}>
                  {n.title || (n.type ? n.type.charAt(0).toUpperCase() + n.type.slice(1) : 'Alert')}
                </span>
                {!n.readStatus && <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block shrink-0" />}
              </div>
              <div className="text-xs text-gray-600 mt-1">{n.message}</div>
              <div className="text-[10px] text-gray-400 mt-1">
                {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now'}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationDropdown;

