import Joi from 'joi';

const bookingSchema = Joi.object({
  customer: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    .messages({
      'string.pattern.base': 'Invalid customer ID',
      'any.required': 'Customer ID is required'
    }),
  
  vehicle: Joi.object({
    plateNumber: Joi.string().trim().uppercase().required()
      .messages({
        'string.empty': 'Vehicle plate number is required',
        'any.required': 'Vehicle plate number is required'
      }),
    make: Joi.string().trim().optional(),
    make_ar: Joi.string().trim().optional(),
    model: Joi.string().trim().optional(),
    model_ar: Joi.string().trim().optional(),
    year: Joi.number().integer().min(1990).max(new Date().getFullYear() + 1).optional(),
    mileage: Joi.number().min(0).optional(),
    type: Joi.string().valid('sedan', 'suv', 'truck', 'motorcycle', 'bus', 'van', 'coupe', 'hatchback').optional()
  }).required(),
  
  services: Joi.array().items(Joi.object({
    service: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
      .messages({
        'string.pattern.base': 'Invalid service ID',
        'any.required': 'Service ID is required'
      }),
    quantity: Joi.number().integer().min(1).default(1),
    notes: Joi.string().trim().optional(),
    notes_ar: Joi.string().trim().optional()
  })).min(1).required()
    .messages({
      'array.min': 'At least one service is required',
      'any.required': 'Services are required'
    }),
  
  scheduledDate: Joi.date().min('now').required()
    .messages({
      'date.min': 'Scheduled date cannot be in the past',
      'any.required': 'Scheduled date is required'
    }),
  
  scheduledTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
    .messages({
      'string.pattern.base': 'Invalid time format (HH:MM)',
      'any.required': 'Scheduled time is required'
    }),
  
  priority: Joi.string().valid('low', 'normal', 'high', 'emergency').default('normal'),
  
  customerNotes: Joi.string().trim().max(1000).optional(),
  customerNotes_ar: Joi.string().trim().max(1000).optional(),
  
  contactPreference: Joi.string().valid('phone', 'email', 'sms', 'whatsapp').default('phone'),
  
  specialRequests: Joi.string().trim().max(500).optional(),
  specialRequests_ar: Joi.string().trim().max(500).optional(),
  
  source: Joi.string().valid('website', 'mobile_app', 'phone', 'walk_in', 'referral').default('website'),
  
  discountAmount: Joi.number().min(0).default(0),
  
  smartAssistant: Joi.object({
    predictedFaults: Joi.array().items(Joi.object({
      component: Joi.string().required(),
      component_ar: Joi.string().optional(),
      probability: Joi.number().min(0).max(1).required(),
      description: Joi.string().optional(),
      description_ar: Joi.string().optional(),
      recommendedAction: Joi.string().optional(),
      recommendedAction_ar: Joi.string().optional()
    })).optional(),
    
    customerInquiries: Joi.array().items(Joi.object({
      question: Joi.string().required(),
      question_ar: Joi.string().optional(),
      answer: Joi.string().required(),
      answer_ar: Joi.string().optional(),
      confidence: Joi.number().min(0).max(1).optional()
    })).optional()
  }).optional()
});

