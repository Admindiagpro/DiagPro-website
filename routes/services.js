const express = require('express');
const { body } = require('express-validator');
const {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  getCategories,
  getPopularServices,
  getRecommendations,
  updatePopularity
} = require('../controllers/serviceController');

const router = express.Router();

// Validation middleware
const serviceValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Service name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('category')
    .isIn([
      'maintenance', 'repair', 'diagnostic', 'inspection', 'bodywork',
      'electrical', 'engine', 'transmission', 'brakes', 'suspension',
      'tires', 'ac_heating', 'detailing', 'other'
    ])
    .withMessage('Please provide a valid category'),
  body('basePrice')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  body('duration')
    .isInt({ min: 15 })
    .withMessage('Duration must be at least 15 minutes')
];

// Public routes
router.get('/categories', getCategories);
router.get('/popular', getPopularServices);
router.get('/recommendations', getRecommendations);

router.route('/')
  .get(getServices)
  .post(serviceValidation, createService);

router.route('/:id')
  .get(getService)
  .put(updateService)
  .delete(deleteService);

router.patch('/:id/popularity', updatePopularity);

module.exports = router;