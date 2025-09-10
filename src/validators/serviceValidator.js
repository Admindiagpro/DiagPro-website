import Joi from 'joi';

const serviceSchema = Joi.object({
  name: Joi.string().trim().max(100).required()
    .messages({
      'string.empty': 'Service name is required',
      'string.max': 'Service name cannot exceed 100 characters',
      'any.required': 'Service name is required'
    }),
  
  name_ar: Joi.string().trim().max(100).required()
    .messages({
      'string.empty': 'Arabic service name is required',
      'string.max': 'Arabic service name cannot exceed 100 characters',
      'any.required': 'Arabic service name is required'
    }),
  
  description: Joi.string().trim().max(1000).optional(),
  description_ar: Joi.string().trim().max(1000).optional(),
  
  category: Joi.string().valid(
    'maintenance', 'repair', 'diagnostic', 'inspection', 
    'tire_service', 'oil_change', 'brake_service', 'engine_service',
    'electrical', 'ac_service', 'battery', 'suspension', 'exhaust',
    'transmission', 'cooling_system', 'fuel_system'
  ).required()
    .messages({
      'any.only': 'Invalid service category',
      'any.required': 'Service category is required'
    }),
  
  category_ar: Joi.string().required()
    .messages({
      'string.empty': 'Arabic category name is required',
      'any.required': 'Arabic category name is required'
    }),
  
  basePrice: Joi.number().positive().required()
    .messages({
      'number.positive': 'Price must be positive',
      'any.required': 'Base price is required'
    }),
  
  currency: Joi.string().valid('SAR', 'USD', 'EUR').default('SAR'),
  
  estimatedDuration: Joi.number().integer().min(15).required()
    .messages({
      'number.min': 'Duration must be at least 15 minutes',
      'any.required': 'Estimated duration is required'
    }),
  
  isActive: Joi.boolean().default(true),
  isPopular: Joi.boolean().default(false),
  requiresAppointment: Joi.boolean().default(true),
  
  vehicleTypes: Joi.array().items(
    Joi.string().valid('sedan', 'suv', 'truck', 'motorcycle', 'bus', 'van', 'coupe', 'hatchback')
  ).optional(),
  
  requiredParts: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    name_ar: Joi.string().required(),
    isOptional: Joi.boolean().default(false),
    estimatedCost: Joi.number().positive().optional()
  })).optional(),
  
  diagnosticCode: Joi.string().optional(),
  smartAssistantSupported: Joi.boolean().default(false),
  
  seasonalPricing: Joi.array().items(Joi.object({
    season: Joi.string().valid('spring', 'summer', 'autumn', 'winter').required(),
    priceAdjustment: Joi.number().required(),
    isActive: Joi.boolean().default(true)
  })).optional(),
  
  promotionalOffers: Joi.array().items(Joi.object({
    title: Joi.string().required(),
    title_ar: Joi.string().required(),
    discountPercentage: Joi.number().min(0).max(100).required(),
    validFrom: Joi.date().required(),
    validTo: Joi.date().greater(Joi.ref('validFrom')).required(),
    isActive: Joi.boolean().default(true)
  })).optional(),
  
  tags: Joi.array().items(Joi.string()).optional(),
  tags_ar: Joi.array().items(Joi.string()).optional(),
  
  images: Joi.array().items(Joi.object({
    url: Joi.string().uri().required(),
    alt: Joi.string().optional(),
    alt_ar: Joi.string().optional(),
    isPrimary: Joi.boolean().default(false)
  })).optional(),
  
  seoKeywords: Joi.array().items(Joi.string()).optional(),
  seoKeywords_ar: Joi.array().items(Joi.string()).optional(),
  
  certificationRequired: Joi.boolean().default(false),
  qualityStandards: Joi.array().items(Joi.string()).optional(),
  
  warrantyPeriod: Joi.number().integer().min(0).default(0),
  warrantyTerms: Joi.string().optional(),
  warrantyTerms_ar: Joi.string().optional()
});

