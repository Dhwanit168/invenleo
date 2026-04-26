const express = require('express');
const router  = express.Router();
const { getVariants, createVariant, updateVariant, deleteVariant, adjustStock } = require('../controllers/variantController');
const { protect, adminOnly, adminOrManager } = require('../middleware/auth');

router.route('/')
  .get(protect, getVariants)
  .post(protect, adminOrManager, createVariant);

router.route('/:id')
  .put(protect, adminOrManager, updateVariant)
  .delete(protect, adminOnly, deleteVariant);

router.patch('/:id/stock', protect, adminOrManager, adjustStock);

module.exports = router;
