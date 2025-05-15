import React from 'react';

function PowerUsage({ guestMode }) {
  return (
    <div style={{ padding: 32 }}>
      <h2>Power Usage</h2>
      <p>Guest Mode: {guestMode ? 'Active' : 'Inactive'}</p>
      {/* Power usage chart and info will go here */}
    </div>
  );
}

export default PowerUsage; 