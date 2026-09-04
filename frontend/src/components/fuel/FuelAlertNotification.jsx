import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

const FuelAlertNotification = ({ user, role }) => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!user || !role) return;
    const socket = io(SOCKET_URL, {
      query: { userId: user._id, role },
      transports: ["websocket"],
    });

    socket.on("fuelAnomalyAlert", (alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 5)); // keep last 5 alerts
    });

    return () => {
      socket.disconnect();
    };
  }, [user, role]);

  if (!alerts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {alerts.map((alert, idx) => (
        <div
          key={idx}
          className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded shadow-lg animate-bounce"
        >
          <strong className="block font-bold">Fuel Anomaly Detected!</strong>
          <span className="block text-xs mt-1">{alert.reason}</span>
          <span className="block text-xs">Unit: {alert.unitName || alert.unit}</span>
          <span className="block text-xs">Driver: {alert.driverName || alert.driver}</span>
          <span className="block text-xs">Date: {new Date(alert.transactionDate).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export default FuelAlertNotification;
