import React, { useContext, useEffect, useMemo, useState } from 'react';
import './Settings.css';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Database,
  Loader2,
  RefreshCcw,
  RotateCcw,
  Save,
  Server,
  SlidersHorizontal,
  Users
} from 'lucide-react';
import settingsService from '../services/settingsService';
import { NodeContext } from '../context/NodeContext';

const fallbackSettings = {
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

const numericFields = [
  'safeThreshold',
  'cautionThreshold',
  'maxPressure',
  'degradationFactor',
  'alertCooldown',
  'dataRetention',
  'updateInterval'
];

const normalizeSettings = (settings) => ({
  safeThreshold: Number(settings.safeThreshold),
  cautionThreshold: Number(settings.cautionThreshold),
  maxPressure: Number(settings.maxPressure),
  degradationFactor: Number(settings.degradationFactor),
  emailNotifications: Boolean(settings.emailNotifications),
  smsNotifications: Boolean(settings.smsNotifications),
  pushNotifications: Boolean(settings.pushNotifications),
  alertCooldown: Number(settings.alertCooldown),
  dataRetention: Number(settings.dataRetention),
  updateInterval: Number(settings.updateInterval),
  maintenanceMode: Boolean(settings.maintenanceMode),
  autoAcknowledgeSafeAlerts: Boolean(settings.autoAcknowledgeSafeAlerts)
});

export default function Settings() {
  const { applyBackendSettings } = useContext(NodeContext);
  const [settings, setSettings] = useState(fallbackSettings);
  const [savedSettings, setSavedSettings] = useState(fallbackSettings);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [settingsData, statusData] = await Promise.all([
        settingsService.getSettings(),
        settingsService.getSystemStatus()
      ]);
      const nextSettings = normalizeSettings({ ...fallbackSettings, ...settingsData });
      setSettings(nextSettings);
      setSavedSettings(nextSettings);
      applyBackendSettings(nextSettings);
      setSystemStatus(statusData);
    } catch (error) {
      toast.error(error.message || 'Unable to load settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const validationErrors = useMemo(() => {
    const errors = {};

    numericFields.forEach((field) => {
      const value = Number(settings[field]);
      if (settings[field] === '' || !Number.isFinite(value)) {
        errors[field] = 'Required';
      } else if (value <= 0) {
        errors[field] = 'Must be positive';
      }
    });

    if (!errors.safeThreshold && !errors.cautionThreshold && Number(settings.safeThreshold) >= Number(settings.cautionThreshold)) {
      errors.safeThreshold = 'Safe must be below caution';
      errors.cautionThreshold = 'Caution must be above safe';
    }

    if (!errors.cautionThreshold && !errors.maxPressure && Number(settings.cautionThreshold) >= Number(settings.maxPressure)) {
      errors.cautionThreshold = 'Caution must be below maximum';
      errors.maxPressure = 'Maximum must be above caution';
    }

    return errors;
  }, [settings]);

  const hasChanges = JSON.stringify(normalizeSettings(settings)) !== JSON.stringify(normalizeSettings(savedSettings));
  const hasErrors = Object.keys(validationErrors).length > 0;

  const updateField = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const saveSettings = async () => {
    if (hasErrors) {
      toast.error('Please fix validation errors before saving.');
      return;
    }

    try {
      setSaving(true);
      const saved = await settingsService.updateSettings(normalizeSettings(settings));
      const nextSettings = normalizeSettings({ ...fallbackSettings, ...saved });
      setSettings(nextSettings);
      setSavedSettings(nextSettings);
      applyBackendSettings(nextSettings);
      toast.success('Settings saved successfully.');
    } catch (error) {
      toast.error(error.message || 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    try {
      setResetting(true);
      const resetSettings = await settingsService.resetSettings();
      const nextSettings = normalizeSettings({ ...fallbackSettings, ...resetSettings });
      setSettings(nextSettings);
      setSavedSettings(nextSettings);
      applyBackendSettings(nextSettings);
      setShowResetModal(false);
      toast.success('Settings reset to defaults.');
    } catch (error) {
      toast.error(error.message || 'Unable to reset settings.');
    } finally {
      setResetting(false);
    }
  };

  const NumberField = ({ label, field, helper, step = '1' }) => (
    <div>
      <label className="settings-label">{label}</label>
      <input
        type="number"
        min="0"
        step={step}
        className="settings-input"
        value={settings[field]}
        onChange={(event) => updateField(field, event.target.value)}
        style={validationErrors[field] ? { borderColor: '#ef4444' } : undefined}
      />
      <p className="settings-info-text" style={{ marginTop: 8 }}>{helper}</p>
      {validationErrors[field] && (
        <p className="settings-danger-text" style={{ marginTop: 6 }}>{validationErrors[field]}</p>
      )}
    </div>
  );

  const ToggleRow = ({ title, description, field }) => (
    <label className="settings-toggle-label">
      <div>
        <h3 className="settings-toggle-title">{title}</h3>
        <p className="settings-toggle-desc">{description}</p>
      </div>
      <div className="settings-toggle-container">
        <input
          type="checkbox"
          style={{ display: 'none' }}
          checked={Boolean(settings[field])}
          onChange={(event) => updateField(field, event.target.checked)}
        />
        <div className={`settings-toggle-track ${settings[field] ? 'settings-toggle-track-on' : 'settings-toggle-track-off'}`}></div>
        <div className={`settings-toggle-dot ${settings[field] ? 'settings-toggle-dot-on' : ''}`}></div>
      </div>
    </label>
  );

  const ThresholdSlider = ({ label, field, helper }) => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <label className="settings-label">{label}</label>
        <strong>{settings[field]}%</strong>
      </div>
      <input
        type="range"
        min="1"
        max="99"
        step="1"
        value={settings[field]}
        onChange={(event) => updateField(field, Number(event.target.value))}
        style={{ width: '100%', accentColor: '#2563eb' }}
      />
      <p className="settings-info-text" style={{ marginTop: 8 }}>{helper}</p>
      {validationErrors[field] && (
        <p className="settings-danger-text" style={{ marginTop: 6 }}>{validationErrors[field]}</p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="settings-main">
        <div className="settings-card" style={{ alignItems: 'center', gap: 16 }}>
          <Loader2 size={32} />
          <p className="settings-subtitle">Loading admin settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-main">
      <div className="settings-header-wrap">
        <div>
          <h1 className="settings-title">Admin Settings</h1>
          <p className="settings-subtitle">Configure system parameters and preferences</p>
        </div>
        <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button onClick={() => setShowResetModal(true)} className="settings-reset-btn" style={{ width: 'auto' }}>
            <RotateCcw size={18} style={{ marginRight: 8 }} />
            Reset to Defaults
          </button>
          <button
            onClick={saveSettings}
            disabled={!hasChanges || saving || hasErrors}
            className={`settings-save-btn ${hasChanges && !hasErrors ? 'settings-save-active' : 'settings-save-disabled'}`}
            style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            {saving ? <Loader2 size={18} /> : <Save size={18} />}
            {saving ? 'Saving...' : hasChanges ? 'Save Settings' : 'Saved ✓'}
          </button>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-box settings-icon-blue">
              <SlidersHorizontal size={24} />
            </div>
            <div>
              <h2 className="settings-card-title">Threshold Configuration</h2>
              <p className="settings-card-subtitle">MAOPadj pressure thresholds</p>
            </div>
          </div>

          <div className="settings-card-body">
            <ThresholdSlider
              label="Safe Threshold (%)"
              field="safeThreshold"
              helper="Pressure below this is considered safe"
            />
            <ThresholdSlider
              label="Caution Threshold (%)"
              field="cautionThreshold"
              helper="Triggers increased monitoring"
            />
            <NumberField
              label="Maximum Threshold (PSI)"
              field="maxPressure"
              helper="Maximum allowable pressure (MAOPadj)"
            />
            <NumberField
              label="Degradation Factor"
              field="degradationFactor"
              helper="Multiplier applied to long-term pressure degradation"
              step="0.01"
            />
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-box settings-icon-amber">
              <Bell size={24} />
            </div>
            <div>
              <h2 className="settings-card-title">Alert Configuration</h2>
              <p className="settings-card-subtitle">Notification preferences</p>
            </div>
          </div>

          <div className="settings-card-body">
            <ToggleRow title="Email Notifications" description="Receive alerts via email" field="emailNotifications" />
            <ToggleRow title="SMS Notifications" description="Receive alerts via SMS" field="smsNotifications" />
            <ToggleRow title="Push Notifications" description="Receive browser push notifications" field="pushNotifications" />
            <NumberField
              label="Alert Cooldown (minutes)"
              field="alertCooldown"
              helper="Minimum wait before repeating an alert"
            />
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-box settings-icon-purple">
              <Database size={24} />
            </div>
            <div>
              <h2 className="settings-card-title">System Configuration</h2>
              <p className="settings-card-subtitle">Data and performance settings</p>
            </div>
          </div>

          <div className="settings-card-body">
            <NumberField
              label="Data Retention (days)"
              field="dataRetention"
              helper="How long to keep historical data"
            />
            <NumberField
              label="Update Interval (seconds)"
              field="updateInterval"
              helper="Frequency of simulated data updates"
            />
            <ToggleRow title="Maintenance Mode" description="Pause all alerts during maintenance" field="maintenanceMode" />
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-box" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
              <Users size={24} />
            </div>
            <div>
              <h2 className="settings-card-title">User Preferences</h2>
              <p className="settings-card-subtitle">Account and display settings</p>
            </div>
          </div>

          <div className="settings-card-body">
            <ToggleRow
              title="Auto-acknowledge Safe Alerts"
              description="Automatically acknowledge when status returns to safe"
              field="autoAcknowledgeSafeAlerts"
            />
            <div className="settings-info-box" style={{ borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Server size={24} color="#2563eb" />
                <div>
                  <h3 className="settings-toggle-title" style={{ color: '#1d4ed8' }}>System Status</h3>
                  <p className="settings-toggle-desc" style={{ color: '#1d4ed8' }}>
                    {systemStatus?.message || 'System status unavailable.'}
                  </p>
                  <p className="settings-toggle-desc" style={{ marginTop: 8 }}>
                    Status: {systemStatus?.status || 'Unknown'} | Simulation nodes: {systemStatus?.activeDevices ?? 0} | Open alerts: {systemStatus?.unresolvedAlerts ?? 0}
                  </p>
                </div>
              </div>
              <button
                onClick={loadSettings}
                className="settings-reset-btn"
                style={{ width: 'auto', marginTop: 16 }}
              >
                <RefreshCcw size={16} style={{ marginRight: 8 }} />
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      </div>

      {showResetModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(17, 24, 39, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          zIndex: 50
        }}>
          <div className="settings-card" style={{ maxWidth: 420, width: '100%' }}>
            <div className="settings-card-header">
              <div className="settings-icon-box settings-icon-red">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h2 className="settings-card-title">Reset Settings?</h2>
                <p className="settings-card-subtitle">This will restore all settings to their default values.</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="settings-reset-btn" style={{ width: 'auto' }} onClick={() => setShowResetModal(false)}>
                Cancel
              </button>
              <button className="settings-save-btn settings-save-active" style={{ width: 'auto' }} onClick={resetToDefaults}>
                {resetting ? <Loader2 size={18} /> : <CheckCircle2 size={18} />}
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
