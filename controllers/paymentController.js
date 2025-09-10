const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const MoyasarService = require('../services/moyasarService');
const { validationResult } = require('express-validator');

const moyasarService = new MoyasarService();

// @desc    Create payment
// @route   POST /api/payments/create
// @access  Private
exports.createPayment = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      amount,
      currency,
      appointmentId,
      customerId,
      cardNumber,
      cvc,
      month,
      year,
      customerName
    } = req.body;

    // Verify appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Create payment with Moyasar
    const paymentData = {
      amount,
      currency,
      description: `Payment for appointment ${appointmentId}`,
      callbackUrl: `${process.env.API_URL}/api/payments/verify`,
      customerName: customerName || customer.fullName,
      cardNumber,
      cvc,
      month,
      year
    };

    const moyasarResponse = await moyasarService.createPayment(paymentData);

    // Update appointment payment status
    appointment.paymentStatus = moyasarResponse.status === 'paid' ? 'paid' : 'pending';
    appointment.paymentMethod = 'moyasar';
    appointment.actualCost = amount;
    
    if (moyasarResponse.status === 'paid') {
      appointment.invoice = {
        invoiceNumber: `INV-${Date.now()}`,
        generatedAt: new Date(),
        paidAt: new Date()
      };
    }

    await appointment.save();

    res.status(200).json({
      success: true,
      data: {
        paymentId: moyasarResponse.id,
        status: moyasarResponse.status,
        amount: moyasarResponse.amount,
        currency: moyasarResponse.currency,
        appointment: appointment._id
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Public (Webhook)
exports.verifyPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    // Verify payment with Moyasar
    const verification = await moyasarService.verifyPayment(paymentId);

    // Find appointment by payment reference
    const appointment = await Appointment.findOne({
      'invoice.invoiceNumber': { $exists: true }
    });

    if (appointment && verification.status === 'paid') {
      appointment.paymentStatus = 'paid';
      appointment.invoice.paidAt = new Date();
      await appointment.save();
    }

    res.status(200).json({
      success: true,
      data: verification
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get payment status
// @route   GET /api/payments/status/:paymentId
// @access  Private
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const verification = await moyasarService.verifyPayment(paymentId);

    res.status(200).json({
      success: true,
      data: verification
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Refund payment
// @route   POST /api/payments/refund
// @access  Private (Admin)
exports.refundPayment = async (req, res, next) => {
  try {
    const { paymentId, amount, reason } = req.body;

    if (!paymentId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID and amount are required'
      });
    }

    // Process refund with Moyasar
    const refund = await moyasarService.refundPayment(paymentId, amount);

    // Update appointment payment status
    const appointment = await Appointment.findOne({
      'invoice.invoiceNumber': { $exists: true }
    });

    if (appointment) {
      appointment.paymentStatus = 'refunded';
      appointment.internalNotes = `${appointment.internalNotes || ''}\nRefund processed: ${reason || 'No reason provided'}`;
      await appointment.save();
    }

    res.status(200).json({
      success: true,
      data: refund,
      message: 'Refund processed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get payment history
// @route   GET /api/payments/history/:customerId
// @access  Private
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get payment history from appointments
    const payments = await Appointment.find({
      customer: customerId,
      paymentStatus: { $in: ['paid', 'partial', 'refunded'] },
      actualCost: { $exists: true }
    })
    .populate('services.service', 'name')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip(startIndex)
    .select('appointmentDate actualCost paymentStatus paymentMethod invoice services');

    const total = await Appointment.countDocuments({
      customer: customerId,
      paymentStatus: { $in: ['paid', 'partial', 'refunded'] }
    });

    // Calculate totals
    const totals = await Appointment.aggregate([
      {
        $match: {
          customer: customerId,
          paymentStatus: { $in: ['paid', 'partial'] },
          actualCost: { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: '$actualCost' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: payments.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary: totals[0] || { totalPaid: 0, totalTransactions: 0 },
      data: payments
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};