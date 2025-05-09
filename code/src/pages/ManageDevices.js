import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ManageDevices.css';

function ManageDevices({ devices, editDevice, removeDevice, deviceTypes }) {
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', type: '', room: '' });

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
    <div className="manage-devices-container">
      <h2>Manage Devices</h2>
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
      <button className="add-device-fab" onClick={() => navigate('/add-device')}>
        + Add New Device
      </button>
    </div>
  );
}

export default ManageDevices; 