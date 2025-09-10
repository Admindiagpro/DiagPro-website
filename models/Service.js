const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Service category is required'],
    enum: [
      'maintenance',
      'repair',
      'diagnostic',
      'inspection',
      'bodywork',
      'electrical',
      'engine',
      'transmission',
      'brakes',
      'suspension',
      'tires',
      'ac_heating',
      'detailing',
      'other'
    ]
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative']
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Service duration is required'],
    min: [15, 'Minimum service duration is 15 minutes']
  },
  complexity: {
    type: String,
    enum: ['simple', 'moderate', 'complex'],
    default: 'simple'
  },
  requiredSkills: [String],
  tools: [String],
  parts: [{
    name: String,
    partNumber: String,
    estimatedCost: Number,
    isOptional: { type: Boolean, default: false }
  }],
  vehicleTypes: [{
    type: String,
    enum: ['sedan', 'suv', 'truck', 'van', 'motorcycle', 'luxury', 'sports', 'electric', 'hybrid']
  }],
  warranty: {
    duration: Number, // in days
    description: String,
    coverage: String
  },
  popularity: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  seasonalAdjustment: {
    factor: { type: Number, default: 1.0 },
    startDate: Date,
    endDate: Date
  },
  prerequisites: [String], // Other services that should be completed first
  relatedServices: [{ type: mongoose.Schema.ObjectId, ref: 'Service' }],
  estimatedMileageInterval: Number, // For maintenance services
  images: [String], // URLs to service images
  instructions: {
    beforeService: [String],
    afterService: [String],
    customerPreparation: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for final price with seasonal adjustment
serviceSchema.virtual('finalPrice').get(function() {
  const now = new Date();
  if (this.seasonalAdjustment && 
      this.seasonalAdjustment.startDate <= now && 
      this.seasonalAdjustment.endDate >= now) {
    return this.basePrice * this.seasonalAdjustment.factor;
  }
  return this.basePrice;
});

// Virtual for duration in hours
serviceSchema.virtual('durationHours').get(function() {
  return Math.round((this.duration / 60) * 100) / 100;
});

// Index for text search
serviceSchema.index({
  name: 'text',
  description: 'text',
  category: 'text'
});

// Index for filtering
serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ basePrice: 1 });
serviceSchema.index({ popularity: -1 });
serviceSchema.index({ averageRating: -1 });

module.exports = mongoose.model('Service', serviceSchema);