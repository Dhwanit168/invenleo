const express = require('express');
const router  = express.Router();
const { getLogs, getActions } = require('../controllers/auditController');
const { protect, adminOrManager } = require('../middleware/auth');

router.get('/',       protect, adminOrManager, getLogs);
router.get('/actions', protect, adminOrManager, getActions);

module.exports = router;
