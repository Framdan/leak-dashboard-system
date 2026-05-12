import React, { useState, useContext, useEffect } from 'react';
import './Settings.css';
import { NodeContext } from '../context/NodeContext';
import toast from 'react-hot-toast';
import { Zap, Clock, Bell, AlertTriangle, RotateCcw } from 'lucide-react';

export default function Settings() {
  const { setNodes, settings, setSettings } = useContext(NodeContext);

  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key, value) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear system history and pressure data? This cannot be undone.")) {
      setNodes((prevNodes) =>
        prevNodes.map((node) => ({ ...node, pressure: 0, history: [], }))
      );
      toast.success("System reset successfully.");
    }
  };

  const saveSettings = () => {
    setSettings(localSettings);
    toast.success("Settings saved and applied successfully!");
  }

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);

  return (
    <div className="settings-main">
      <div className="settings-header-wrap">
        <div>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Manage your system configurations and preferences.</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={!hasChanges}
          className={`settings-save-btn ${hasChanges ? "settings-save-active" : "settings-save-disabled"}`}
        >
          Save Changes
        </button>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-box settings-icon-blue">
              <Zap size={24} />
            </div>
            <div>
              <h2 className="settings-card-title">Threshold Configuration</h2>
              <p className="settings-card-subtitle">Set safe and warning parameters (Ratio of MAOP)</p>
            </div>
          </div>

          <div className="settings-card-body">
            <div>
              <label className="settings-label">Safe Threshold</label>
              <div className="settings-input-wrap">
                <input
                  type="number" step="0.01" min="0" max="1"
                  className="settings-input"
                  value={localSettings.safeThreshold}
                  onChange={(e) => handleChange("safeThreshold", parseFloat(e.target.value))}
                />
              </div>
            </div>
            <div>
              <label className="settings-label">Warning Threshold</label>
              <div className="settings-input-wrap">
                <input
                  type="number" step="0.01" min="0" max="1"
                  className="settings-input settings-input-warning"
                  value={localSettings.warningThreshold}
                  onChange={(e) => handleChange("warningThreshold", parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-box settings-icon-purple">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="settings-card-title">Simulation Settings</h2>
              <p className="settings-card-subtitle">Configure data refresh rates</p>
            </div>
          </div>

          <div className="settings-card-body">
            <div>
              <label className="settings-label" style={{marginBottom: "16px"}}>Update Interval</label>
              <div className="settings-interval-grid">
                {[1, 3, 5].map((interval) => (
                  <button
                    key={interval}
                    onClick={() => handleChange("updateInterval", interval)}
                    className={`settings-interval-btn ${localSettings.updateInterval === interval ? "settings-interval-active" : "settings-interval-inactive"}`}
                  >
                    <span className="settings-interval-text">{interval}s</span>
                  </button>
                ))}
              </div>
              <div className="settings-info-box">
                <p className="settings-info-text">
                  Determines how often the mock sensor data updates. Currently prepared for <strong>{localSettings.updateInterval} seconds</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-box settings-icon-amber">
              <Bell size={24} />
            </div>
            <div>
              <h2 className="settings-card-title">Alerts Control</h2>
              <p className="settings-card-subtitle">Manage system notifications</p>
            </div>
          </div>

          <div className="settings-toggle-wrap">
            <label className="settings-toggle-label flex w-full items-center justify-between">
              <div>
                <h3 className="settings-toggle-title">Sound Alerts</h3>
                <p className="settings-toggle-desc">Play an audio chime on warning or danger</p>
              </div>
              <div className="settings-toggle-container">
                <input
                  type="checkbox"
                  style={{display: 'none'}}
                  checked={localSettings.alertSounds}
                  onChange={(e) => handleChange("alertSounds", e.target.checked)}
                />
                <div className={`settings-toggle-track ${localSettings.alertSounds ? 'settings-toggle-track-on' : 'settings-toggle-track-off'}`}></div>
                <div className={`settings-toggle-dot ${localSettings.alertSounds ? 'settings-toggle-dot-on' : ''}`}></div>
              </div>
            </label>
          </div>
        </div>

        <div className="settings-card-danger">
          <div className="settings-card-header">
            <div className="settings-icon-box settings-icon-red">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 className="settings-card-title">System Control</h2>
              <p className="settings-card-subtitle">Destructive actions</p>
            </div>
          </div>

          <div className="settings-card-body" style={{ justifyContent: "flex-end" }}>
            <div className="settings-danger-box">
              <p className="settings-danger-text">
                <strong>Warning:</strong> Resetting the system will immediately clear all current node pressures and purge all historical data. This cannot be undone.
              </p>
            </div>
            <button onClick={handleReset} className="settings-reset-btn">
              <RotateCcw style={{width: '20px', height: '20px', marginRight: '8px'}} />
              <span>Reset System Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}