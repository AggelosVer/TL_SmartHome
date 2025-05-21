class Device {
  constructor({ id, name, room, type, owner, functionState, energyStatus, visibility }) {
    this.id = id;
    this.name = name;
    this.room = room;
    this.type = type;
    this.owner = owner;
    this.functionState = functionState;
    this.energyStatus = energyStatus;
    this.visibility = visibility || 'public';
    this.powerUsage = this.getDefaultPowerUsage();
  }

  getDefaultPowerUsage() {
    switch (this.type) {
      case 'Light':
        return 10; // 10 watts
      case 'Door':
        return 5; // 5 watts when active
      case 'Camera':
        return 15; // 15 watts when recording
      case 'Thermostat':
        return 300; // 300 watts when heating/cooling
      case 'Alarm':
        return 2; // 2 watts when enabled
      default:
        return 0;
    }
  }

  getCurrentPowerUsage() {
    if (this.type === 'Light') {
      return this.functionState === 'on' ? this.powerUsage : 0;
    } else if (this.type === 'Door') {
      return this.functionState === 'unlocked' ? this.powerUsage : 0;
    } else if (this.type === 'Camera') {
      return this.functionState === 'recording' ? this.powerUsage : 0;
    } else if (this.type === 'Thermostat') {
      // Thermostat uses power when actively heating/cooling
      return this.functionState !== 22 ? this.powerUsage : 0;
    } else if (this.type === 'Alarm') {
      return this.functionState === 'enabled' ? this.powerUsage : 0;
    }
    return 0;
  }

  toggle() {
    if (this.type === 'Light') {
      this.functionState = this.functionState === 'on' ? 'off' : 'on';
    } else if (this.type === 'Door') {
      this.functionState = this.functionState === 'locked' ? 'unlocked' : 'locked';
    } else if (this.type === 'Alarm') {
      this.functionState = this.functionState === 'enabled' ? 'disabled' : 'enabled';
    } else if (this.type === 'Camera') {
      this.functionState = this.functionState === 'recording' ? 'idle' : 'recording';
    }
  }

  toJSON() {
    return { ...this };
  }
}

export default Device;
