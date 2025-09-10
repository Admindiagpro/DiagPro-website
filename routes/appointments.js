const express = require('express');
const { body } = require('express-validator');
const {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getAvailability,
  getDashboard
} = require('../controllers/appointmentController');

const router = express.Router();

// Validation middleware
const appointmentValidation = [
  body('customer')
    .isMongoId()
    .withMessage('Valid customer ID is required'),
  body('vehicle.licensePlate')
    .trim()
    .notEmpty()
    .withMessage('License plate is required'),
  body('vehicle.make')
    .trim()
    .notEmpty()
    .withMessage('Vehicle make is required'),
  body('vehicle.model')
    .trim()
    .notEmpty()
    .withMessage('Vehicle model is required'),
  body('vehicle.year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Please provide a valid year'),
  body('services')
    .isArray({ min: 1 })
    .withMessage('At least one service must be selected'),
  body('services.*.service')
    .isMongoId()
    .withMessage('Valid service ID is required'),
  body('appointmentDate')
    .isISO8601()
    .withMessage('Valid appointment date is required'),
  body('timeSlot.start')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid start time is required (HH:MM format)'),
  body('timeSlot.end')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid end time is required (HH:MM format)')
];

// Special routes
router.get('/availability', getAvailability);
router.get('/dashboard', getDashboard);

// CRUD routes
router.route('/')
  .get(getAppointments)
  .post(appointmentValidation, createAppointment);

router.route('/:id')
  .get(getAppointment)
  .put(updateAppointment);

router.patch('/:id/cancel', cancelAppointment);

module.exports = router;