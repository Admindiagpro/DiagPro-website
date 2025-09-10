import express from 'express';
import { MoyasarService } from '../services/moyasarService.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// POST /api/payments/create - Create payment session
router.post('/create', async (req, res) => {
  try {
    const { bookingId, paymentMethod, returnUrl } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID is required',
        error_ar: 'رقم الحجز مطلوب'
      });
    }

    const booking = await Booking.findById(bookingId).populate('customer');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        error_ar: 'الحجز غير موجود'
      });
    }

    if (booking.payment.status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Booking is already paid',
        error_ar: 'تم دفع قيمة الحجز مسبقاً'
      });
    }

    // Create payment with Moyasar
    const paymentData = {
      amount: Math.round(booking.pricing.totalAmount * 100), // Convert to halalas
      currency: 'SAR',
      description: req.rtl.isRTL ? 
        `حجز رقم ${booking.bookingNumber} - مركز التشخيص الاحترافي` :
        `Booking ${booking.bookingNumber} - DiagPro Service Center`,
      source: {
        type: paymentMethod || 'creditcard',
        name: booking.customer.firstName + ' ' + booking.customer.lastName,
        number: req.body.cardNumber,
        cvc: req.body.cvc,
        month: req.body.month,
        year: req.body.year
      },
      callback_url: returnUrl || `${process.env.FRONTEND_URL}/payment/callback`,
      metadata: {
        booking_id: bookingId,
        customer_id: booking.customer._id.toString(),
        booking_number: booking.bookingNumber
      }
    };

    const paymentResult = await MoyasarService.createPayment(paymentData);

    if (paymentResult.success) {
      // Update booking payment status
      booking.payment.status = 'pending';
      booking.payment.method = paymentMethod;
      booking.payment.transactionId = paymentResult.payment.id;
      await booking.save();

      res.json(res.localized({
        success: true,
        data: {
          paymentId: paymentResult.payment.id,
          status: paymentResult.payment.status,
          paymentUrl: paymentResult.payment.source?.transaction_url,
          amount: booking.pricing.totalAmount,
          currency: booking.pricing.currency
        },
        message: req.rtl.isRTL ? 
          'تم إنشاء جلسة الدفع بنجاح' : 
          'Payment session created successfully'
      }));
    } else {
      res.status(400).json({
        success: false,
        error: paymentResult.error || 'Payment creation failed',
        error_ar: 'فشل في إنشاء عملية الدفع'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create payment',
      error_ar: 'فشل في إنشاء عملية الدفع',
      details: error.message
    });
  }
});

// POST /api/payments/webhook - Handle Moyasar webhook
router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (type === 'payment_paid') {
      const paymentId = data.id;
      const bookingId = data.metadata?.booking_id;
      
      if (bookingId) {
        const booking = await Booking.findById(bookingId);
        
        if (booking && booking.payment.transactionId === paymentId) {
          booking.payment.status = 'paid';
          booking.payment.paidAmount = data.amount / 100; // Convert from halalas
          booking.payment.paidAt = new Date();
          
          // Update booking status to confirmed if it was pending
          if (booking.status === 'pending') {
            await booking.updateStatus('confirmed', 'system', 'Payment confirmed');
          }
          
          await booking.save();
          
          // Here you could trigger notifications, emails, etc.
          console.log(`Payment confirmed for booking ${booking.bookingNumber}`);
        }
      }
    } else if (type === 'payment_failed') {
      const paymentId = data.id;
      const bookingId = data.metadata?.booking_id;
      
      if (bookingId) {
        const booking = await Booking.findById(bookingId);
        
        if (booking && booking.payment.transactionId === paymentId) {
          booking.payment.status = 'failed';
          await booking.save();
          
          console.log(`Payment failed for booking ${booking.bookingNumber}`);
        }
      }
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// GET /api/payments/status/:bookingId - Get payment status
router.get('/status/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        error_ar: 'الحجز غير موجود'
      });
    }

    // Fetch latest payment status from Moyasar if transaction ID exists
    let paymentDetails = null;
    if (booking.payment.transactionId) {
      paymentDetails = await MoyasarService.getPayment(booking.payment.transactionId);
    }

    res.json(res.localized({
      success: true,
      data: {
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        paymentStatus: booking.payment.status,
        paymentMethod: booking.payment.method,
        amount: booking.pricing.totalAmount,
        paidAmount: booking.payment.paidAmount,
        currency: booking.pricing.currency,
        transactionId: booking.payment.transactionId,
        paidAt: booking.payment.paidAt,
        paymentDetails: paymentDetails?.success ? paymentDetails.payment : null
      },
      message: req.rtl.isRTL ? 
        'تم جلب حالة الدفع بنجاح' : 
        'Payment status retrieved successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve payment status',
      error_ar: 'فشل في جلب حالة الدفع',
      details: error.message
    });
  }
});

