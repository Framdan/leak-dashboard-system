/**
 * ingestRoutes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Open (no-JWT) device ingest endpoint.
 * Used by Wokwi ESP32 sketch and any physical IoT hardware.
 *
 * POST /api/ingest
 * Header: X-Device-Secret: <your DEVICE_SECRET env var>
 * Body:   { "deviceId": "sim-xxx", "pressure": 87.3, "source": "wokwi" }
 *
 * The deviceId is matched against Node.deviceId in the database.
 * A PressureReading is created and alert evaluation runs — identical to
 * the authenticated POST /api/readings endpoint.
 *
 * SECURITY:
 *   In production, always set DEVICE_SECRET in your Vercel environment.
 *   Without it set, the middleware logs a warning but allows all requests
 *   (safe for local dev, must be secured for live deployment).
 */

const express  = require('express');
const router   = express.Router();
const Node     = require('../models/Node');
const PressureReading = require('../models/PressureReading');
const asyncHandler = require('../middleware/asyncHandler');
const { deviceSecret } = require('../middleware/deviceSecretMiddleware');
const { evaluateNodeReading } = require('../controllers/alertController');

/**
 * POST /api/ingest
 * Public IoT data ingest — secured by X-Device-Secret header.
 */
router.post('/', deviceSecret, asyncHandler(async (req, res) => {
  const { deviceId, pressure, source = 'wokwi', timestamp } = req.body;

  // Validate required fields
  if (!deviceId) {
    return res.status(400).json({
      success: false,
      error: 'deviceId is required. Use the node\'s deviceId from the dashboard.'
    });
  }

  const parsedPressure = Number(pressure);
  if (!Number.isFinite(parsedPressure) || parsedPressure < 0) {
    return res.status(400).json({
      success: false,
      error: 'pressure must be a valid non-negative number.'
    });
  }

  // Look up node by deviceId (case-insensitive)
  const node = await Node.findOne({ deviceId: String(deviceId).trim().toLowerCase() });
  if (!node) {
    return res.status(404).json({
      success: false,
      error: `No node found with deviceId "${deviceId}". Check Monitoring Nodes in the dashboard.`
    });
  }

  // Parse optional timestamp
  let readingTimestamp;
  if (timestamp) {
    readingTimestamp = new Date(timestamp);
    if (Number.isNaN(readingTimestamp.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid timestamp format.' });
    }
  }

  // Save reading
  const reading = await PressureReading.create({
    nodeId: node._id,
    pressure: parsedPressure,
    source: ['wokwi', 'iot', 'simulation', 'manual'].includes(source) ? source : 'iot',
    ...(readingTimestamp ? { timestamp: readingTimestamp } : {})
  });

  // Run EWS alert evaluation
  const alertEvaluation = await evaluateNodeReading(node, parsedPressure);

  res.status(201).json({
    success: true,
    data: {
      reading: {
        id: reading._id,
        pressure: reading.pressure,
        source: reading.source,
        timestamp: reading.timestamp
      },
      node: {
        id: node._id,
        deviceId: node.deviceId,
        name: node.name,
        location: node.location
      },
      alertEvaluation
    }
  });
}));

/**
 * GET /api/ingest/config?deviceId=kgl-002
 * Public (no auth) — Wokwi fetches node config at startup to stay in sync
 * with the web dashboard's pipeAge, maop, and degradationFactor settings.
 */
router.get('/config', asyncHandler(async (req, res) => {
  const { deviceId } = req.query;
  if (!deviceId) {
    return res.status(400).json({ success: false, error: 'deviceId query param is required.' });
  }

  const node = await Node.findOne({ deviceId: String(deviceId).trim().toLowerCase() });
  if (!node) {
    return res.status(404).json({
      success: false,
      error: `No node found with deviceId "${deviceId}".`
    });
  }

  const Settings = require('../models/Settings');
  const settings = await Settings.getSingleton();
  const lambda = (settings.degradationFactor || 1) / 100;
  const age = node.pipeAge || 0;
  const maopAdj = parseFloat((node.maop * Math.max(0.05, 1 - (lambda * age))).toFixed(2));

  res.status(200).json({
    success: true,
    data: {
      deviceId:         node.deviceId,
      name:             node.name,
      location:         node.location,
      maop:             node.maop,
      pipeAge:          node.pipeAge,
      maopAdj,
      safeThreshold:    settings.safeThreshold,
      cautionThreshold: settings.cautionThreshold,
      degradationFactor: settings.degradationFactor
    }
  });
}));

module.exports = router;

