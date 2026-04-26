const express = require('express');
const router  = express.Router();
const { exportSales, exportPurchases, exportStock } = require('../controllers/exportController');
const { protect, adminOrManager } = require('../middleware/auth');

router.get('/sales',     protect, adminOrManager, exportSales);
router.get('/purchases', protect, adminOrManager, exportPurchases);
router.get('/stock',     protect, adminOrManager, exportStock);

module.exports = router;
