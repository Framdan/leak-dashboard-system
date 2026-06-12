/**
 * simulationRoutes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides the Python simulation engine with a single endpoint to retrieve
 * all parameters it needs to run physics-accurate scenarios that match the
 * dashboard configuration.
 *
 * GET  /api/simulation/config   → merged settings + all node configs
 * POST /api/simulation/trigger  → trigger a named scenario for a node
 * GET  /api/simulation/status   → last scenario run status
 *
 * These routes are consumed by:
 *   by_claude_ai/run_simulation.py  (main launcher)
 *   by_claude_ai/tier3_cloud_telemetry_bridge.py  (streamer)
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Settings = require('../models/Settings');
const Node = require('../models/Node');
const asyncHandler = require('../middleware/asyncHandler');

// In-memory store for last simulation trigger (lightweight, no DB needed)
let lastSimulationStatus = {
  triggeredAt: null,
  scenario: null,
  nodeId: null,
  nodeName: null,
  status: 'idle',
  message: 'No simulation triggered yet.'
};

/**
 * GET /api/simulation/config
 * Returns everything the Python simulation engine needs:
 *   - Global settings (thresholds, degradation factor, update interval)
 *   - All node configurations (maop, pipeAge, location, coordinates)
 *
 * The Python engine maps:
 *   settings.degradationFactor / 100  →  lambda (annual degradation rate)
 *   settings.safeThreshold / 100      →  CAUTION threshold multiplier
 *   settings.cautionThreshold / 100   →  WARNING threshold multiplier
 *   settings.maxPressure (PSI)        →  override MAOP ceiling
 *   node.maop (PSI)                   →  MAOP_new for Barlow/MAOP_adj
 *   node.pipeAge                      →  A (years) in MAOP_adj equation
 */
router.get('/config', protect, asyncHandler(async (req, res) => {
  const [settings, nodes] = await Promise.all([
    Settings.getSingleton(),
    Node.find().lean()
  ]);

  // Convert PSI to Bar for the Python engine (1 PSI = 0.0689476 Bar)
  const PSI_TO_BAR = 0.0689476;

  const nodeConfigs = nodes.map(node => ({
    id: node._id,
    deviceId: node.deviceId,
    name: node.name,
    location: node.location,
    latitude: node.latitude,
    longitude: node.longitude,
    maop_psi: node.maop,
    maop_bar: parseFloat((node.maop * PSI_TO_BAR).toFixed(4)),
    pipeAge: node.pipeAge,
    // Pre-computed MAOP_adj using current settings
    lambda: parseFloat(((settings.degradationFactor || 1) / 100).toFixed(5)),
    maopAdj_psi: parseFloat(
      (node.maop * Math.max(0.05, 1 - ((settings.degradationFactor || 1) / 100) * node.pipeAge)).toFixed(4)
    ),
    maopAdj_bar: parseFloat(
      (node.maop * PSI_TO_BAR * Math.max(0.05, 1 - ((settings.degradationFactor || 1) / 100) * node.pipeAge)).toFixed(4)
    ),
    cautionLimit_psi: parseFloat(
      (node.maop * Math.max(0.05, 1 - ((settings.degradationFactor || 1) / 100) * node.pipeAge) * (settings.safeThreshold / 100)).toFixed(4)
    ),
    warningLimit_psi: parseFloat(
      (node.maop * Math.max(0.05, 1 - ((settings.degradationFactor || 1) / 100) * node.pipeAge) * (settings.cautionThreshold / 100)).toFixed(4)
    )
  }));

  res.status(200).json({
    success: true,
    data: {
      settings: {
        safeThreshold_pct: settings.safeThreshold,
        cautionThreshold_pct: settings.cautionThreshold,
        maxPressure_psi: settings.maxPressure,
        maxPressure_bar: parseFloat((settings.maxPressure * PSI_TO_BAR).toFixed(4)),
        degradationFactor_pct: settings.degradationFactor,
        lambda: parseFloat(((settings.degradationFactor || 1) / 100).toFixed(5)),
        updateInterval_s: settings.updateInterval,
        alertCooldown_min: settings.alertCooldown,
        maintenanceMode: settings.maintenanceMode
      },
      nodes: nodeConfigs,
      meta: {
        nodeCount: nodeConfigs.length,
        fetchedAt: new Date().toISOString(),
        psiToBar: PSI_TO_BAR
      }
    }
  });
}));

/**
 * POST /api/simulation/trigger
 * Body: { nodeId, scenario }
 * scenario: "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "interactive"
 *
 * This records the trigger in memory so the Python engine can poll it.
 * The Python engine polls GET /api/simulation/status to detect new triggers.
 */
router.post('/trigger', protect, asyncHandler(async (req, res) => {
  const { nodeId, scenario, params = {} } = req.body;

  if (!nodeId || !scenario) {
    return res.status(400).json({ success: false, error: 'nodeId and scenario are required' });
  }

  const node = await Node.findById(nodeId).lean();
  if (!node) {
    return res.status(404).json({ success: false, error: `Node not found: ${nodeId}` });
  }

  const validScenarios = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'interactive'];
  if (!validScenarios.includes(scenario)) {
    return res.status(400).json({
      success: false,
      error: `Invalid scenario. Must be one of: ${validScenarios.join(', ')}`
    });
  }

  lastSimulationStatus = {
    triggeredAt: new Date().toISOString(),
    scenario,
    nodeId: node._id.toString(),
    nodeName: node.name,
    nodeLocation: node.location,
    params,
    status: 'pending',
    message: `Scenario ${scenario} queued for node "${node.name}" at ${node.location}.`
  };

  res.status(200).json({
    success: true,
    data: lastSimulationStatus
  });
}));

/**
 * GET /api/simulation/status
 * Returns the last simulation trigger status.
 * Python engine polls this at each loop iteration.
 * Once consumed, status is set to "running".
 */
router.get('/status', protect, asyncHandler(async (req, res) => {
  const isPending = lastSimulationStatus.status === 'pending';

  if (isPending) {
    // Mark as running so Python engine doesn't re-trigger
    lastSimulationStatus.status = 'running';
  }

  res.status(200).json({
    success: true,
    data: lastSimulationStatus
  });
}));

/**
 * PUT /api/simulation/status
 * Python engine calls this to update status after completing/failing.
 * Body: { status: "completed"|"error", message, metrics }
 */
router.put('/status', protect, asyncHandler(async (req, res) => {
  const { status, message, metrics } = req.body;
  lastSimulationStatus = {
    ...lastSimulationStatus,
    status: status || lastSimulationStatus.status,
    message: message || lastSimulationStatus.message,
    completedAt: new Date().toISOString(),
    metrics: metrics || null
  };

  res.status(200).json({ success: true, data: lastSimulationStatus });
}));

module.exports = router;
