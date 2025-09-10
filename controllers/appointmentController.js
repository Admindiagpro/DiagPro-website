const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Customer = require('../models/Customer');
const { validationResult } = require('express-validator');
const moment = require('moment');

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};

    // Filter by customer
    if (req.query.customer) {
      query.customer = req.query.customer;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.appointmentDate = {};
      if (req.query.startDate) {
        query.appointmentDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.appointmentDate.$lte = new Date(req.query.endDate);
      }
    }

    // Filter by today's appointments
    if (req.query.today === 'true') {
      const today = moment().startOf('day');
      const tomorrow = moment().endOf('day');
      query.appointmentDate = {
        $gte: today.toDate(),
        $lte: tomorrow.toDate()
      };
    }

    // Filter by technician
    if (req.query.technician) {
      query['technician.name'] = new RegExp(req.query.technician, 'i');
    }

    // Filter by bay
    if (req.query.bay) {
      query.bay = req.query.bay;
    }

    // Sort options
    let sort = {};
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'date_asc':
          sort = { appointmentDate: 1, 'timeSlot.start': 1 };
          break;
        case 'date_desc':
          sort = { appointmentDate: -1, 'timeSlot.start': -1 };
          break;
        case 'status':
          sort = { status: 1 };
          break;
        default:
          sort = { appointmentDate: 1, 'timeSlot.start': 1 };
      }
    } else {
      sort = { appointmentDate: 1, 'timeSlot.start': 1 };
    }

    const appointments = await Appointment.find(query)
      .limit(limit * 1)
      .skip(startIndex)
      .sort(sort);

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: appointments.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: appointments
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private
exports.createAppointment = async (req, res, next) => {
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
      customer,
      vehicle,
      services,
      appointmentDate,
      timeSlot,
      customerNotes,
      priority
    } = req.body;

    // Verify customer exists
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Calculate estimated duration and cost
    let estimatedDuration = 0;
    let estimatedCost = 0;
    const serviceDetails = [];

    for (const serviceItem of services) {
      const service = await Service.findById(serviceItem.service);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: `Service not found: ${serviceItem.service}`
        });
      }

      const quantity = serviceItem.quantity || 1;
      estimatedDuration += service.duration * quantity;
      estimatedCost += service.finalPrice * quantity;
      
      serviceDetails.push({
        service: service._id,
        quantity,
        estimatedDuration: service.duration * quantity,
        estimatedPrice: service.finalPrice * quantity,
        notes: serviceItem.notes
      });
    }

    // Check for conflicts (same date/time slot)
    const conflictingAppointment = await Appointment.findOne({
      appointmentDate: new Date(appointmentDate),
      $or: [
        {
          'timeSlot.start': { $lte: timeSlot.start },
          'timeSlot.end': { $gte: timeSlot.start }
        },
        {
          'timeSlot.start': { $lte: timeSlot.end },
          'timeSlot.end': { $gte: timeSlot.end }
        },
        {
          'timeSlot.start': { $gte: timeSlot.start },
          'timeSlot.end': { $lte: timeSlot.end }
        }
      ],
      status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Time slot not available. Please choose a different time.'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      customer,
      vehicle,
      services: serviceDetails,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      estimatedDuration,
      estimatedCost,
      customerNotes,
      priority: priority || 'normal',
      source: 'online'
    });

    // Populate the created appointment
    await appointment.populate('customer', 'firstName lastName email phone');
    await appointment.populate('services.service', 'name category basePrice duration');

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
exports.updateAppointment = async (req, res, next) => {
  try {
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // If updating date/time, check for conflicts
    if (req.body.appointmentDate || req.body.timeSlot) {
      const appointmentDate = req.body.appointmentDate || appointment.appointmentDate;
      const timeSlot = req.body.timeSlot || appointment.timeSlot;

      const conflictingAppointment = await Appointment.findOne({
        _id: { $ne: req.params.id },
        appointmentDate: new Date(appointmentDate),
        $or: [
          {
            'timeSlot.start': { $lte: timeSlot.start },
            'timeSlot.end': { $gte: timeSlot.start }
          },
          {
            'timeSlot.start': { $lte: timeSlot.end },
            'timeSlot.end': { $gte: timeSlot.end }
          },
          {
            'timeSlot.start': { $gte: timeSlot.start },
            'timeSlot.end': { $lte: timeSlot.end }
          }
        ],
        status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
      });

      if (conflictingAppointment) {
        return res.status(400).json({
          success: false,
          message: 'Time slot not available. Please choose a different time.'
        });
      }
    }

    appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel appointment
// @route   PATCH /api/appointments/:id/cancel
// @access  Private
exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'cancelled',
        internalNotes: req.body.reason || 'Cancelled by user'
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get available time slots
// @route   GET /api/appointments/availability
// @access  Public
exports.getAvailability = async (req, res, next) => {
  try {
    const { date, duration } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const appointmentDate = moment(date).startOf('day');
    const estimatedDuration = parseInt(duration) || 60; // Default 1 hour

    // Business hours (9 AM to 6 PM)
    const businessStart = 9; // 9 AM
    const businessEnd = 18;  // 6 PM
    const slotDuration = 30; // 30 minutes slots

    // Get existing appointments for the date
    const existingAppointments = await Appointment.find({
      appointmentDate: {
        $gte: appointmentDate.toDate(),
        $lt: appointmentDate.clone().add(1, 'day').toDate()
      },
      status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
    }).select('timeSlot estimatedDuration');

    // Generate time slots
    const availableSlots = [];
    
    for (let hour = businessStart; hour < businessEnd; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotStart = moment().hour(hour).minute(minute).second(0);
        const slotEnd = slotStart.clone().add(estimatedDuration, 'minutes');
        
        // Check if slot end time is within business hours
        if (slotEnd.hour() > businessEnd || 
            (slotEnd.hour() === businessEnd && slotEnd.minute() > 0)) {
          continue;
        }

        const timeSlot = {
          start: slotStart.format('HH:mm'),
          end: slotEnd.format('HH:mm')
        };

        // Check for conflicts with existing appointments
        let hasConflict = false;
        for (const appointment of existingAppointments) {
          const existingStart = moment(timeSlot.start, 'HH:mm');
          const existingEnd = moment(appointment.timeSlot.end, 'HH:mm');
          const appointmentStart = moment(appointment.timeSlot.start, 'HH:mm');
          const slotEndMoment = moment(timeSlot.end, 'HH:mm');

          if (
            (slotStart.isBetween(appointmentStart, existingEnd, null, '[)')) ||
            (slotEndMoment.isBetween(appointmentStart, existingEnd, null, '(]')) ||
            (appointmentStart.isBetween(slotStart, slotEndMoment, null, '[)'))
          ) {
            hasConflict = true;
            break;
          }
        }

        if (!hasConflict) {
          availableSlots.push(timeSlot);
        }
      }
    }

    res.status(200).json({
      success: true,
      date: appointmentDate.format('YYYY-MM-DD'),
      duration: estimatedDuration,
      availableSlots,
      totalSlots: availableSlots.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/appointments/dashboard
// @access  Private (Admin)
exports.getDashboard = async (req, res, next) => {
  try {
    const today = moment().startOf('day');
    const tomorrow = moment().add(1, 'day').startOf('day');
    const thisWeek = moment().startOf('week');
    const thisMonth = moment().startOf('month');

    // Today's appointments
    const todayAppointments = await Appointment.countDocuments({
      appointmentDate: {
        $gte: today.toDate(),
        $lt: tomorrow.toDate()
      }
    });

    // This week's appointments
    const weekAppointments = await Appointment.countDocuments({
      appointmentDate: {
        $gte: thisWeek.toDate(),
        $lt: moment().endOf('week').toDate()
      }
    });

    // This month's appointments
    const monthAppointments = await Appointment.countDocuments({
      appointmentDate: {
        $gte: thisMonth.toDate(),
        $lt: moment().endOf('month').toDate()
      }
    });

    // Status breakdown
    const statusBreakdown = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Revenue statistics
    const revenueStats = await Appointment.aggregate([
      {
        $match: {
          status: 'completed',
          actualCost: { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$actualCost' },
          avgAppointmentValue: { $avg: '$actualCost' },
          completedAppointments: { $sum: 1 }
        }
      }
    ]);

    // Upcoming appointments (next 7 days)
    const upcomingAppointments = await Appointment.find({
      appointmentDate: {
        $gte: today.toDate(),
        $lte: moment().add(7, 'days').toDate()
      },
      status: { $in: ['scheduled', 'confirmed'] }
    })
    .populate('customer', 'firstName lastName')
    .populate('services.service', 'name')
    .sort({ appointmentDate: 1, 'timeSlot.start': 1 })
    .limit(10);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          today: todayAppointments,
          thisWeek: weekAppointments,
          thisMonth: monthAppointments
        },
        statusBreakdown,
        revenue: revenueStats[0] || {
          totalRevenue: 0,
          avgAppointmentValue: 0,
          completedAppointments: 0
        },
        upcomingAppointments
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};