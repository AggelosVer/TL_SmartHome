import React from 'react';

function Help({ guestMode }) {
  return (
    <div style={{ padding: 32 }}>
      <h2>Help</h2>
      <p>Guest Mode: {guestMode ? 'Active' : 'Inactive'}</p>
      {/* Help and support info will go here */}
    </div>
  );
}

export default Help; 