const serviceUpdateSchema = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  name_ar: Joi.string().trim().max(100).optional(),
  description: Joi.string().trim().max(1000).optional(),
  description_ar: Joi.string().trim().max(1000).optional(),
  
  category: Joi.string().valid(
    'maintenance', 'repair', 'diagnostic', 'inspection', 
    'tire_service', 'oil_change', 'brake_service', 'engine_service',
    'electrical', 'ac_service', 'battery', 'suspension', 'exhaust',
    'transmission', 'cooling_system', 'fuel_system'
  ).optional(),
  
  category_ar: Joi.string().optional(),
  basePrice: Joi.number().positive().optional(),
  currency: Joi.string().valid('SAR', 'USD', 'EUR').optional(),
  estimatedDuration: Joi.number().integer().min(15).optional(),
  
  isActive: Joi.boolean().optional(),
  isPopular: Joi.boolean().optional(),
  requiresAppointment: Joi.boolean().optional(),
  
  vehicleTypes: Joi.array().items(
    Joi.string().valid('sedan', 'suv', 'truck', 'motorcycle', 'bus', 'van', 'coupe', 'hatchback')
  ).optional(),
  
  requiredParts: Joi.array().items(Joi.object({
    name: Joi.string().optional(),
    name_ar: Joi.string().optional(),
    isOptional: Joi.boolean().optional(),
    estimatedCost: Joi.number().positive().optional()
  })).optional(),
  
  diagnosticCode: Joi.string().optional(),
  smartAssistantSupported: Joi.boolean().optional(),
  
  seasonalPricing: Joi.array().items(Joi.object({
    season: Joi.string().valid('spring', 'summer', 'autumn', 'winter').optional(),
    priceAdjustment: Joi.number().optional(),
    isActive: Joi.boolean().optional()
  })).optional(),
  
  promotionalOffers: Joi.array().items(Joi.object({
    title: Joi.string().optional(),
    title_ar: Joi.string().optional(),
    discountPercentage: Joi.number().min(0).max(100).optional(),
    validFrom: Joi.date().optional(),
    validTo: Joi.date().optional(),
    isActive: Joi.boolean().optional()
  })).optional(),
  
  tags: Joi.array().items(Joi.string()).optional(),
  tags_ar: Joi.array().items(Joi.string()).optional(),
  
  images: Joi.array().items(Joi.object({
    url: Joi.string().uri().optional(),
    alt: Joi.string().optional(),
    alt_ar: Joi.string().optional(),
    isPrimary: Joi.boolean().optional()
  })).optional(),
  
  seoKeywords: Joi.array().items(Joi.string()).optional(),
  seoKeywords_ar: Joi.array().items(Joi.string()).optional(),
  
  certificationRequired: Joi.boolean().optional(),
  qualityStandards: Joi.array().items(Joi.string()).optional(),
  
  warrantyPeriod: Joi.number().integer().min(0).optional(),
  warrantyTerms: Joi.string().optional(),
  warrantyTerms_ar: Joi.string().optional()
});

export const validateService = (req, res, next) => {
  const { error } = serviceSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      message_ar: getArabicServiceErrorMessage(detail.type, detail.path.join('.'))
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Service validation failed',
      error_ar: 'فشل في التحقق من بيانات الخدمة',
      details: errors
    });
  }
  
  next();
};

export const validateServiceUpdate = (req, res, next) => {
  const { error } = serviceUpdateSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      message_ar: getArabicServiceErrorMessage(detail.type, detail.path.join('.'))
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Service validation failed',
      error_ar: 'فشل في التحقق من بيانات الخدمة',
      details: errors
    });
  }
  
  next();
};

function getArabicServiceErrorMessage(errorType, fieldName) {
  const arabicFieldNames = {
    'name': 'اسم الخدمة',
    'name_ar': 'اسم الخدمة بالعربية',
    'description': 'وصف الخدمة',
    'description_ar': 'وصف الخدمة بالعربية',
    'category': 'فئة الخدمة',
    'category_ar': 'فئة الخدمة بالعربية',
    'basePrice': 'السعر الأساسي',
    'currency': 'العملة',
    'estimatedDuration': 'المدة المقدرة',
    'vehicleTypes': 'أنواع المركبات',
    'requiredParts': 'القطع المطلوبة',
    'seasonalPricing': 'الأسعار الموسمية',
    'promotionalOffers': 'العروض الترويجية',
    'warrantyPeriod': 'فترة الضمان'
  };
  
  const fieldNameAr = arabicFieldNames[fieldName] || fieldName;
  
  const errorMessages = {
    'string.empty': `${fieldNameAr} مطلوب`,
    'string.max': `${fieldNameAr} طويل جداً`,
    'number.positive': `${fieldNameAr} يجب أن يكون رقماً موجباً`,
    'number.min': `${fieldNameAr} يجب أن يكون أكبر من القيمة المسموحة`,
    'number.max': `${fieldNameAr} يجب أن يكون أصغر من القيمة المسموحة`,
    'any.required': `${fieldNameAr} مطلوب`,
    'any.only': `${fieldNameAr} غير صحيح`,
    'date.greater': 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية'
  };
  
  return errorMessages[errorType] || `خطأ في ${fieldNameAr}`;
}