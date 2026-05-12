import React, { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const NodeContext = createContext();

function NodeProvider({ children }) {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    safeThreshold: 0.7,
    warningThreshold: 0.85,
    updateInterval: 3,
    alertSounds: true,
  });

  const fetchNodes = async () => {
    try {
      setLoading(true);
      const data = await api.get('/nodes');
      // Map _id to id for frontend compatibility and ensure pressure/history exist
      setNodes(data.map(node => ({
        ...node,
        id: node._id,
        pressure: node.pressure || 0,
        history: node.history || []
      })));
    } catch (error) {
      console.error('Error fetching nodes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  const addNode = async (newNodeData) => {
    try {
      const savedNode = await api.post('/nodes', newNodeData);
      setNodes((prev) => [
        ...prev,
        { ...savedNode, id: savedNode._id, history: [] },
      ]);
    } catch (error) {
      console.error('Error adding node:', error);
    }
  };

  const deleteNode = async (id) => {
    try {
      await api.delete(`/nodes/${id}`);
      setNodes((prev) => prev.filter((node) => node.id !== id));
    } catch (error) {
      console.error('Error deleting node:', error);
    }
  };

  const updateNode = async (updatedNodeData) => {
    try {
      const savedNode = await api.put(`/nodes/${updatedNodeData.id}`, updatedNodeData);
      setNodes((prev) =>
        prev.map((node) =>
          node.id === updatedNodeData.id ? { ...savedNode, id: savedNode._id } : node
        )
      );
    } catch (error) {
      console.error('Error updating node:', error);
    }
  };

  return (
    <NodeContext.Provider value={{ 
      nodes, 
      setNodes, 
      addNode, 
      deleteNode, 
      updateNode, 
      settings, 
      setSettings,
      loading 
    }}>
      {children}
    </NodeContext.Provider>
  );
}

export default NodeProvider;