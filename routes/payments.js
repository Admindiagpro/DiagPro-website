const express = require('express');
const { body } = require('express-validator');
const {
  createPayment,
  verifyPayment,
  getPaymentStatus,
  refundPayment,
  getPaymentHistory
} = require('../controllers/paymentController');

const router = express.Router();

// Validation middleware
const paymentValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('currency')
    .isIn(['SAR', 'USD'])
    .withMessage('Currency must be SAR or USD'),
  body('appointmentId')
    .isMongoId()
    .withMessage('Valid appointment ID is required'),
  body('customerId')
    .isMongoId()
    .withMessage('Valid customer ID is required')
];

// Payment routes
router.post('/create', paymentValidation, createPayment);
router.post('/verify', verifyPayment);
router.get('/status/:paymentId', getPaymentStatus);
router.post('/refund', refundPayment);
router.get('/history/:customerId', getPaymentHistory);

module.exports = router;