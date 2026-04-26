const express = require('express');
const router  = express.Router();
const { salesReport, purchasesReport, stockReport } = require('../controllers/reportController');
const { protect, adminOrManager } = require('../middleware/auth');

router.get('/sales',     protect, adminOrManager, salesReport);
router.get('/purchases', protect, adminOrManager, purchasesReport);
router.get('/stock',     protect, adminOrManager, stockReport);

module.exports = router;
