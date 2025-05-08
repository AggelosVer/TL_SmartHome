class Device {
  constructor({ id, name, room, type, owner, functionState, energyStatus }) {
    this.id = id;
    this.name = name;
    this.room = room;
    this.type = type;
    this.owner = owner;
    this.functionState = functionState;
    this.energyStatus = energyStatus;
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
    // Thermostat and others can have their own logic
  }

  toJSON() {
    return { ...this };
  }
}

export default Device; 