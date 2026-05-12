const express = require('express');
const router = express.Router();
const {
  getNodes,
  createNode,
  deleteNode,
  updateNode
} = require('../controllers/nodeController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

router.route('/')
  .get(getNodes)
  .post(createNode);

router.route('/:id')
  .delete(deleteNode)
  .put(updateNode);

module.exports = router;
