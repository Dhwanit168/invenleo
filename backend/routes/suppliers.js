const express = require('express');
const router  = express.Router();
const { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');
const { protect, adminOnly, adminOrManager } = require('../middleware/auth');

router.route('/')
  .get(protect, getSuppliers)
  .post(protect, adminOrManager, createSupplier);   

router.route('/:id')
  .get(protect, getSupplier)
  .put(protect, adminOrManager, updateSupplier)     
  .delete(protect, adminOnly, deleteSupplier);

module.exports = router;
