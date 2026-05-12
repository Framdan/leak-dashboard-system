import React, { useEffect, useRef, useContext } from "react";
import "./Alerts.css";
import toast from "react-hot-toast";
import { NodeContext } from "../../context/NodeContext";

export default function Alerts({ nodes }) {
  const { settings } = useContext(NodeContext);
  const previousStatusRef = useRef({});

  const getStatus = (node) => {
    const ratio = node.pressure / node.maop;
    if (ratio >= settings.warningThreshold) return "WARNING";
    if (ratio >= settings.safeThreshold) return "CAUTION";
    return "SAFE";
  };

  useEffect(() => {
    nodes.forEach((node) => {
      const currentStatus = getStatus(node);
      const previousStatus = previousStatusRef.current[node.id];

      if (currentStatus === "WARNING" && previousStatus !== "WARNING") {
        toast.error((t) => (
          <span className="cp-alert-toast">
            🚨 {node.name} at {node.location} is in WARNING state!
            <button onClick={() => toast.dismiss(t.id)} className="cp-alert-toast-btn">
              ✕
            </button>
          </span>
        ), {
          duration: 5000,
        });

        if (settings.alertSounds) {
          const audio = new Audio("/Alert.mp3");
          audio.play().catch(e => console.log("Audio play blocked by browser:", e));
        }
      }

      previousStatusRef.current[node.id] = currentStatus;
    });
  }, [nodes, settings]); 

  const activeAlerts = nodes.filter((node) => getStatus(node) === "WARNING");

  return (
    <div className="cp-alert-card">
      <h3 className="cp-alert-title">
        Alerts (Early Warning System)
      </h3>

      {activeAlerts.length === 0 ? (
        <p className="cp-alert-safe">All systems normal</p>
      ) : (
        <ul className="cp-alert-list">
          {activeAlerts.map((node, index) => (
            <li key={index} className="cp-alert-item">
              🚨 {node.name} at {node.location} is in WARNING state! <br />
              <span style={{fontSize: '14px', fontWeight: '500'}}>Pressure: {node.pressure}/{node.maop}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}