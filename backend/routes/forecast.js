const express = require('express');
const router  = express.Router();
const {
  getOverviewForecast,
  getProductForecast,
  getCategoryForecast
} = require('../controllers/forecastController');
const { protect, adminOrManager } = require('../middleware/auth');

router.get('/overview',    protect, adminOrManager, getOverviewForecast);
router.get('/products',    protect, adminOrManager, getProductForecast);
router.get('/categories',  protect, adminOrManager, getCategoryForecast);

module.exports = router;