// POST /api/payments/refund/:bookingId - Process refund
router.post('/refund/:bookingId', async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    const booking = await Booking.findById(req.params.bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        error_ar: 'الحجز غير موجود'
      });
    }

    if (booking.payment.status !== 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Cannot refund unpaid booking',
        error_ar: 'لا يمكن استرداد قيمة حجز غير مدفوع'
      });
    }

    const refundAmount = amount || booking.payment.paidAmount;
    
    if (refundAmount > booking.payment.paidAmount) {
      return res.status(400).json({
        success: false,
        error: 'Refund amount cannot exceed paid amount',
        error_ar: 'مبلغ الاسترداد لا يمكن أن يتجاوز المبلغ المدفوع'
      });
    }

    // Process refund with Moyasar
    const refundResult = await MoyasarService.refundPayment(
      booking.payment.transactionId,
      Math.round(refundAmount * 100) // Convert to halalas
    );

    if (refundResult.success) {
      booking.payment.status = 'refunded';
      booking.payment.refundAmount = refundAmount;
      booking.payment.refundReason = reason;
      await booking.save();

      res.json(res.localized({
        success: true,
        data: {
          refundId: refundResult.refund.id,
          amount: refundAmount,
          currency: booking.pricing.currency,
          status: refundResult.refund.status
        },
        message: req.rtl.isRTL ? 
          'تم معالجة الاسترداد بنجاح' : 
          'Refund processed successfully'
      }));
    } else {
      res.status(400).json({
        success: false,
        error: refundResult.error || 'Refund processing failed',
        error_ar: 'فشل في معالجة الاسترداد'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process refund',
      error_ar: 'فشل في معالجة الاسترداد',
      details: error.message
    });
  }
});

// GET /api/payments/methods - Get available payment methods
router.get('/methods', async (req, res) => {
  try {
    const paymentMethods = [
      {
        id: 'creditcard',
        name: req.rtl.isRTL ? 'بطاقة ائتمانية' : 'Credit Card',
        icon: 'credit-card',
        enabled: true
      },
      {
        id: 'applepay',
        name: req.rtl.isRTL ? 'أبل باي' : 'Apple Pay',
        icon: 'apple-pay',
        enabled: true
      },
      {
        id: 'stcpay',
        name: req.rtl.isRTL ? 'إس تي سي باي' : 'STC Pay',
        icon: 'stc-pay',
        enabled: true
      },
      {
        id: 'cash',
        name: req.rtl.isRTL ? 'نقداً' : 'Cash',
        icon: 'cash',
        enabled: true,
        note: req.rtl.isRTL ? 'الدفع عند الوصول' : 'Pay on arrival'
      }
    ];

    res.json(res.localized({
      success: true,
      data: paymentMethods,
      message: req.rtl.isRTL ? 
        'تم جلب طرق الدفع بنجاح' : 
        'Payment methods retrieved successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve payment methods',
      error_ar: 'فشل في جلب طرق الدفع',
      details: error.message
    });
  }
});

export default router;