const bookingUpdateSchema = Joi.object({
  vehicle: Joi.object({
    plateNumber: Joi.string().trim().uppercase().optional(),
    make: Joi.string().trim().optional(),
    make_ar: Joi.string().trim().optional(),
    model: Joi.string().trim().optional(),
    model_ar: Joi.string().trim().optional(),
    year: Joi.number().integer().min(1990).max(new Date().getFullYear() + 1).optional(),
    mileage: Joi.number().min(0).optional(),
    type: Joi.string().valid('sedan', 'suv', 'truck', 'motorcycle', 'bus', 'van', 'coupe', 'hatchback').optional()
  }).optional(),
  
  services: Joi.array().items(Joi.object({
    service: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    quantity: Joi.number().integer().min(1).default(1),
    notes: Joi.string().trim().optional(),
    notes_ar: Joi.string().trim().optional(),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled').optional()
  })).min(1).optional(),
  
  scheduledDate: Joi.date().min('now').optional(),
  scheduledTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  
  priority: Joi.string().valid('low', 'normal', 'high', 'emergency').optional(),
  
  customerNotes: Joi.string().trim().max(1000).optional(),
  customerNotes_ar: Joi.string().trim().max(1000).optional(),
  
  contactPreference: Joi.string().valid('phone', 'email', 'sms', 'whatsapp').optional(),
  
  specialRequests: Joi.string().trim().max(500).optional(),
  specialRequests_ar: Joi.string().trim().max(500).optional(),
  
  assignedTechnician: Joi.string().trim().optional(),
  assignedTechnician_ar: Joi.string().trim().optional(),
  workBay: Joi.string().trim().optional(),
  
  discountAmount: Joi.number().min(0).optional(),
  
  qualityCheck: Joi.object({
    isCompleted: Joi.boolean().optional(),
    checkedBy: Joi.string().optional(),
    checkedAt: Joi.date().optional(),
    rating: Joi.number().min(1).max(5).optional(),
    notes: Joi.string().optional(),
    notes_ar: Joi.string().optional()
  }).optional(),
  
  customerFeedback: Joi.object({
    rating: Joi.number().min(1).max(5).optional(),
    comment: Joi.string().optional(),
    comment_ar: Joi.string().optional(),
    submittedAt: Joi.date().optional(),
    wouldRecommend: Joi.boolean().optional()
  }).optional(),
  
  isFollowUpRequired: Joi.boolean().optional(),
  followUpDate: Joi.date().optional(),
  followUpNotes: Joi.string().optional(),
  followUpNotes_ar: Joi.string().optional(),
  
  smartAssistant: Joi.object({
    predictedFaults: Joi.array().items(Joi.object({
      component: Joi.string().required(),
      component_ar: Joi.string().optional(),
      probability: Joi.number().min(0).max(1).required(),
      description: Joi.string().optional(),
      description_ar: Joi.string().optional(),
      recommendedAction: Joi.string().optional(),
      recommendedAction_ar: Joi.string().optional()
    })).optional(),
    
    diagnosticResults: Joi.array().items(Joi.object({
      code: Joi.string().required(),
      description: Joi.string().required(),
      description_ar: Joi.string().optional(),
      severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
      detectedAt: Joi.date().default('now')
    })).optional(),
    
    customerInquiries: Joi.array().items(Joi.object({
      question: Joi.string().required(),
      question_ar: Joi.string().optional(),
      answer: Joi.string().required(),
      answer_ar: Joi.string().optional(),
      askedAt: Joi.date().default('now'),
      confidence: Joi.number().min(0).max(1).optional()
    })).optional()
  }).optional()
});

const statusUpdateSchema = Joi.object({
  status: Joi.string().valid(
    'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'
  ).required()
    .messages({
      'any.only': 'Invalid status value',
      'any.required': 'Status is required'
    }),
  
  reason: Joi.string().trim().max(500).optional(),
  reason_ar: Joi.string().trim().max(500).optional(),
  changedBy: Joi.string().trim().optional(),
  
  cancellationReason: Joi.when('status', {
    is: 'cancelled',
    then: Joi.string().trim().max(500).optional(),
    otherwise: Joi.forbidden()
  }),
  
  cancellationReason_ar: Joi.when('status', {
    is: 'cancelled',
    then: Joi.string().trim().max(500).optional(),
    otherwise: Joi.forbidden()
  })
});

