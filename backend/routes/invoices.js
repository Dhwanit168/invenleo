const express  = require('express');
const router   = express.Router();
const { generateSaleInvoice, generatePurchaseInvoice } = require('../controllers/invoiceController');
const { protect, adminOrManager } = require('../middleware/auth');

router.get('/sale/:id', protect, generateSaleInvoice);

router.get('/purchase/:id', protect, adminOrManager, generatePurchaseInvoice);

module.exports = router;
