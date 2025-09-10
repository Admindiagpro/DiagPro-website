import express from 'express';
import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';
import Service from '../models/Service.js';
import { validateBooking, validateBookingUpdate } from '../validators/bookingValidator.js';

const router = express.Router();

// GET /api/bookings - Get all bookings with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Filter by customer
    if (req.query.customerId) {
      filter.customer = req.query.customerId;
    }
    
    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      filter.scheduledDate = {};
      if (req.query.startDate) {
        filter.scheduledDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.scheduledDate.$lte = new Date(req.query.endDate);
      }
    }
    
    // Filter by payment status
    if (req.query.paymentStatus) {
      filter['payment.status'] = req.query.paymentStatus;
    }
    
    // Filter by vehicle plate number
    if (req.query.plateNumber) {
      filter['vehicle.plateNumber'] = new RegExp(req.query.plateNumber, 'i');
    }

    const bookings = await Booking.find(filter)
      .populate('customer', 'firstName lastName firstName_ar lastName_ar email phone')
      .populate('services.service', 'name name_ar category category_ar')
      .select('-__v')
      .sort({ scheduledDate: -1, scheduledTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json(res.localized({
      success: true,
      data: bookings,
      pagination: {
        currentPage: page,
        totalPages,
        totalBookings: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      message: req.rtl.isRTL ? 
        'تم جلب الحجوزات بنجاح' : 
        'Bookings retrieved successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve bookings',
      error_ar: 'فشل في جلب الحجوزات',
      details: error.message
    });
  }
});

// GET /api/bookings/available-slots - Get available time slots for a date
router.get('/available-slots', async (req, res) => {
  try {
    const { date, duration } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date is required',
        error_ar: 'التاريخ مطلوب'
      });
    }

    const slots = await Booking.getAvailableSlots(
      new Date(date), 
      parseInt(duration) || 60
    );

    res.json(res.localized({
      success: true,
      data: {
        date,
        availableSlots: slots,
        duration: parseInt(duration) || 60
      },
      message: req.rtl.isRTL ? 
        'تم جلب المواعيد المتاحة بنجاح' : 
        'Available slots retrieved successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve available slots',
      error_ar: 'فشل في جلب المواعيد المتاحة',
      details: error.message
    });
  }
});

// GET /api/bookings/dashboard - Get booking statistics for dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayBookings,
      pendingBookings,
      completedToday,
      totalRevenue,
      monthlyStats
    ] = await Promise.all([
      Booking.countDocuments({
        scheduledDate: { $gte: today, $lt: tomorrow },
        status: { $nin: ['cancelled'] }
      }),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({
        scheduledDate: { $gte: today, $lt: tomorrow },
        status: 'completed'
      }),
      Booking.aggregate([
        { $match: { status: 'completed', 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
      ]),
      Booking.aggregate([
        {
          $match: {
            createdAt: { 
              $gte: new Date(today.getFullYear(), today.getMonth(), 1) 
            }
          }
        },
        {
          $group: {
            _id: { $dayOfMonth: '$createdAt' },
            count: { $sum: 1 },
            revenue: { $sum: '$pricing.totalAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json(res.localized({
      success: true,
      data: {
        todayBookings,
        pendingBookings,
        completedToday,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyStats
      },
      message: req.rtl.isRTL ? 
        'تم جلب إحصائيات الحجوزات بنجاح' : 
        'Booking dashboard data retrieved successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard data',
      error_ar: 'فشل في جلب بيانات لوحة المتابعة',
      details: error.message
    });
  }
});

// GET /api/bookings/:id - Get booking by ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'firstName lastName firstName_ar lastName_ar email phone address')
      .populate('services.service', 'name name_ar description description_ar category category_ar');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        error_ar: 'الحجز غير موجود'
      });
    }

    res.json(res.localized({
      success: true,
      data: booking,
      message: req.rtl.isRTL ? 
        'تم جلب بيانات الحجز بنجاح' : 
        'Booking retrieved successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve booking',
      error_ar: 'فشل في جلب بيانات الحجز',
      details: error.message
    });
  }
});