export const validateBooking = (req, res, next) => {
  const { error } = bookingSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      message_ar: getArabicBookingErrorMessage(detail.type, detail.path.join('.'))
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Booking validation failed',
      error_ar: 'فشل في التحقق من بيانات الحجز',
      details: errors
    });
  }
  
  // Additional business logic validation
  const validationErrors = [];
  
  // Check if scheduled date is within business hours
  const scheduledDate = new Date(req.body.scheduledDate);
  const dayOfWeek = scheduledDate.getDay();
  
  // Assuming business days are Monday to Saturday (1-6)
  if (dayOfWeek === 0) {
    validationErrors.push({
      field: 'scheduledDate',
      message: 'Bookings are not available on Sundays',
      message_ar: 'الحجوزات غير متاحة أيام الأحد'
    });
  }
  
  // Check time format and business hours (8 AM to 6 PM)
  const [hours, minutes] = req.body.scheduledTime.split(':').map(Number);
  if (hours < 8 || hours >= 18) {
    validationErrors.push({
      field: 'scheduledTime',
      message: 'Booking time must be between 8:00 AM and 6:00 PM',
      message_ar: 'وقت الحجز يجب أن يكون بين الساعة 8:00 صباحاً و 6:00 مساءً'
    });
  }
  
  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Business rules validation failed',
      error_ar: 'فشل في التحقق من قواعد العمل',
      details: validationErrors
    });
  }
  
  next();
};

export const validateBookingUpdate = (req, res, next) => {
  const { error } = bookingUpdateSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      message_ar: getArabicBookingErrorMessage(detail.type, detail.path.join('.'))
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Booking validation failed',
      error_ar: 'فشل في التحقق من بيانات الحجز',
      details: errors
    });
  }
  
  next();
};

export const validateStatusUpdate = (req, res, next) => {
  const { error } = statusUpdateSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      message_ar: getArabicBookingErrorMessage(detail.type, detail.path.join('.'))
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Status validation failed',
      error_ar: 'فشل في التحقق من الحالة',
      details: errors
    });
  }
  
  next();
};

function getArabicBookingErrorMessage(errorType, fieldName) {
  const arabicFieldNames = {
    'customer': 'العميل',
    'vehicle.plateNumber': 'رقم لوحة المركبة',
    'vehicle.make': 'ماركة المركبة',
    'vehicle.model': 'موديل المركبة',
    'vehicle.year': 'سنة صنع المركبة',
    'services': 'الخدمات',
    'scheduledDate': 'تاريخ الحجز',
    'scheduledTime': 'وقت الحجز',
    'priority': 'الأولوية',
    'customerNotes': 'ملاحظات العميل',
    'contactPreference': 'طريقة التواصل المفضلة',
    'specialRequests': 'الطلبات الخاصة',
    'status': 'حالة الحجز',
    'assignedTechnician': 'الفني المكلف',
    'workBay': 'موقع العمل',
    'discountAmount': 'مبلغ الخصم'
  };
  
  const fieldNameAr = arabicFieldNames[fieldName] || fieldName;
  
  const errorMessages = {
    'string.empty': `${fieldNameAr} مطلوب`,
    'string.pattern.base': `${fieldNameAr} غير صحيح`,
    'string.max': `${fieldNameAr} طويل جداً`,
    'number.positive': `${fieldNameAr} يجب أن يكون رقماً موجباً`,
    'number.min': `${fieldNameAr} يجب أن يكون أكبر من القيمة المسموحة`,
    'number.max': `${fieldNameAr} يجب أن يكون أصغر من القيمة المسموحة`,
    'number.integer': `${fieldNameAr} يجب أن يكون رقماً صحيحاً`,
    'any.required': `${fieldNameAr} مطلوب`,
    'any.only': `${fieldNameAr} غير صحيح`,
    'array.min': 'يجب تحديد خدمة واحدة على الأقل',
    'date.min': 'التاريخ لا يمكن أن يكون في الماضي',
    'date.greater': 'التاريخ يجب أن يكون بعد التاريخ المرجعي'
  };
  
  return errorMessages[errorType] || `خطأ في ${fieldNameAr}`;
}