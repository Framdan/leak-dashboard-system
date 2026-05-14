const express = require('express');
const router = express.Router();
const { createPressureReading } = require('../controllers/readingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createPressureReading);

module.exports = router;
