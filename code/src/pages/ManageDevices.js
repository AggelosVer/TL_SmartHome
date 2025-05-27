import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ManageDevices.css';

const ACTIONS_BY_TYPE = {
  Light: ['on', 'off'],
  Door: ['lock', 'unlock'],
  Camera: ['start recording', 'stop recording'],
  Thermostat: ['turn on (time)', 'turn off (time)'], // Only allow these two
  Alarm: ['enable', 'disable'],
};

function ManageDevices({
  devices,
  editDevice,
  removeDevice,
  deviceTypes,
  automations = [],
  addAutomation,
  removeAutomation,
  automationError,
  setAutomationError,
}) {
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', type: '', room: '' });
  const [showAutomationModal, setShowAutomationModal] = useState(false);

  const startEdit = (device) => {
    setEditingId(device.id);
    setEditForm({ name: device.name, type: device.type, room: device.room });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    editDevice(editingId, editForm);
    setEditingId(null);
  };

  return (
    <div className="manage-devices-container" style={{ 
      height: 'calc(100vh - 64px)', // Subtract header height
      overflowY: 'auto',
      padding: '20px',
      position: 'relative',
      paddingBottom: '300px' // Significantly increased padding for much more scrolling space
    }}>
      <h2>Manage Devices</h2>

      {/* Floating Buttons */}
      <div style={{
        position: 'fixed',
        right: 40,
        bottom: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        zIndex: 200,
      }}>
        <button
          className="add-device-fab"
          style={{ position: 'static', marginBottom: 0 }}
          onClick={() => {
            setShowAutomationModal(true);
            setAutomationError('');
          }}
        >
          + Add Automation
        </button>
        <button
          className="add-device-fab"
          style={{ position: 'static', marginBottom: 0 }}
          onClick={() => navigate('/add-device')}
        >
          + Add New Device
        </button>
      </div>

      <div className="manage-device-grid">
        {devices.map((d) => (
          <div className="manage-device-tile" key={d.id}>
            {editingId === d.id ? (
              <form className="edit-device-form" onSubmit={handleEditSubmit}>
                <input name="name" value={editForm.name} onChange={handleEditChange} />
                <select name="type" value={editForm.type} onChange={handleEditChange}>
                  {deviceTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <input name="room" value={editForm.room} onChange={handleEditChange} />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
              </form>
            ) : (
              <>
                <div className="device-title">{d.name}</div>
                <div className="device-type">{d.type}</div>
                <div className="device-room">{d.room}</div>
                <div className="device-controls">
                  <button onClick={() => startEdit(d)}>Edit</button>
                  <button onClick={() => removeDevice(d.id)} className="remove-btn">Remove</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Automations Section */}
      <div style={{ marginTop: 40 }}>
        <h3>Automations</h3>
        <div
          style={{
            display: 'flex',
            gap: 24,
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            maxWidth: 'calc(100vw - 300px)',
            paddingBottom: 8,
          }}
        >
          {automations.length === 0 ? (
            <div style={{ color: '#666', marginBottom: 12 }}>No automations set.</div>
          ) : (
            automations.map((automation, idx) => (
              <div
                key={automation.name + idx}
                className="automation-tile"
              >
                <div className="automation-title">
                  {automation.name}
                </div>
                <div className="automation-actions">
                  {automation.actions.map((a, actionIdx) => {
                    const device = devices.find(d => d.id === a.deviceId);
                    return (
                      <div key={actionIdx} className="automation-action">
                        <div className="action-device">{device ? device.name : 'Unknown'}</div>
                        <div className="action-trigger">
                          {a.triggerType === 'time'
                            ? `Time: ${a.triggerValue}`
                            : a.triggerType === 'temperature'
                            ? `Temp: ${a.triggerValue}°C`
                            : a.triggerValue}
                        </div>
                        <div className="action-type">
                          {device && device.type === 'Thermostat'
                            ? `Set to ${a.targetTemp}°C`
                            : a.action}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  className="remove-automation-btn"
                  onClick={() => removeAutomation(idx)}
                >
                  Remove Automation
                </button>
              </div>
            ))
          )}
        </div>
        {automationError && (
          <div className="automation-error">{automationError}</div>
        )}
      </div>

      {/* Automation Modal */}
      {showAutomationModal && (
        <AutomationModal
          devices={devices}
          addAutomation={addAutomation}
          onClose={() => setShowAutomationModal(false)}
          setAutomationError={setAutomationError}
          automations={automations}
        />
      )}
    </div>
  );
}

// Modal for adding automation with multiple actions and name
function AutomationModal({ devices, addAutomation, onClose, setAutomationError, automations }) {
  const [name, setName] = useState('');
  const [actions, setActions] = useState([
    { deviceId: '', action: '', triggerType: 'time', triggerValue: '', tempValue: '', targetTemp: '' }
  ]);
  const [conflictMsg, setConflictMsg] = useState('');

  const addActionRow = () => {
    setActions([...actions, { deviceId: '', action: '', triggerType: 'time', triggerValue: '', tempValue: '', targetTemp: '' }]);
  };

  const removeActionRow = (idx) => {
    setActions(actions.filter((_, i) => i !== idx));
  };

  const updateAction = (idx, field, value) => {
    setActions(actions.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !name.trim() ||
      actions.some((a) => {
        const selectedDevice = devices.find((d) => d.id.toString() === a.deviceId);
        if (!a.deviceId) return true;
        if (selectedDevice && selectedDevice.type === 'Thermostat') {
          return !a.triggerValue || !a.targetTemp;
        } else {
          return !a.action || !a.triggerValue;
        }
      })
    ) {
      setConflictMsg('Please fill all fields for each action.');
      return;
    }

    const formattedActions = actions.map((a) => {
      const selectedDevice = devices.find((d) => d.id.toString() === a.deviceId);
      if (selectedDevice && selectedDevice.type === 'Thermostat') {
        return {
          deviceId: Number(a.deviceId),
          action: 'set temperature',
          triggerType: 'time',
          triggerValue: a.triggerValue,
          targetTemp: Number(a.targetTemp),
        };
      } else {
        return {
          deviceId: Number(a.deviceId),
          action: a.action,
          triggerType: 'time',
          triggerValue: a.triggerValue,
        };
      }
    });

    const automation = { name, actions: formattedActions };
    const success = addAutomation(automation);
    if (success) {
      setConflictMsg('');
      onClose();
    }
  };

  return (
    <div className="automation-modal">
      <form className="automation-form" onSubmit={handleSubmit}>
        <h3 className="automation-title">Add Automation</h3>
        <label>
          Automation Name:
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="automation-input"
          />
        </label>
        {actions.map((a, idx) => {
          const selectedDevice = devices.find((d) => d.id.toString() === a.deviceId);
          const isThermostat = selectedDevice && selectedDevice.type === 'Thermostat';
          return (
            <div key={idx} className="automation-action-row">
              <label>
                Device:
                <select
                  value={a.deviceId}
                  onChange={(e) => updateAction(idx, 'deviceId', e.target.value)}
                  required
                  className="automation-select"
                >
                  <option value="">Select Device</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.type})
                    </option>
                  ))}
                </select>
              </label>
              {selectedDevice && isThermostat && (
                <>
                  <label>
                    Time:
                    <input
                      type="time"
                      value={a.triggerValue}
                      onChange={(e) => updateAction(idx, 'triggerValue', e.target.value)}
                      required
                      className="automation-time-input"
                    />
                  </label>
                  <label>
                    Set To:
                    <input
                      type="number"
                      min="10"
                      max="30"
                      value={a.targetTemp || ''}
                      onChange={(e) => updateAction(idx, 'targetTemp', e.target.value)}
                      required
                      className="automation-temp-input"
                      placeholder="°C"
                    />
                  </label>
                </>
              )}
              {selectedDevice && !isThermostat && (
                <>
                  <label>
                    Action:
                    <select
                      value={a.action}
                      onChange={(e) => updateAction(idx, 'action', e.target.value)}
                      required
                      className="automation-action-select"
                    >
                      <option value="">Select Action</option>
                      {ACTIONS_BY_TYPE[selectedDevice.type].map((act) => (
                        <option key={act} value={act}>
                          {act}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Time:
                    <input
                      type="time"
                      value={a.triggerValue}
                      onChange={(e) => updateAction(idx, 'triggerValue', e.target.value)}
                      required
                      className="automation-time-input"
                    />
                  </label>
                </>
              )}
              {actions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeActionRow(idx)}
                  className="remove-action-button"
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
        <button type="button" onClick={addActionRow} className="add-action-button">
          + Add Action
        </button>
        {conflictMsg && <div className="automation-conflict-msg">{conflictMsg}</div>}
        <div className="automation-buttons">
          <button type="submit" className="save-button">
            Save
          </button>
          <button type="button" onClick={onClose} className="cancel-button">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ManageDevices;

