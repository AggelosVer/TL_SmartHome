import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Homepage.css';

function Homepage({
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
          {devices.map((device) => (
            <div className="device-tile" key={device.id}>
              <div className="device-title">{device.name}</div>
              <div className="device-type">{device.type}</div>
              <div className="device-room">{device.room}</div>
              <div className="device-status">{renderStatus(device)}</div>
              <div className="device-controls">{renderControls(device, { toggleLight, toggleDoor, toggleCameraRecording, toggleAlarm, setThermostat })}</div>
            </div>
          ))}
        </div>
      </div>
      <button className="add-device-fab" onClick={() => navigate('/add-device')}>
        + Add New Device
      </button>
    </div>
  );
}

function renderStatus(device) {
  switch (device.type) {
    case 'Light':
      return device.status === 'on' ? 'ON' : 'OFF';
    case 'Door':
      return device.status === 'locked' ? 'Locked' : 'Unlocked';
    case 'Camera':
      return device.status === 'recording' ? 'Recording' : 'Idle';
    case 'Thermostat':
      return `${device.status}°C`;
    case 'Alarm':
      return device.status === 'enabled' ? 'Enabled' : 'Disabled';
    default:
      return device.status;
  }
}

function renderControls(device, handlers) {
  switch (device.type) {
    case 'Light':
      return (
        <button onClick={() => handlers.toggleLight(device.id)}>
          {device.status === 'on' ? 'Turn Off' : 'Turn On'}
        </button>
      );
    case 'Door':
      return (
        <button onClick={() => handlers.toggleDoor(device.id)}>
          {device.status === 'locked' ? 'Unlock' : 'Lock'}
        </button>
      );
    case 'Camera':
      return (
        <>
          <button onClick={() => handlers.toggleCameraRecording(device.id)}>
            {device.status === 'recording' ? 'Stop Recording' : 'Start Recording'}
          </button>
          <button style={{ marginLeft: 8 }}>View Feed</button>
        </>
      );
    case 'Thermostat':
      return (
        <input
          type="range"
          min="10"
          max="30"
          value={device.status}
          onChange={e => handlers.setThermostat(device.id, Number(e.target.value))}
        />
      );
    case 'Alarm':
      return (
        <button onClick={() => handlers.toggleAlarm(device.id)}>
          {device.status === 'enabled' ? 'Disable' : 'Enable'}
        </button>
      );
    default:
      return null;
  }
}

export default Homepage; 