const express = require('express');
const {
  predictFaults,
  getMaintenanceAdvice,
  chatWithAssistant,
  analyzeSymptoms,
  getServiceSuggestions
} = require('../controllers/smartAssistantController');

const router = express.Router();

// Smart assistant routes
router.post('/predict-faults', predictFaults);
router.post('/maintenance-advice', getMaintenanceAdvice);
router.post('/chat', chatWithAssistant);
router.post('/analyze-symptoms', analyzeSymptoms);
router.post('/service-suggestions', getServiceSuggestions);

module.exports = router;