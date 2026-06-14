/**
 * deviceSecretMiddleware.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight device-secret guard for unauthenticated IoT/Wokwi ingest endpoint.
 * The ESP32 / Wokwi sketch sends the secret in the X-Device-Secret header.
 * Set DEVICE_SECRET in your .env (or Vercel environment variables).
 */

const deviceSecret = (req, res, next) => {
  const secret = process.env.DEVICE_SECRET;

  // If no secret is configured, allow all (dev mode)
  if (!secret) {
    return next();
  }

  const provided = req.headers['x-device-secret'];
  if (!provided || provided !== secret) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing device secret. Include X-Device-Secret header.'
    });
  }

  next();
};

module.exports = { deviceSecret };
