import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters']
  },
  name_ar: {
    type: String,
    required: [true, 'Arabic service name is required'],
    trim: true,
    maxlength: [100, 'Arabic service name cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  description_ar: {
    type: String,
    trim: true,
    maxlength: [1000, 'Arabic description cannot exceed 1000 characters']
  },

  // Service Details
  category: {
    type: String,
    required: [true, 'Service category is required'],
    enum: [
      'maintenance', 'repair', 'diagnostic', 'inspection', 
      'tire_service', 'oil_change', 'brake_service', 'engine_service',
      'electrical', 'ac_service', 'battery', 'suspension', 'exhaust',
      'transmission', 'cooling_system', 'fuel_system'
    ]
  },
  category_ar: {
    type: String,
    required: [true, 'Arabic service category is required']
  },

  // Pricing
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'SAR',
    enum: ['SAR', 'USD', 'EUR']
  },
  
  // Time and Duration
  estimatedDuration: {
    type: Number, // in minutes
    required: [true, 'Estimated duration is required'],
    min: [15, 'Duration must be at least 15 minutes']
  },
  
  // Availability
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  requiresAppointment: {
    type: Boolean,
    default: true
  },
  
  // Requirements and Prerequisites
  vehicleTypes: [{
    type: String,
    enum: ['sedan', 'suv', 'truck', 'motorcycle', 'bus', 'van', 'coupe', 'hatchback']
  }],
  
  requiredParts: [{
    name: String,
    name_ar: String,
    isOptional: { type: Boolean, default: false },
    estimatedCost: Number
  }],

  // Service Metrics
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },

  // Advanced Features for Diagnostic Services
  diagnosticCode: String, // For specific diagnostic procedures
  smartAssistantSupported: {
    type: Boolean,
    default: false
  },
  
  // Seasonal and Promotional
  seasonalPricing: [{
    season: { type: String, enum: ['spring', 'summer', 'autumn', 'winter'] },
    priceAdjustment: Number, // percentage adjustment
    isActive: Boolean
  }],
  
  promotionalOffers: [{
    title: String,
    title_ar: String,
    discountPercentage: { type: Number, min: 0, max: 100 },
    validFrom: Date,
    validTo: Date,
    isActive: { type: Boolean, default: true }
  }],

  // Meta Information
  tags: [String], // for search and filtering
  tags_ar: [String],
  
  images: [{
    url: String,
    alt: String,
    alt_ar: String,
    isPrimary: { type: Boolean, default: false }
  }],

  // SEO and Marketing
  seoKeywords: [String],
  seoKeywords_ar: [String],
  
  // Quality and Compliance
  certificationRequired: {
    type: Boolean,
    default: false
  },
  qualityStandards: [String],
  
  // Warranty Information
  warrantyPeriod: {
    type: Number, // in days
    default: 0
  },
  warrantyTerms: String,
  warrantyTerms_ar: String

}, {
  timestamps: true,
  collection: 'services'
});

// Indexes for performance
serviceSchema.index({ name: 'text', name_ar: 'text', description: 'text', description_ar: 'text' });
serviceSchema.index({ category: 1 });
serviceSchema.index({ basePrice: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ isPopular: -1 });
serviceSchema.index({ averageRating: -1 });
serviceSchema.index({ createdAt: -1 });

// Virtual for localized name
serviceSchema.virtual('localizedName').get(function() {
  return {
    en: this.name,
    ar: this.name_ar
  };
});

// Methods
serviceSchema.methods.updateRating = function(newRating) {
  // Simple average calculation - in production, you might want more sophisticated rating calculation
  const totalRatings = this.totalBookings;
  const currentTotal = this.averageRating * totalRatings;
  this.averageRating = (currentTotal + newRating) / (totalRatings + 1);
  return this.save();
};

serviceSchema.methods.getActivePromotions = function() {
  const now = new Date();
  return this.promotionalOffers.filter(offer => 
    offer.isActive && 
    offer.validFrom <= now && 
    offer.validTo >= now
  );
};

serviceSchema.methods.calculatePrice = function(vehicleType = null, season = null) {
  let price = this.basePrice;
  
  // Apply seasonal pricing
  if (season) {
    const seasonalPricing = this.seasonalPricing.find(sp => sp.season === season && sp.isActive);
    if (seasonalPricing) {
      price = price * (1 + seasonalPricing.priceAdjustment / 100);
    }
  }
  
  // Apply active promotions
  const activePromotions = this.getActivePromotions();
  if (activePromotions.length > 0) {
    const bestDiscount = Math.max(...activePromotions.map(p => p.discountPercentage));
    price = price * (1 - bestDiscount / 100);
  }
  
  return Math.round(price * 100) / 100; // Round to 2 decimal places
};

export default mongoose.model('Service', serviceSchema);