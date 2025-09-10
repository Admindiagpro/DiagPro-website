const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  addVehicle,
  updateVehicle,
  removeVehicle
} = require('../controllers/customerController');

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .matches(/^[+]?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const vehicleValidation = [
  body('make')
    .trim()
    .notEmpty()
    .withMessage('Vehicle make is required'),
  body('model')
    .trim()
    .notEmpty()
    .withMessage('Vehicle model is required'),
  body('year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Please provide a valid year'),
  body('licensePlate')
    .trim()
    .notEmpty()
    .withMessage('License plate is required')
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', login);

// Customer management routes
router.route('/')
  .get(getCustomers);

router.route('/:id')
  .get(getCustomer)
  .put(updateCustomer)
  .delete(deleteCustomer);

// Vehicle management routes
router.route('/:id/vehicles')
  .post(vehicleValidation, addVehicle);

router.route('/:id/vehicles/:vehicleId')
  .put(updateVehicle)
  .delete(removeVehicle);

module.exports = router;