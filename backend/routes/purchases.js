const express = require('express');
const router  = express.Router();
const { getPurchases, getPurchase, createPurchase, updatePurchaseStatus } = require('../controllers/purchaseController');
const { protect, adminOrManager } = require('../middleware/auth');

router.route('/').get(protect, adminOrManager, getPurchases).post(protect, adminOrManager, createPurchase);
router.route('/:id').get(protect, adminOrManager, getPurchase);
router.patch('/:id/status', protect, adminOrManager, updatePurchaseStatus);

module.exports = router;