// POST /api/bookings - Create new booking
router.post('/', validateBooking, async (req, res) => {
  try {
    // Verify customer exists
    const customer = await Customer.findById(req.body.customer);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
        error_ar: 'العميل غير موجود'
      });
    }

    // Verify services exist and calculate pricing
    let subtotal = 0;
    const servicesWithPricing = [];

    for (const serviceItem of req.body.services) {
      const service = await Service.findById(serviceItem.service);
      if (!service) {
        return res.status(404).json({
          success: false,
          error: `Service not found: ${serviceItem.service}`,
          error_ar: `الخدمة غير موجودة: ${serviceItem.service}`
        });
      }

      const unitPrice = service.calculatePrice(req.body.vehicle?.type);
      const totalPrice = unitPrice * (serviceItem.quantity || 1);
      
      servicesWithPricing.push({
        ...serviceItem,
        unitPrice,
        totalPrice,
        estimatedDuration: service.estimatedDuration
      });

      subtotal += totalPrice;
    }

    // Calculate total estimated duration
    const estimatedDuration = servicesWithPricing.reduce(
      (total, service) => total + (service.estimatedDuration * service.quantity), 
      0
    );

    // Create booking
    const bookingData = {
      ...req.body,
      services: servicesWithPricing,
      estimatedDuration,
      pricing: {
        subtotal,
        taxRate: 0.15,
        taxAmount: subtotal * 0.15,
        discountAmount: req.body.discountAmount || 0,
        totalAmount: subtotal + (subtotal * 0.15) - (req.body.discountAmount || 0),
        currency: 'SAR'
      }
    };

    const booking = new Booking(bookingData);
    await booking.save();

    // Update customer statistics
    customer.totalBookings += 1;
    customer.lastVisit = new Date();
    await customer.save();

    // Populate the booking for response
    await booking.populate('customer', 'firstName lastName firstName_ar lastName_ar email phone');
    await booking.populate('services.service', 'name name_ar category category_ar');

    res.status(201).json(res.localized({
      success: true,
      data: booking,
      message: req.rtl.isRTL ? 
        'تم إنشاء الحجز بنجاح' : 
        'Booking created successfully'
    }));
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to create booking',
      error_ar: 'فشل في إنشاء الحجز',
      details: error.message
    });
  }
});

// PUT /api/bookings/:id - Update booking
router.put('/:id', validateBookingUpdate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        error_ar: 'الحجز غير موجود'
      });
    }

    // Check if booking can be modified
    if (!booking.canBeModified()) {
      return res.status(400).json({
        success: false,
        error: 'Booking cannot be modified in current status',
        error_ar: 'لا يمكن تعديل الحجز في الحالة الحالية'
      });
    }

    // If services are being updated, recalculate pricing
    if (req.body.services) {
      let subtotal = 0;
      const servicesWithPricing = [];

      for (const serviceItem of req.body.services) {
        const service = await Service.findById(serviceItem.service);
        if (!service) {
          return res.status(404).json({
            success: false,
            error: `Service not found: ${serviceItem.service}`,
            error_ar: `الخدمة غير موجودة: ${serviceItem.service}`
          });
        }

        const unitPrice = service.calculatePrice();
        const totalPrice = unitPrice * (serviceItem.quantity || 1);
        
        servicesWithPricing.push({
          ...serviceItem,
          unitPrice,
          totalPrice,
          estimatedDuration: service.estimatedDuration
        });

        subtotal += totalPrice;
      }

      req.body.services = servicesWithPricing;
      req.body.pricing = {
        subtotal,
        taxRate: 0.15,
        taxAmount: subtotal * 0.15,
        discountAmount: req.body.discountAmount || booking.pricing.discountAmount,
        totalAmount: subtotal + (subtotal * 0.15) - (req.body.discountAmount || booking.pricing.discountAmount),
        currency: 'SAR'
      };
    }

    Object.assign(booking, req.body);
    booking.calculateTotalAmount();
    await booking.save();

    await booking.populate('customer', 'firstName lastName firstName_ar lastName_ar email phone');
    await booking.populate('services.service', 'name name_ar category category_ar');

    res.json(res.localized({
      success: true,
      data: booking,
      message: req.rtl.isRTL ? 
        'تم تحديث الحجز بنجاح' : 
        'Booking updated successfully'
    }));
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to update booking',
      error_ar: 'فشل في تحديث الحجز',
      details: error.message
    });
  }
});

// PATCH /api/bookings/:id/status - Update booking status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, reason, changedBy } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
        error_ar: 'الحالة مطلوبة'
      });
    }

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        error_ar: 'الحجز غير موجود'
      });
    }

    await booking.updateStatus(status, changedBy, reason);
    
    // Update customer statistics if completed
    if (status === 'completed') {
      const customer = await Customer.findById(booking.customer);
      if (customer) {
        customer.totalSpent += booking.pricing.totalAmount;
        await customer.save();
      }
    }

    await booking.populate('customer', 'firstName lastName firstName_ar lastName_ar email phone');

    res.json(res.localized({
      success: true,
      data: booking,
      message: req.rtl.isRTL ? 
        'تم تحديث حالة الحجز بنجاح' : 
        'Booking status updated successfully'
    }));
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to update booking status',
      error_ar: 'فشل في تحديث حالة الحجز',
      details: error.message
    });
  }
});

// DELETE /api/bookings/:id - Cancel booking
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        error_ar: 'الحجز غير موجود'
      });
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: 'Booking cannot be cancelled in current status',
        error_ar: 'لا يمكن إلغاء الحجز في الحالة الحالية'
      });
    }

    await booking.updateStatus('cancelled', req.body.cancelledBy || 'customer', req.body.reason);

    res.json(res.localized({
      success: true,
      message: req.rtl.isRTL ? 
        'تم إلغاء الحجز بنجاح' : 
        'Booking cancelled successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking',
      error_ar: 'فشل في إلغاء الحجز',
      details: error.message
    });
  }
});

export default router;