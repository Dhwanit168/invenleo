const express = require('express');
const router  = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getCategories } = require('../controllers/productController');
const { protect, adminOnly, adminOrManager } = require('../middleware/auth');

router.get('/categories', protect, getCategories);
router.route('/')
  .get(protect, getProducts)
  .post(protect, adminOrManager, createProduct);

router.route('/:id')
  .get(protect, getProduct)
  .put(protect, adminOrManager, updateProduct)
  .delete(protect, adminOnly, deleteProduct);

module.exports = router;
