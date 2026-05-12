import React, { useContext } from "react";
import "./DashboardSensorRow.css";
import { NodeContext } from "../../context/NodeContext";
import { CheckCircle2, TriangleAlert, AlertCircle } from "lucide-react";

export default function DashboardSensorRow({ node }) {
  const { settings } = useContext(NodeContext);

  const ratio = node.pressure / node.maop;
  let percentage = (ratio * 100).toFixed(1);
  if (isNaN(percentage)) percentage = "0.0";

  let status = "Safe";
  let dotColor = "#4ade80";
  let badgeProps = { bg: "#f0fdf4", color: "#16a34a" };
  let Icon = CheckCircle2;

  if (ratio >= settings.warningThreshold) {
    status = "Warning";
    dotColor = "#f87171";
    badgeProps = { bg: "#fef2f2", color: "#dc2626" };
    Icon = AlertCircle;
  } else if (ratio >= settings.safeThreshold) {
    status = "Caution";
    dotColor = "#facc15";
    badgeProps = { bg: "#fefce8", color: "#ca8a04" };
    Icon = TriangleAlert;
  }

  return (
    <div className="dash-sensor-card">
      <div className="dash-sensor-left">
        <div className="dash-sensor-dot" style={{ backgroundColor: dotColor }}></div>
        <div>
          <h3 className="dash-sensor-title">{node.name}</h3>
          <p className="dash-sensor-loc">{node.location}</p>
        </div>
      </div>

      <div className="dash-sensor-right">
        <div className="dash-sensor-stats">
          <p className="dash-sensor-psi">{node.pressure.toFixed(1)} PSI</p>
          <p className="dash-sensor-pct">{percentage}%</p>
        </div>

        <div className="dash-sensor-badge" style={{ backgroundColor: badgeProps.bg, color: badgeProps.color }}>
          <Icon size={14} strokeWidth={2.5} />
          <span>{status}</span>
        </div>
      </div>
    </div>
  );
}
