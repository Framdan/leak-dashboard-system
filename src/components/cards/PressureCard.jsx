import React, { useContext } from "react";
import "./PressureCard.css";
import { NodeContext } from "../../context/NodeContext";

export default function PressureCard({ name, pressure, maop }) {
  const { settings } = useContext(NodeContext);
  const ratio = pressure / maop;

  let status = "SAFE";
  let color = "#22c55e"; // bg-green-500

  if (ratio >= settings.warningThreshold) {
    status = "WARNING";
    color = "#ef4444"; // bg-red-500
  } else if (ratio >= settings.safeThreshold) {
    status = "CAUTION";
    color = "#eab308"; // bg-yellow-500
  }

  return (
    <div className="cp-pressure-card">
      <h3 className="cp-pressure-title">{name}</h3>

      <p className="cp-pressure-text">Pressure: {pressure} bar</p>
      <p className="cp-pressure-text">MAOPadj: {maop} bar</p>

      <div className="cp-pressure-badge" style={{ backgroundColor: color }}>
        {status}
      </div>
    </div>
  );
}