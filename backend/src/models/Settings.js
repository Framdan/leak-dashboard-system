const mongoose = require('mongoose');

const DEFAULT_SETTINGS_KEY = 'global';

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: DEFAULT_SETTINGS_KEY,
      unique: true,
      immutable: true
    },
    safeThreshold: {
      type: Number,
      default: 70,
      min: [0, 'Safe threshold must be positive']
    },
    cautionThreshold: {
      type: Number,
      default: 85,
      min: [0, 'Caution threshold must be positive']
    },
    maxPressure: {
      type: Number,
      default: 100,
      min: [0, 'Maximum pressure must be positive']
    },
    degradationFactor: {
      type: Number,
      default: 1,
      min: [0, 'Degradation factor must be positive']
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    alertCooldown: {
      type: Number,
      default: 5,
      min: [0, 'Alert cooldown must be positive']
    },
    dataRetention: {
      type: Number,
      default: 90,
      min: [0, 'Data retention must be positive']
    },
    updateInterval: {
      type: Number,
      default: 5,
      min: [0, 'Update interval must be positive']
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    autoAcknowledgeSafeAlerts: {
      type: Boolean,
      default: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { versionKey: false }
);

settingsSchema.pre('save', function updateTimestamp() {
  this.updatedAt = new Date();
});

settingsSchema.pre('findOneAndUpdate', function updateTimestamp() {
  this.set({ updatedAt: new Date() });
});

settingsSchema.statics.defaults = function defaults() {
  return {
    key: DEFAULT_SETTINGS_KEY,
    safeThreshold: 70,
    cautionThreshold: 85,
    maxPressure: 100,
    degradationFactor: 1,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    alertCooldown: 5,
    dataRetention: 90,
    updateInterval: 5,
    maintenanceMode: false,
    autoAcknowledgeSafeAlerts: true
  };
};

settingsSchema.statics.getSingleton = function getSingleton() {
  return this.findOneAndUpdate(
    { key: DEFAULT_SETTINGS_KEY },
    { $setOnInsert: this.defaults() },
    { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
};

module.exports = mongoose.model('Settings', settingsSchema);
