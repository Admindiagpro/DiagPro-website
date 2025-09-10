import Joi from 'joi';

const customerSchema = Joi.object({
  firstName: Joi.string().trim().max(50).required()
    .messages({
      'string.empty': 'First name is required',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
  
  lastName: Joi.string().trim().max(50).required()
    .messages({
      'string.empty': 'Last name is required',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),
  
  firstName_ar: Joi.string().trim().max(50).optional(),
  lastName_ar: Joi.string().trim().max(50).optional(),
  
  email: Joi.string().email().lowercase().required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
  
  phone: Joi.string().pattern(/^(\+966|966|0)?[5-9][0-9]{8}$/).required()
    .messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Please enter a valid Saudi phone number',
      'any.required': 'Phone number is required'
    }),
  
  alternativePhone: Joi.string().pattern(/^(\+966|966|0)?[5-9][0-9]{8}$/).optional(),
  
  address: Joi.object({
    street: Joi.string().trim().optional(),
    street_ar: Joi.string().trim().optional(),
    city: Joi.string().trim().optional(),
    city_ar: Joi.string().trim().optional(),
    district: Joi.string().trim().optional(),
    district_ar: Joi.string().trim().optional(),
    postalCode: Joi.string().trim().optional(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90).optional(),
      longitude: Joi.number().min(-180).max(180).optional()
    }).optional()
  }).optional(),
  
  vehicles: Joi.array().items(Joi.object({
    make: Joi.string().trim().required(),
    make_ar: Joi.string().trim().optional(),
    model: Joi.string().trim().required(),
    model_ar: Joi.string().trim().optional(),
    year: Joi.number().integer().min(1990).max(new Date().getFullYear() + 1).required(),
    plateNumber: Joi.string().trim().uppercase().required(),
    chassisNumber: Joi.string().trim().uppercase().optional(),
    color: Joi.string().trim().optional(),
    color_ar: Joi.string().trim().optional(),
    mileage: Joi.number().min(0).optional(),
    fuelType: Joi.string().valid('gasoline', 'diesel', 'hybrid', 'electric').default('gasoline'),
    transmissionType: Joi.string().valid('manual', 'automatic', 'cvt').default('automatic')
  })).optional(),
  
  customerType: Joi.string().valid('individual', 'corporate').default('individual'),
  loyaltyPoints: Joi.number().min(0).default(0),
  preferredLanguage: Joi.string().valid('ar', 'en').default('ar'),
  
  preferences: Joi.object({
    notifications: Joi.object({
      email: Joi.boolean().default(true),
      sms: Joi.boolean().default(true),
      whatsapp: Joi.boolean().default(false)
    }).optional(),
    appointmentReminders: Joi.boolean().default(true),
    marketingCommunications: Joi.boolean().default(false)
  }).optional(),
  
  isActive: Joi.boolean().default(true),
  isVerified: Joi.boolean().default(false)
});

const customerUpdateSchema = Joi.object({
  firstName: Joi.string().trim().max(50).optional(),
  lastName: Joi.string().trim().max(50).optional(),
  firstName_ar: Joi.string().trim().max(50).optional(),
  lastName_ar: Joi.string().trim().max(50).optional(),
  email: Joi.string().email().lowercase().optional(),
  phone: Joi.string().pattern(/^(\+966|966|0)?[5-9][0-9]{8}$/).optional(),
  alternativePhone: Joi.string().pattern(/^(\+966|966|0)?[5-9][0-9]{8}$/).optional(),
  address: Joi.object({
    street: Joi.string().trim().optional(),
    street_ar: Joi.string().trim().optional(),
    city: Joi.string().trim().optional(),
    city_ar: Joi.string().trim().optional(),
    district: Joi.string().trim().optional(),
    district_ar: Joi.string().trim().optional(),
    postalCode: Joi.string().trim().optional(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90).optional(),
      longitude: Joi.number().min(-180).max(180).optional()
    }).optional()
  }).optional(),
  vehicles: Joi.array().items(Joi.object({
    _id: Joi.string().optional(),
    make: Joi.string().trim().optional(),
    make_ar: Joi.string().trim().optional(),
    model: Joi.string().trim().optional(),
    model_ar: Joi.string().trim().optional(),
    year: Joi.number().integer().min(1990).max(new Date().getFullYear() + 1).optional(),
    plateNumber: Joi.string().trim().uppercase().optional(),
    chassisNumber: Joi.string().trim().uppercase().optional(),
    color: Joi.string().trim().optional(),
    color_ar: Joi.string().trim().optional(),
    mileage: Joi.number().min(0).optional(),
    fuelType: Joi.string().valid('gasoline', 'diesel', 'hybrid', 'electric').optional(),
    transmissionType: Joi.string().valid('manual', 'automatic', 'cvt').optional()
  })).optional(),
  customerType: Joi.string().valid('individual', 'corporate').optional(),
  loyaltyPoints: Joi.number().min(0).optional(),
  preferredLanguage: Joi.string().valid('ar', 'en').optional(),
  preferences: Joi.object({
    notifications: Joi.object({
      email: Joi.boolean().optional(),
      sms: Joi.boolean().optional(),
      whatsapp: Joi.boolean().optional()
    }).optional(),
    appointmentReminders: Joi.boolean().optional(),
    marketingCommunications: Joi.boolean().optional()
  }).optional(),
  isActive: Joi.boolean().optional(),
  isVerified: Joi.boolean().optional()
});

export const validateCustomer = (req, res, next) => {
  const { error } = customerSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      message_ar: getArabicErrorMessage(detail.type, detail.path.join('.'))
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      error_ar: 'فشل في التحقق من البيانات',
      details: errors
    });
  }
  
  next();
};

export const validateCustomerUpdate = (req, res, next) => {
  const { error } = customerUpdateSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      message_ar: getArabicErrorMessage(detail.type, detail.path.join('.'))
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      error_ar: 'فشل في التحقق من البيانات',
      details: errors
    });
  }
  
  next();
};

function getArabicErrorMessage(errorType, fieldName) {
  const arabicFieldNames = {
    'firstName': 'الاسم الأول',
    'lastName': 'اسم العائلة',
    'email': 'البريد الإلكتروني',
    'phone': 'رقم الهاتف',
    'alternativePhone': 'رقم الهاتف البديل',
    'address.street': 'الشارع',
    'address.city': 'المدينة',
    'address.district': 'الحي',
    'vehicles.make': 'ماركة السيارة',
    'vehicles.model': 'موديل السيارة',
    'vehicles.year': 'سنة الصنع',
    'vehicles.plateNumber': 'رقم اللوحة'
  };
  
  const fieldNameAr = arabicFieldNames[fieldName] || fieldName;
  
  const errorMessages = {
    'string.empty': `${fieldNameAr} مطلوب`,
    'string.email': 'يرجى إدخال بريد إلكتروني صحيح',
    'string.pattern.base': `${fieldNameAr} غير صحيح`,
    'number.min': `${fieldNameAr} يجب أن يكون أكبر من القيمة المسموحة`,
    'number.max': `${fieldNameAr} يجب أن يكون أصغر من القيمة المسموحة`,
    'any.required': `${fieldNameAr} مطلوب`,
    'string.max': `${fieldNameAr} طويل جداً`
  };
  
  return errorMessages[errorType] || `خطأ في ${fieldNameAr}`;
}