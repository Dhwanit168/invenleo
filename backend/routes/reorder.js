const express  = require('express');
const router   = express.Router();
const {
  getSuggestions,
  checkAndCreateSuggestions,
  approveSuggestion,
  cancelSuggestion,
  getPendingCount
} = require('../controllers/reorderController');
const { protect, adminOrManager } = require('../middleware/auth');

router.get('/suggestions',       protect, adminOrManager, getSuggestions);
router.get('/suggestions/count', protect, getPendingCount);         
router.post('/check',            protect, adminOrManager, checkAndCreateSuggestions);
router.patch('/suggestions/:id/approve', protect, adminOrManager, approveSuggestion);
router.patch('/suggestions/:id/cancel',  protect, adminOrManager, cancelSuggestion);

module.exports = router;
