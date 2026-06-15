import React, { useContext, useState, useEffect } from "react";
import "./Dashboard.css";
import { NodeContext } from "../context/NodeContext";
import RealTimePressureChart from "../components/charts/RealTimePressureChart";
import { Radio, Activity, TrendingUp, AlertCircle, Gauge, Zap, Droplets,
  WifiOff, CheckCircle2, TriangleAlert, Clock } from "lucide-react";
import api from "../services/api";

const OFFLINE_AFTER_MS = 10 * 60 * 1000;
const isOffline = (lastUpdate) => !lastUpdate || (Date.now() - new Date(lastUpdate).getTime()) > OFFLINE_AFTER_MS;

const formatAgo = (lastUpdate) => {
  if (!lastUpdate) return "No readings yet";
  const mins = Math.max(Math.floor((Date.now() - new Date(lastUpdate).getTime()) / 60000), 0);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function Dashboard() {
  const { nodes, settings } = useContext(NodeContext);
  const [summary, setSummary] = useState({
    activeSensors: 0, safeCount: 0, cautionCount: 0,
    warningCount: 0, offlineCount: 0, totalSensors: 0,
    averagePressure: 0, averageMaop: 0, utilization: 0, totalAlerts: 0
  });

  const fetchDashboardSummary = async () => {
    try {
      const data = await api.get('/dashboard/summary');
      setSummary(data);
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
    }
  };

  useEffect(() => {
    fetchDashboardSummary();
    const ms = Math.max(Number(settings.updateInterval) || 3, 1) * 1000;
    const interval = setInterval(fetchDashboardSummary, ms);
    return () => clearInterval(interval);
  }, [settings.updateInterval, settings.safeThreshold, settings.warningThreshold, settings.degradationFactor]);

  const { activeSensors, safeCount, cautionCount, warningCount, offlineCount,
    averagePressure: sysPressure, averageMaop: sysMaop, utilization, totalAlerts } = summary;

  // Per-node status calculation
  const getNodeStatus = (node) => {
    if (isOffline(node.lastUpdate)) return { label: "No Data", color: "#9ca3af", bg: "#f3f4f6", Icon: WifiOff };
    const lambda = settings.degradationFactor ?? 0.01;
    const maopAdj = node.maop * Math.max(0.05, 1 - (lambda * (node.pipeAge ?? 0)));
    const ratio = maopAdj > 0 ? node.pressure / maopAdj : 0;
    if (ratio >= settings.warningThreshold) return { label: "Warning", color: "#dc2626", bg: "#fef2f2", Icon: AlertCircle, maopAdj, ratio };
    if (ratio >= settings.safeThreshold)   return { label: "Caution", color: "#ca8a04", bg: "#fefce8", Icon: TriangleAlert, maopAdj, ratio };
    return { label: "Active", color: "#16a34a", bg: "#f0fdf4", Icon: CheckCircle2, maopAdj, ratio };
  };

  // System-level status badge
  let systemLabel = "Safe";
  let sysStatusBg = "#f0fdf4";
  let sysStatusColor = "#15803d";
  let sysProgressColor = "#22c55e";
  if (utilization >= (settings.warningThreshold * 100)) {
    systemLabel = "Danger"; sysStatusBg = "#fef2f2"; sysStatusColor = "#b91c1c"; sysProgressColor = "#ef4444";
  } else if (utilization >= (settings.safeThreshold * 100)) {
    systemLabel = "Caution"; sysStatusBg = "#fefce8"; sysStatusColor = "#a16207"; sysProgressColor = "#eab308";
  } else if (activeSensors === 0) {
    systemLabel = "No Active Nodes"; sysStatusBg = "#f3f4f6"; sysStatusColor = "#4b5563"; sysProgressColor = "#9ca3af";
  }

  return (
    <div className="dash-layout-wrapper">
      {/* Header */}
      <div className="dash-header">
        <h2 className="dash-header-title">System Overview</h2>
        <p className="dash-header-subtitle">Live water pipeline monitoring — Kigali</p>
      </div>

      {/* Metric tiles */}
      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <div>
            <p className="dash-metric-label">Active Nodes</p>
            <h3 className="dash-metric-value">{activeSensors}</h3>
          </div>
          <div className="dash-metric-icon-box dash-icon-blue"><Radio size={24} strokeWidth={2.5} /></div>
        </div>
        <div className="dash-metric-card">
          <div>
            <p className="dash-metric-label">Safe</p>
            <h3 className="dash-metric-value">{safeCount}</h3>
          </div>
          <div className="dash-metric-icon-box dash-icon-green"><Activity size={24} strokeWidth={2.5} /></div>
        </div>
        <div className="dash-metric-card">
          <div>
            <p className="dash-metric-label">Caution</p>
            <h3 className="dash-metric-value">{cautionCount}</h3>
          </div>
          <div className="dash-metric-icon-box dash-icon-yellow"><TrendingUp size={24} strokeWidth={2.5} /></div>
        </div>
        <div className="dash-metric-card">
          <div>
            <p className="dash-metric-label">Warnings</p>
            <h3 className="dash-metric-value">{warningCount}</h3>
          </div>
          <div className="dash-metric-icon-box dash-icon-red"><AlertCircle size={24} strokeWidth={2.5} /></div>
        </div>
        <div className="dash-metric-card">
          <div>
            <p className="dash-metric-label">No Data</p>
            <h3 className="dash-metric-value">{offlineCount}</h3>
          </div>
          <div className="dash-metric-icon-box dash-icon-gray"><WifiOff size={24} strokeWidth={2.5} /></div>
        </div>
      </div>

      {/* Current System Status */}
      <div className="dash-section-card">
        <div className="dash-section-header">
          <h3 className="dash-section-title">Current System Status</h3>
          <div className="dash-status-badge" style={{ backgroundColor: sysStatusBg, color: sysStatusColor }}>
            {systemLabel === "Safe" && <Activity size={15} strokeWidth={2.5} />}
            {systemLabel === "Caution" && <TriangleAlert size={15} strokeWidth={2.5} />}
            {systemLabel === "Danger" && <AlertCircle size={15} strokeWidth={2.5} />}
            {(systemLabel === "No Active Nodes") && <WifiOff size={15} strokeWidth={2.5} />}
            <span>{systemLabel}</span>
          </div>
        </div>

        {/* System-wide KPIs */}
        <div className="dash-stats-row">
          <div className="dash-stat-item">
            <div className="dash-metric-icon-box dash-icon-blue"><Gauge size={24} strokeWidth={2.5} /></div>
            <div>
              <p className="dash-stat-label">Avg. Pressure</p>
              <p className="dash-stat-value">{sysPressure.toFixed(2)} PSI</p>
            </div>
          </div>
          <div className="dash-stat-item">
            <div className="dash-metric-icon-box dash-icon-purple"><Droplets size={24} strokeWidth={2.5} /></div>
            <div>
              <p className="dash-stat-label">Avg. MAOPadj</p>
              <p className="dash-stat-value">{sysMaop.toFixed(0)} PSI</p>
            </div>
          </div>
          <div className="dash-stat-item">
            <div className="dash-metric-icon-box dash-icon-orange"><Zap size={24} strokeWidth={2.5} /></div>
            <div>
              <p className="dash-stat-label">Utilization</p>
              <p className="dash-stat-value">{utilization.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* System pressure bar */}
        <div style={{ marginTop: '1rem' }}>
          <div className="dash-progress-header">
            <p className="dash-progress-label">System Pressure Level</p>
            <p className="dash-progress-value">{sysPressure.toFixed(2)} / {sysMaop.toFixed(0)} PSI</p>
          </div>
          <div className="dash-progress-track">
            <div className="dash-progress-fill" style={{ width: `${Math.min(utilization, 100)}%`, backgroundColor: sysProgressColor }} />
          </div>
          <div className="dash-progress-legend">
            <span>0%</span>
            <span className="dash-text-green">{Math.round(settings.safeThreshold * 100)}% Safe</span>
            <span className="dash-text-yellow">{Math.round(settings.warningThreshold * 100)}% Caution</span>
            <span>100%</span>
          </div>
        </div>

        {/* ─── Per-Node Status Rows ─── */}
        <div className="dash-node-rows">
          <h4 className="dash-node-rows-title">Node Status Breakdown</h4>
          {nodes.length === 0 ? (
            <p className="dash-node-rows-empty">No nodes registered. Add nodes in Monitoring Nodes.</p>
          ) : (
            nodes.map((node) => {
              const { label, color, bg, Icon, maopAdj, ratio } = getNodeStatus(node);
              const lambda = settings.degradationFactor ?? 0.01;
              const computedMaop = maopAdj ?? node.maop * Math.max(0.05, 1 - (lambda * (node.pipeAge ?? 0)));
              const computedRatio = ratio ?? 0;
              const utilPct = (computedRatio * 100).toFixed(1);
              const offline = isOffline(node.lastUpdate);

              return (
                <div key={node.id} className="dash-node-row-item" style={{ borderLeftColor: color }}>
                  <div className="dash-node-row-left">
                    <div className="dash-node-row-dot" style={{ backgroundColor: color }} />
                    <div>
                      <p className="dash-node-row-name">{node.name}</p>
                      <p className="dash-node-row-loc">{node.location}</p>
                    </div>
                  </div>

                  <div className="dash-node-row-mid">
                    {offline ? (
                      <p className="dash-node-row-no-data">Awaiting data…</p>
                    ) : (
                      <>
                        <div className="dash-node-row-stat">
                          <span className="dash-node-row-stat-label">Pressure</span>
                          <span className="dash-node-row-stat-val">{node.pressure.toFixed(1)} PSI</span>
                        </div>
                        <div className="dash-node-row-stat">
                          <span className="dash-node-row-stat-label">MAOPadj</span>
                          <span className="dash-node-row-stat-val">{computedMaop.toFixed(1)} PSI</span>
                        </div>
                        <div className="dash-node-row-stat">
                          <span className="dash-node-row-stat-label">Utilization</span>
                          <span className="dash-node-row-stat-val">{utilPct}%</span>
                        </div>
                        {/* Mini utilization bar */}
                        <div className="dash-node-row-bar-wrap">
                          <div className="dash-node-row-bar-fill" style={{ width: `${Math.min(utilPct, 100)}%`, backgroundColor: color }} />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="dash-node-row-right">
                    <div className="dash-node-row-badge" style={{ backgroundColor: bg, color }}>
                      <Icon size={13} strokeWidth={2.5} />
                      <span>{label}</span>
                    </div>
                    <div className="dash-node-row-time">
                      <Clock size={11} />
                      <span>{formatAgo(node.lastUpdate)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Live Pressure Chart */}
      <RealTimePressureChart />

    </div>
  );
}
