import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Homepage.css';

function Homepage({
  guestMode,
  devices,
  toggleLight,
  toggleDoor,
  toggleCameraRecording,
  toggleAlarm,
  setThermostat,
}) {
  const navigate = useNavigate();
  return (
    <div className="homepage-container">
      <div className="homepage-device-scroll-container">
        <div className="device-grid">
        {devices.map((device) => {
          const isDisabled = guestMode && device.visibility === 'private';

          return (
            <div className={`device-tile ${isDisabled ? 'disabled' : ''}`} key={device.id}>
            <div className="device-title">
            {device.name}
            {guestMode && device.visibility === 'private' && (
              <span className="lock-icon" title="Private - Admin Only">  </span>
            )}
            </div>
              <div className="device-type">{device.type}</div>
              <div className="device-room">{device.room}</div>
              <div className="device-status">{renderStatus(device)}</div>
              <div className="device-controls">
                {renderControls(device, {
                  toggleLight,
                  toggleDoor,
                  toggleCameraRecording,
                  toggleAlarm,
                  setThermostat
                }, isDisabled)}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    {!guestMode && (
      <button className="add-device-fab" onClick={() => navigate('/add-device')}>
        + Add New Device
      </button>
    )}

    </div>
  );
}

function renderStatus(device) {
  switch (device.type) {
    case 'Light':
      return device.functionState === 'on' ? 'ON' : 'OFF';
    case 'Door':
      return device.functionState === 'locked' ? 'Locked' : 'Unlocked';
    case 'Camera':
      return device.functionState === 'recording' ? 'Recording' : 'Idle';
    case 'Thermostat':
      return `${device.functionState}°C`;
    case 'Alarm':
      return device.functionState === 'enabled' ? 'Enabled' : 'Disabled';
    default:
      return device.functionState;
  }
}

function renderControls(device, handlers, isDisabled = false) {
  switch (device.type) {
    case 'Light':
      return (
        <button onClick={() => handlers.toggleLight(device.id)} disabled={isDisabled}>
          {device.functionState === 'on' ? 'Turn Off' : 'Turn On'}
        </button>
      );
    case 'Door':
      return (
        <button onClick={() => handlers.toggleDoor(device.id)} disabled={isDisabled}>
          {device.functionState === 'locked' ? 'Unlock' : 'Lock'}
        </button>
      );
    case 'Camera':
      return (
        <>
          <button onClick={() => handlers.toggleCameraRecording(device.id)} disabled={isDisabled}>
            {device.functionState === 'recording' ? 'Stop Recording' : 'Start Recording'}
          </button>
          <button style={{ marginLeft: 8 }} disabled={isDisabled}>
            View Feed
          </button>
        </>
      );
    case 'Thermostat':
      return (
        <input
          type="range"
          min="10"
          max="30"
          value={device.functionState}
          onChange={e => handlers.setThermostat(device.id, Number(e.target.value))}
          disabled={isDisabled}
        />
      );
    case 'Alarm':
      return (
        <button onClick={() => handlers.toggleAlarm(device.id)} disabled={isDisabled}>
          {device.functionState === 'enabled' ? 'Disable' : 'Enable'}
        </button>
      );
    default:
      return null;
  }
}

export default Homepage;