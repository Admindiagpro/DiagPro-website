import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  firstName_ar: {
    type: String,
    trim: true,
    maxlength: [50, 'Arabic first name cannot exceed 50 characters']
  },
  lastName_ar: {
    type: String,
    trim: true,
    maxlength: [50, 'Arabic last name cannot exceed 50 characters']
  },
  
  // Contact Information
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^(\+966|966|0)?[5-9][0-9]{8}$/, 'Please enter a valid Saudi phone number']
  },
  alternativePhone: {
    type: String,
    match: [/^(\+966|966|0)?[5-9][0-9]{8}$/, 'Please enter a valid Saudi phone number']
  },
  
  // Address
  address: {
    street: { type: String, trim: true },
    street_ar: { type: String, trim: true },
    city: { type: String, trim: true },
    city_ar: { type: String, trim: true },
    district: { type: String, trim: true },
    district_ar: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },

  // Vehicle Information
  vehicles: [{
    make: { type: String, required: true, trim: true },
    make_ar: { type: String, trim: true },
    model: { type: String, required: true, trim: true },
    model_ar: { type: String, trim: true },
    year: { 
      type: Number, 
      required: true,
      min: [1990, 'Year must be 1990 or later'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
    },
    plateNumber: { type: String, required: true, trim: true, uppercase: true },
    chassisNumber: { type: String, trim: true, uppercase: true },
    color: { type: String, trim: true },
    color_ar: { type: String, trim: true },
    mileage: { type: Number, min: 0 },
    fuelType: { 
      type: String, 
      enum: ['gasoline', 'diesel', 'hybrid', 'electric'],
      default: 'gasoline'
    },
    transmissionType: {
      type: String,
      enum: ['manual', 'automatic', 'cvt'],
      default: 'automatic'
    }
  }],

  // Account Information
  customerType: {
    type: String,
    enum: ['individual', 'corporate'],
    default: 'individual'
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  preferredLanguage: {
    type: String,
    enum: ['ar', 'en'],
    default: 'ar'
  },
  
  // Preferences and Settings
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false }
    },
    appointmentReminders: { type: Boolean, default: true },
    marketingCommunications: { type: Boolean, default: false }
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastVisit: {
    type: Date
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'customers'
});

// Indexes for better performance
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ 'vehicles.plateNumber': 1 });
customerSchema.index({ firstName: 1, lastName: 1 });
customerSchema.index({ firstName_ar: 1, lastName_ar: 1 });
customerSchema.index({ createdAt: -1 });

// Virtual for full name
customerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

customerSchema.virtual('fullName_ar').get(function() {
  if (this.firstName_ar && this.lastName_ar) {
    return `${this.firstName_ar} ${this.lastName_ar}`;
  }
  return null;
});

// Methods
customerSchema.methods.addLoyaltyPoints = function(points) {
  this.loyaltyPoints += points;
  return this.save();
};

customerSchema.methods.getActiveVehicles = function() {
  return this.vehicles.filter(vehicle => vehicle.isActive !== false);
};

export default mongoose.model('Customer', customerSchema);