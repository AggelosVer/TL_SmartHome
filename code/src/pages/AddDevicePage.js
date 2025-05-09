import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddDevicePage.css';

const initialForm = { name: '', type: '', room: '' };

function AddDevicePage({ addDevice, deviceTypes }) {
  const [form, setForm] = useState(initialForm);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.type || !form.room) return;
    addDevice(form);
    navigate('/manage');
  };

  return (
    <div className="add-device-page-container">
      <div className="add-device-card">
        <h2>Add New Device</h2>
        <form onSubmit={handleSubmit} className="add-device-form">
          <input name="name" placeholder="Device Name" value={form.name} onChange={handleChange} />
          <select name="type" value={form.type} onChange={handleChange}>
            <option value="">Select Type</option>
            {deviceTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <input name="room" placeholder="Room" value={form.room} onChange={handleChange} />
          <button type="submit">Add Device</button>
        </form>
      </div>
    </div>
  );
}

export default AddDevicePage; 