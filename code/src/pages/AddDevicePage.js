import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddDevicePage.css';

function AddDevicePage({ addDevice, deviceTypes }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    room: '',
    type: '',
    visibility: 'public'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addDevice(formData);
    navigate('/manage');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="add-device-container">
      <h2>Add New Device</h2>
      
      <form className="add-device-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-group">
            <label htmlFor="name">Device Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter device name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="room">Room</label>
            <input
              type="text"
              id="room"
              name="room"
              value={formData.room}
              onChange={handleChange}
              placeholder="Enter room name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Device Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="">Select device type</option>
              {deviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Visibility Settings</h3>
          <div className="visibility-toggle">
            <label className={`toggle-option ${formData.visibility === 'public' ? 'active' : ''}`}>
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={formData.visibility === 'public'}
                onChange={handleChange}
              />
              <span className="toggle-label">
                <span className="icon">🌐</span>
                Public
                <span className="description">Visible to all users</span>
              </span>
            </label>
            <label className={`toggle-option ${formData.visibility === 'private' ? 'active' : ''}`}>
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={formData.visibility === 'private'}
                onChange={handleChange}
              />
              <span className="toggle-label">
                <span className="icon">🔒</span>
                Private
                <span className="description">Admin only</span>
              </span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="add-button">Add Device</button>
          <button type="button" className="cancel-button" onClick={() => navigate('/manage')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddDevicePage;