const express = require('express');
const router  = express.Router();
const { getSales, getSale, createSale } = require('../controllers/salesController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getSales).post(protect, createSale);
router.route('/:id').get(protect, getSale);

module.exports = router;
