import React from 'react';
import './Help.css';

function Help({ guestMode }) {
  return (
    <div className="help-container">
      <h2>Smart Home Help & FAQ</h2>

      <section>
        <h3>🔐 Admin vs Guest Mode</h3>
        <p>
          {guestMode
            ? 'You are currently in Guest Mode. Some features are disabled.'
            : 'You are in Admin Mode. You have full access to all features.'}
        </p>
      </section>

      <section>
        <h3>📦 Adding Devices</h3>
        <p>Use "Manage Devices" to add lights, thermostats, cameras, and more. Only available in Admin Mode.</p>
      </section>

      <section>
        <h3>📊 Viewing Power Usage</h3>
        <p>Monitor your energy usage across all devices from the Power Usage tab.</p>
      </section>

      <section>
        <h3>🚨 Alert History</h3>
        <p>Track recent activity like motion detection, alerts, and device changes.</p>
      </section>
    </div>
  );
}

export default Help;
