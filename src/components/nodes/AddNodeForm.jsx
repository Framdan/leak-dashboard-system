import React, { useState, useContext } from "react";
import "./AddNodeForm.css";
import { NodeContext } from "../../context/NodeContext";

export default function AddNodeForm() {
  const { addNode } = useContext(NodeContext);

  const [form, setForm] = useState({
    name: "",
    location: "",
    maop: "",
    pipe_age: "",
    latitude: "40.7128",
    longitude: "-74.0060"
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.location || !form.maop || !form.pipe_age) {
      alert("Please fill all required fields");
      return;
    }

    addNode({
      name: form.name,
      location: form.location,
      maop: Number(form.maop),
      pipe_age: Number(form.pipe_age),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude)
    });

    setForm({ 
      name: "", 
      location: "", 
      maop: "", 
      pipe_age: "", 
      latitude: "40.7128", 
      longitude: "-74.0060" 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="cp-form-card">
      <h3 className="cp-form-title">Add New Node</h3>

      <div className="cp-form-grid">
        <input
          placeholder="Node Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="cp-form-input"
        />

        <input
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="cp-form-input"
        />

        <input
          type="number"
          placeholder="MAOP (PSI)"
          value={form.maop}
          onChange={(e) => setForm({ ...form, maop: e.target.value })}
          className="cp-form-input"
        />

        <input
          type="number"
          placeholder="Pipe Age (years)"
          value={form.pipe_age}
          onChange={(e) => setForm({ ...form, pipe_age: e.target.value })}
          className="cp-form-input"
        />

        <input
          type="number"
          placeholder="Latitude"
          value={form.latitude}
          onChange={(e) => setForm({ ...form, latitude: e.target.value })}
          className="cp-form-input"
        />

        <input
          type="number"
          placeholder="Longitude"
          value={form.longitude}
          onChange={(e) => setForm({ ...form, longitude: e.target.value })}
          className="cp-form-input"
        />
      </div>

      <button className="cp-form-submit">
        Add Node
      </button>
    </form>
  );
}