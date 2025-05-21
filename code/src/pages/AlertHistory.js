import React from 'react';
import './AlertHistory.css';

function AlertHistory({ alerts, setAlerts }) {
  const clearAlerts = () => {
    setAlerts([]); // Clear all alerts
    localStorage.setItem('smartHomeAlerts', JSON.stringify([])); // Clear from localStorage
  };

  return (
    <div className="alert-history-container">
      <h2>Alert History</h2>
      <div className="alert-list">
        {alerts.length > 0 ? (
          alerts.map((alert, idx) => (
            <div className="alert-item" key={idx}>{alert}</div>
          ))
        ) : (
          <p>No alerts to display.</p>
        )}
      </div>
      <button className="clear-alerts-button" onClick={clearAlerts}>
        Clear Alerts
      </button>
    </div>
  );
}

export default AlertHistory;