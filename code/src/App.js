import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Homepage from './pages/Homepage';
import ManageDevices from './pages/ManageDevices';
import AlertHistory from './pages/AlertHistory';
import PowerUsage from './pages/PowerUsage';
import Help from './pages/Help';
import AddDevicePage from './pages/AddDevicePage';
import './App.css';

const Sidebar = ({ guestMode, toggleGuestMode }) => {
  const location = useLocation();
  return (
    <div className="sidebar">
      <nav>
        <ul>
          <li className={location.pathname === '/' ? 'active' : ''}><Link to="/">Homepage</Link></li>
          <li className={location.pathname === '/manage' ? 'active' : ''}><Link to="/manage">Manage Devices</Link></li>
          <li className={location.pathname === '/alerts' ? 'active' : ''}><Link to="/alerts">Alert History</Link></li>
          <li className={location.pathname === '/power' ? 'active' : ''}><Link to="/power">Power Usage</Link></li>
          <li className={location.pathname === '/help' ? 'active' : ''}><Link to="/help">Help</Link></li>
        </ul>
      </nav>
      <div className={guestMode ? 'guest-toggle guest-active' : 'guest-toggle'} onClick={toggleGuestMode}>
        {guestMode ? 'Guest Mode Active' : 'Switch to Guest'}
      </div>
    </div>
  );
};

// Device type definitions
const DEVICE_TYPES = [
  'Light',
  'Door',
  'Camera',
  'Thermostat',
  'Alarm',
];

function getDefaultStatus(type) {
  switch (type) {
    case 'Light': return 'off';
    case 'Door': return 'locked';
    case 'Camera': return 'idle';
    case 'Thermostat': return 22; // default temperature
    case 'Alarm': return 'disabled';
    default: return '';
  }
}

function App() {
  const [guestMode, setGuestMode] = useState(false);
  const [devices, setDevices] = useState([
    { id: 1, name: 'Light 1', type: 'Light', status: 'on', room: 'Living Room' },
    { id: 2, name: 'Light 2', type: 'Light', status: 'on', room: 'Bedroom' },
    { id: 3, name: 'Camera 1', type: 'Camera', status: 'idle', room: 'Entrance' },
    { id: 4, name: 'Thermostat', type: 'Thermostat', status: 23, room: 'Hallway' },
    { id: 5, name: 'Main Door', type: 'Door', status: 'locked', room: 'Entrance' },
    { id: 6, name: 'Alarm', type: 'Alarm', status: 'disabled', room: 'House' },
  ]);
  const [alerts, setAlerts] = useState([
    '08:30, March 22 – Motion detected in the living room.',
    '22:15, March 21 – High energy usage in the kitchen.',
    '18:45, March 21 – Garden watering system activated.',
    '14:10, March 21 – Electricity bill due in 3 days.',
    '23:00, March 20 – Front door unlocked at night.',
    '17:30, March 20 – Smart lights turned on at sunset.',
    '12:00, March 19 – Smoke detected in the kitchen.',
    '09:20, March 18 – Guest access enabled for John Doe.',
    '06:45, March 18 – Temperature in the house dropped below 15°C.',
    '19:10, March 17 – Washing machine cycle completed.',
    '02:30, March 17 – Unusual activity detected near the backyard.'
  ]);

  const toggleGuestMode = () => setGuestMode((g) => !g);

  // Add device with only name, type, room
  const addDevice = ({ name, type, room }) => {
    setDevices((prev) => [
      ...prev,
      {
        id: Date.now(),
        name,
        type,
        room,
        status: getDefaultStatus(type),
      },
    ]);
  };

  // Device control handlers
  const updateDeviceStatus = (id, newStatus) => {
    setDevices((prev) => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
  };

  // For camera: toggle recording/idle
  const toggleCameraRecording = (id) => {
    setDevices((prev) => prev.map(d =>
      d.id === id && d.type === 'Camera'
        ? { ...d, status: d.status === 'recording' ? 'idle' : 'recording' }
        : d
    ));
  };

  // For light: toggle on/off
  const toggleLight = (id) => {
    setDevices((prev) => prev.map(d =>
      d.id === id && d.type === 'Light'
        ? { ...d, status: d.status === 'on' ? 'off' : 'on' }
        : d
    ));
  };

  // For door: toggle locked/unlocked
  const toggleDoor = (id) => {
    setDevices((prev) => prev.map(d =>
      d.id === id && d.type === 'Door'
        ? { ...d, status: d.status === 'locked' ? 'unlocked' : 'locked' }
        : d
    ));
  };

  // For alarm: toggle enabled/disabled
  const toggleAlarm = (id) => {
    setDevices((prev) => prev.map(d =>
      d.id === id && d.type === 'Alarm'
        ? { ...d, status: d.status === 'enabled' ? 'disabled' : 'enabled' }
        : d
    ));
  };

  // For thermostat: set temperature
  const setThermostat = (id, temp) => {
    setDevices((prev) => prev.map(d =>
      d.id === id && d.type === 'Thermostat'
        ? { ...d, status: temp }
        : d
    ));
  };

  // Edit device details
  const editDevice = (id, newDetails) => {
    setDevices((prev) => prev.map(d => d.id === id ? { ...d, ...newDetails } : d));
  };

  // Remove device
  const removeDevice = (id) => {
    setDevices((prev) => prev.filter(d => d.id !== id));
  };

  return (
    <Router>
      <div className="app-container">
        <div className="title-bar">Smart Home</div>
        <div className="app-content-row">
          <Sidebar guestMode={guestMode} toggleGuestMode={toggleGuestMode} />
          <div className="main-content">
            <Routes>
              <Route path="/" element={
                <Homepage
                  guestMode={guestMode}
                  devices={devices}
                  updateDeviceStatus={updateDeviceStatus}
                  toggleCameraRecording={toggleCameraRecording}
                  toggleLight={toggleLight}
                  toggleDoor={toggleDoor}
                  toggleAlarm={toggleAlarm}
                  setThermostat={setThermostat}
                />
              } />
              <Route path="/manage" element={
                <ManageDevices
                  guestMode={guestMode}
                  devices={devices}
                  addDevice={addDevice}
                  editDevice={editDevice}
                  removeDevice={removeDevice}
                  deviceTypes={DEVICE_TYPES}
                />
              } />
              <Route path="/alerts" element={<AlertHistory guestMode={guestMode} alerts={alerts} />} />
              <Route path="/power" element={<PowerUsage guestMode={guestMode} />} />
              <Route path="/help" element={<Help guestMode={guestMode} />} />
              <Route path="/add-device" element={
                <AddDevicePage addDevice={addDevice} deviceTypes={DEVICE_TYPES} />
              } />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App; 