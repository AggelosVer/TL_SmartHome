import React, { useState } from 'react';
import {  Routes, Route, Link, useLocation } from 'react-router-dom';
import Homepage from './pages/Homepage';
import ManageDevices from './pages/ManageDevices';
import AlertHistory from './pages/AlertHistory';
import PowerUsage from './pages/PowerUsage';
import Help from './pages/Help';
import AddDevicePage from './pages/AddDevicePage';
import Device from './domain/Device';
import './App.css';

import { useNavigate } from 'react-router-dom';

function AppWrapper() {
  const navigate = useNavigate();
  return <App navigate={navigate} />;
}


const storage = {
  isElectron: window && window.process && window.process.type,
  get: (key) => {
    if (storage.isElectron) {
      return window.electron.getStorage(key);
    } else {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
  },
  set: (key, value) => {
    if (storage.isElectron) {
      window.electron.setStorage(key, value);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }
};

const Sidebar = ({ guestMode, requestAdminLogin }) => {
  const location = useLocation();

  return (
    <div className="sidebar">
      <nav>
        <ul>
          {/* Always visible */}
          <li className={location.pathname === '/' ? 'active' : ''}>
            <Link to="/">Homepage</Link>
          </li>

          {/* Admin-only links */}
          {!guestMode && (
            <>
              <li className={location.pathname === '/manage' ? 'active' : ''}>
                <Link to="/manage">Manage Devices</Link>
              </li>
              <li className={location.pathname === '/alerts' ? 'active' : ''}>
                <Link to="/alerts">Alert History</Link>
              </li>
              <li className={location.pathname === '/power' ? 'active' : ''}>
                <Link to="/power">Power Usage</Link>
              </li>
              <li className={location.pathname === '/help' ? 'active' : ''}>
                <Link to="/help">Help</Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Toggle mode button */}
      <div
        className={guestMode ? 'guest-toggle guest-active' : 'guest-toggle'}
        onClick={requestAdminLogin}
      >
        {guestMode ? 'Switch to Admin' : 'Admin Mode'}
      </div>
    </div>
  );
};


const DEVICE_TYPES = ['Light', 'Door', 'Camera', 'Thermostat', 'Alarm'];

function getDefaultStatus(type) {
  switch (type) {
    case 'Light': return 'off';
    case 'Door': return 'locked';
    case 'Camera': return 'idle';
    case 'Thermostat': return 22;
    case 'Alarm': return 'disabled';
    default: return '';
  }
}

function App({ navigate }) {
  const [guestMode, setGuestMode] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [devices, setDevices] = useState(() => {
    const savedDevices = localStorage.getItem('smartHomeDevices');

    if (savedDevices) {
      const parsed = JSON.parse(savedDevices);
      return parsed.map(d => new Device({
      id: d.id,
      name: d.name,
      room: d.room,
      type: d.type,
      owner: d.owner || 'admin',
      functionState: d.functionState ?? getDefaultStatus(d.type),
      energyStatus: d.energyStatus || 'normal',
      visibility: d.visibility || 'public'
    }));

    }

    return [
      new Device({ id: 1, name: 'Light 1', room: 'Living Room', type: 'Light', owner: 'admin', functionState: 'on', energyStatus: 'normal', visibility: 'public' }),
      new Device({ id: 2, name: 'Light 2', room: 'Bedroom', type: 'Light', owner: 'admin', functionState: 'on', energyStatus: 'normal', visibility: 'public' }),
      new Device({ id: 3, name: 'Camera 1', room: 'Entrance', type: 'Camera', owner: 'admin', functionState: 'idle', energyStatus: 'normal', visibility: 'public' }),
      new Device({ id: 4, name: 'Thermostat', room: 'Hallway', type: 'Thermostat', owner: 'admin', functionState: 23, energyStatus: 'normal', visibility: 'public' }),
      new Device({ id: 5, name: 'Main Door', room: 'Entrance', type: 'Door', owner: 'admin', functionState: 'locked', energyStatus: 'normal', visibility: 'private' }),
      new Device({ id: 6, name: 'Alarm', room: 'House', type: 'Alarm', owner: 'admin', functionState: 'disabled', energyStatus: 'normal', visibility: 'private' }),
    ];
  });


  // const isDisabled = guestMode && (device.visibility || 'public') === 'private';


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

const requestAdminLogin = () => {
  if (guestMode) {
    setShowLoginPrompt(true);
  } else {
    const confirmSwitch = window.confirm('Are you sure you want to switch to Guest Mode?');
    if (confirmSwitch) {
      setIsAdmin(false);
      setGuestMode(true);
      navigate('/'); 
    }
  }
};


    const handleAdminLogin = () => {
    if (adminPassword === '123') {
      setIsAdmin(true);
      setGuestMode(false);
      setShowLoginPrompt(false);
      setLoginError('');
      setAdminPassword('');
    } else {
      setLoginError('Incorrect password');
    }
  };


  const toggleGuestMode = () => setGuestMode(g => !g);


  const addDevice = ({ name, type, room, visibility }) => {
    setDevices(prev => {
      const newDevice = new Device({
        id: Date.now(),
        name,
        type,
        room,
        owner: 'admin',
        functionState: getDefaultStatus(type),
        energyStatus: 'normal',
        visibility: visibility || 'public'
      });

      const newDevices = [...prev, newDevice];
      localStorage.setItem('smartHomeDevices', JSON.stringify(newDevices));
      return newDevices;
    });
  };



  const updateDeviceStatus = (id, newStatus) => {
    setDevices(prev => {
      const newDevices = prev.map(d => d.id === id ? { ...d, status: newStatus } : d);
      localStorage.setItem('smartHomeDevices', JSON.stringify(newDevices));
      return newDevices;
    });
  };

const toggleCameraRecording = (id) => {
  setDevices((prev) => {
    const newDevices = prev.map(d =>
      d.id === id && d.type === 'Camera'
        ? { ...d, functionState: d.functionState === 'recording' ? 'idle' : 'recording' }
        : d
    );
    localStorage.setItem('smartHomeDevices', JSON.stringify(newDevices));
    return newDevices;
  });
};

const toggleLight = (id) => {
  setDevices((prev) => {
    const newDevices = prev.map(d =>
      d.id === id && d.type === 'Light'
        ? { ...d, functionState: d.functionState === 'on' ? 'off' : 'on' }
        : d
    );
    localStorage.setItem('smartHomeDevices', JSON.stringify(newDevices));
    return newDevices;
  });
};



const toggleDoor = (id) => {
  setDevices((prev) => {
    const newDevices = prev.map(d =>
      d.id === id && d.type === 'Door'
        ? { ...d, functionState: d.functionState === 'locked' ? 'unlocked' : 'locked' }
        : d
    );
    localStorage.setItem('smartHomeDevices', JSON.stringify(newDevices));
    return newDevices;
  });
};

const toggleAlarm = (id) => {
  setDevices((prev) => {
    const newDevices = prev.map(d =>
      d.id === id && d.type === 'Alarm'
        ? { ...d, functionState: d.functionState === 'enabled' ? 'disabled' : 'enabled' }
        : d
    );
    localStorage.setItem('smartHomeDevices', JSON.stringify(newDevices));
    return newDevices;
  });
};


const setThermostat = (id, temp) => {
  setDevices((prev) => {
    const newDevices = prev.map(d =>
      d.id === id && d.type === 'Thermostat'
        ? { ...d, functionState: temp }
        : d
    );
    localStorage.setItem('smartHomeDevices', JSON.stringify(newDevices));
    return newDevices;
  });
};


  const editDevice = (id, newDetails) => {
    setDevices(prev => {
      const newDevices = prev.map(d => d.id === id ? { ...d, ...newDetails } : d);
      localStorage.setItem('smartHomeDevices', JSON.stringify(newDevices));
      return newDevices;
    });
  };

  const removeDevice = (id) => {
    setDevices(prev => {
      const newDevices = prev.filter(d => d.id !== id);
      localStorage.setItem('smartHomeDevices', JSON.stringify(newDevices));
      return newDevices;
    });
  };

  return (
      <div className="app-container">
        <div className="title-bar">Smart Home</div>
        <div className="app-content-row">
          <Sidebar
            guestMode={guestMode}
            requestAdminLogin={requestAdminLogin}
          />

          {showLoginPrompt && (
            <div className="admin-login-popup">
              <div className="login-box">
                <h3>Enter Admin Password</h3>
                <input
                  type="password"
                  placeholder="Enter admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
                <button onClick={handleAdminLogin}>Login</button>
                {loginError && <p className="error">{loginError}</p>}
              </div>
            </div>
          )}


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
  );
}

// export default App;
export default AppWrapper;
