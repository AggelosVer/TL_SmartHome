import React, { useState, useEffect } from 'react';
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
  isElectron: typeof window !== 'undefined' && window.electron && typeof window.electron.getStorage === 'function',
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
            <Link to="/">
              Homepage
            </Link>
          </li>

          {/* Admin-only links */}
          {!guestMode && (
            <>
              <li className={location.pathname === '/manage' ? 'active' : ''}>
                <Link to="/manage">
                  Manage Devices
                </Link>
              </li>
              <li className={location.pathname === '/alerts' ? 'active' : ''}>
                <Link to="/alerts">
                  Alert History
                </Link>
              </li>
              <li className={location.pathname === '/power' ? 'active' : ''}>
                <Link to="/power">
                  Power Usage
                </Link>
              </li>
            </>
          )}
          <li className={location.pathname === '/help' ? 'active' : ''}>
            <Link to="/help">
              Help
            </Link>
          </li>
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
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.body.className = darkMode ? 'dark-mode' : '';
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const [alerts, setAlerts] = useState(() => {
    const savedAlerts = localStorage.getItem('smartHomeAlerts');
    return savedAlerts ? JSON.parse(savedAlerts) : [];
  });

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

  const addAlert = (message) => {
    setAlerts((prevAlerts) => {
      const timestamp = new Date().toLocaleString(); // Add a timestamp
      const newAlert = `${timestamp} – ${message}`;
      const updatedAlerts = [newAlert, ...prevAlerts]; // Add the new alert to the top of the list

      // Save to local storage
      localStorage.setItem('smartHomeAlerts', JSON.stringify(updatedAlerts));

      return updatedAlerts;
    });
  };

  // Helper function to ensure we're working with Device instances
  const ensureDeviceInstance = (device) => {
    if (device instanceof Device) return device;
    return new Device({
      id: device.id,
      name: device.name,
      room: device.room,
      type: device.type,
      owner: device.owner || 'admin',
      functionState: device.functionState ?? getDefaultStatus(device.type),
      energyStatus: device.energyStatus || 'normal',
      visibility: device.visibility || 'public'
    });
  };


  const requestAdminLogin = () => {
    if (guestMode) {
      // Force close + reset password field before reopening
      setShowLoginPrompt(false);
      setAdminPassword('');
      setLoginError('');

      setTimeout(() => {
        setShowLoginPrompt(true); // Reopens popup after DOM updates
      }, 50); // Short delay ensures remount
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
    setDevices((prev) => {
      const newDevice = new Device({
        id: Date.now(),
        name,
        type,
        room,
        owner: 'admin',
        functionState: getDefaultStatus(type),
        energyStatus: 'normal',
        visibility: visibility || 'public',
      });
  
      addAlert(`New ${type} added: ${name} in ${room}`);
      const newDevices = [...prev, newDevice];
      localStorage.setItem('smartHomeDevices', JSON.stringify(newDevices));
      return newDevices;
    });
  };



  const updateDeviceStatus = (id, newStatus) => {
    setDevices(prev => {
      const newDevices = prev.map(d => 
        d.id === id ? ensureDeviceInstance({ ...d, functionState: newStatus }) : ensureDeviceInstance(d)
      );
      localStorage.setItem('smartHomeDevices', JSON.stringify(newDevices));
      return newDevices;
    });
  };

  const toggleCameraRecording = (id) => {
    setDevices((prev) => {
      const newDevices = prev.map((d) =>
        d.id === id && d.type === 'Camera'
          ? ensureDeviceInstance({ ...d, functionState: d.functionState === 'recording' ? 'idle' : 'recording' })
          : ensureDeviceInstance(d)
      );
  
      const toggledDevice = prev.find((d) => d.id === id && d.type === 'Camera');
      if (toggledDevice) {
        const newState = toggledDevice.functionState === 'recording' ? 'idle' : 'recording';
        addAlert(`${toggledDevice.name} (Camera) is now ${newState}`);
      }
  
      localStorage.setItem('smartHomeDevices', JSON.stringify(newDevices));
      return newDevices;
    });
  };

const toggleLight = (id) => {
  setDevices((prev) => {
    const newDevices = prev.map((d) =>
      d.id === id && d.type === 'Light'
        ? ensureDeviceInstance({ ...d, functionState: d.functionState === 'on' ? 'off' : 'on' })
        : ensureDeviceInstance(d)
    );

    const toggledDevice = prev.find((d) => d.id === id && d.type === 'Light');
    if (toggledDevice) {
      const newState = toggledDevice.functionState === 'on' ? 'off' : 'on';
      addAlert(`${toggledDevice.name} (Light) turned ${newState}`);
    }

    localStorage.setItem('smartHomeDevices', JSON.stringify(newDevices));
    return newDevices;
  });
};


const toggleDoor = (id) => {
  setDevices((prev) => {
    const newDevices = prev.map((d) =>
      d.id === id && d.type === 'Door'
        ? ensureDeviceInstance({ ...d, functionState: d.functionState === 'locked' ? 'unlocked' : 'locked' })
        : ensureDeviceInstance(d)
    );

    const toggledDevice = prev.find((d) => d.id === id && d.type === 'Door');
    if (toggledDevice) {
      const newState = toggledDevice.functionState === 'locked' ? 'unlocked' : 'locked';
      addAlert(`${toggledDevice.name} (Door) is now ${newState}`);
    }

    localStorage.setItem('smartHomeDevices', JSON.stringify(newDevices));
    return newDevices;
  });
};

const toggleAlarm = (id) => {
  setDevices((prev) => {
    const newDevices = prev.map((d) =>
      d.id === id && d.type === 'Alarm'
        ? ensureDeviceInstance({ ...d, functionState: d.functionState === 'enabled' ? 'disabled' : 'enabled' })
        : ensureDeviceInstance(d)
    );

    const toggledDevice = prev.find((d) => d.id === id && d.type === 'Alarm');
    if (toggledDevice) {
      const newState = toggledDevice.functionState === 'enabled' ? 'disabled' : 'enabled';
      addAlert(`${toggledDevice.name} (Alarm) is now ${newState}`);
    }

    localStorage.setItem('smartHomeDevices', JSON.stringify(newDevices));
    return newDevices;
  });
};

const setThermostat = (id, temp) => {
  setDevices((prev) => {
    const newDevices = prev.map((d) =>
      d.id === id && d.type === 'Thermostat'
        ? ensureDeviceInstance({ ...d, functionState: temp })
        : ensureDeviceInstance(d)
    );

    const updatedDevice = prev.find((d) => d.id === id && d.type === 'Thermostat');
    if (updatedDevice) {
      addAlert(`${updatedDevice.name} (Thermostat) set to ${temp}°C`);
    }

    localStorage.setItem('smartHomeDevices', JSON.stringify(newDevices));
    return newDevices;
  });
};

  const editDevice = (id, newDetails) => {
    setDevices((prev) => {
      const newDevices = prev.map((d) => {
        if (d.id === id) {
          const changes = [];
          if (d.name !== newDetails.name) changes.push(`name changed to ${newDetails.name}`);
          if (d.room !== newDetails.room) changes.push(`room changed to ${newDetails.room}`);
          if (d.type !== newDetails.type) changes.push(`type changed to ${newDetails.type}`);

          if (changes.length > 0) {
            addAlert(`${d.name} (${d.type}) updated: ${changes.join(', ')}`);
          }

          return ensureDeviceInstance({ ...d, ...newDetails });
        }
        return ensureDeviceInstance(d);
      });

      localStorage.setItem('smartHomeDevices', JSON.stringify(newDevices));
      return newDevices;
    });
  };

  const removeDevice = (id) => {
  // Check if this device is used in any automation
  const usedInAutomation = automations.some(automation =>
    automation.actions.some(action => action.deviceId === id)
  );
  if (usedInAutomation) {
    window.alert('This device is used in an automation. Please delete the automation(s) first.');
    return;
  }

  setDevices((prev) => {
    const deviceToRemove = prev.find((d) => d.id === id);
    if (deviceToRemove) {
      addAlert(`${deviceToRemove.name} (${deviceToRemove.type}) in ${deviceToRemove.room} was removed`);
    }

    const newDevices = prev.filter((d) => d.id !== id).map(ensureDeviceInstance);
    localStorage.setItem('smartHomeDevices', JSON.stringify(newDevices));
    return newDevices;
  });
};

  const [automations, setAutomations] = useState(() => {
    const saved = storage.get('smartHomeAutomations');
    return saved ? saved : [];
  });
  const [automationError, setAutomationError] = useState('');

  const addAutomation = (automation) => {
    // Check for duplicate actions within the same automation
    for (let i = 0; i < automation.actions.length; i++) {
      const a1 = automation.actions[i];
      for (let j = i + 1; j < automation.actions.length; j++) {
        const a2 = automation.actions[j];
        if (
          a1.deviceId === a2.deviceId &&
          a1.triggerType === a2.triggerType &&
          a1.triggerValue === a2.triggerValue &&
          a1.action === a2.action
        ) {
          setAutomationError('Duplicate action (same device, trigger, and action) within this automation.');
          return false;
        }
      }
    }
  
    // Check for duplicate actions across all automations
    for (const existingAutomation of automations) {
      for (const existingAction of existingAutomation.actions) {
        for (const newAction of automation.actions) {
          if (
            existingAction.deviceId === newAction.deviceId &&
            existingAction.triggerType === newAction.triggerType &&
            existingAction.triggerValue === newAction.triggerValue &&
            existingAction.action === newAction.action
          ) {
            setAutomationError('An automation with the same device, trigger, and action already exists.');
            return false;
          }
        }
      }
    }
  
    const updated = [...automations, automation];
    setAutomations(updated);
    storage.set('smartHomeAutomations', updated);
    setAutomationError('');
  
    // Add an alert for the new automation
    addAlert(`New automation added: ${automation.name}`);
  
    return true;
  };

  const removeAutomation = (idx) => {
    const automationToRemove = automations[idx];
    const updated = automations.filter((_, i) => i !== idx);
    setAutomations(updated);
    storage.set('smartHomeAutomations', updated);
  
    // Add an alert for the removed automation
    if (automationToRemove) {
      addAlert(`Automation removed: ${automationToRemove.name}`);
    }
  };

useEffect(() => {
  const interval = setInterval(() => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

    automations.forEach(automation => {
      automation.actions.forEach(action => {
        const device = devices.find(d => d.id === action.deviceId);
        if (!device) return;


        if (
          device.type === 'Thermostat' &&
          action.action === 'set temperature' &&
          action.triggerType === 'time' &&
          action.triggerValue === currentTime &&
          typeof action.targetTemp === 'number'
        ) {
          updateDeviceStatus(device.id, action.targetTemp);
        }


        if (
          action.triggerType === 'time' &&
          action.triggerValue === currentTime
        ) {
          if (device.type !== 'Thermostat') {
            // Apply action for Light, Door, Camera, Alarm
            let newState = device.functionState;

            switch (device.type) {
              case 'Light':
                newState = action.action === 'on' ? 'on' : 'off';
                break;
              case 'Door':
                newState = action.action === 'unlock' ? 'unlocked' : 'locked';
                break;
              case 'Camera':
                newState = action.action === 'start recording' ? 'recording' : 'idle';
                break;
              case 'Alarm':
                newState = action.action === 'enable' ? 'enabled' : 'disabled';
                break;
              default:
                return;
            }

            updateDeviceStatus(device.id, newState);
          }
        }
      });
    });
  }, 10000); // Every 10 seconds

  return () => clearInterval(interval);
}, [automations, devices]);


  return (
      <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
        <div className="title-bar">
          <div className="title-left">
            <span role="img" aria-label="home">🏠</span>
            Smart Home
          </div>
          <button 
            className="dark-mode-toggle"
            onClick={toggleDarkMode}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
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
                autoFocus
              />
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  style={{
                    flex: 1,
                    background: '#1a5cff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '12px',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                  onClick={handleAdminLogin}
                >
                  Login
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    background: '#aaa',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '12px',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowLoginPrompt(false)}
                >
                  Cancel
                </button>
              </div>
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
                  automations={automations}
                  addAutomation={addAutomation}
                  removeAutomation={removeAutomation}
                  automationError={automationError}
                  setAutomationError={setAutomationError}
                />
              } />
              <Route path="/alerts" element={<AlertHistory alerts={alerts} setAlerts={setAlerts} guestMode={guestMode} />} />
              <Route path="/power" element={<PowerUsage devices={devices} darkMode={darkMode} />} />
              <Route path="/help" element={<Help />} />
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
