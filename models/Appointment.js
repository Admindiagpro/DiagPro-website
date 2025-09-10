const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required']
  },
  vehicle: {
    licensePlate: { type: String, required: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    currentMileage: Number,
    color: String
  },
  services: [{
    service: {
      type: mongoose.Schema.ObjectId,
      ref: 'Service',
      required: true
    },
    quantity: { type: Number, default: 1 },
    notes: String,
    estimatedDuration: Number,
    estimatedPrice: Number
  }],
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  timeSlot: {
    start: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    },
    end: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    }
  },
  status: {
    type: String,
    enum: [
      'scheduled',    // Appointment confirmed and scheduled
      'confirmed',    // Customer confirmed attendance
      'in_progress',  // Work in progress
      'completed',    // Service completed
      'cancelled',    // Cancelled by customer or center
      'no_show',      // Customer didn't show up
      'rescheduled'   // Moved to different time
    ],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: true
  },
  estimatedCost: {
    type: Number,
    required: true
  },
  actualCost: Number,
  actualDuration: Number,
  technician: {
    name: String,
    id: String,
    specialization: String
  },
  bay: {
    type: String, // Service bay identifier
    enum: ['bay1', 'bay2', 'bay3', 'bay4', 'bay5', 'diagnostic_bay', 'wash_bay']
  },
  customerNotes: String,
  internalNotes: String,
  symptoms: [String], // Customer reported issues
  diagnosis: {
    summary: String,
    detailedFindings: [String],
    recommendedServices: [String],
    urgencyLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    }
  },
  workPerformed: [String],
  partsUsed: [{
    name: String,
    partNumber: String,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number
  }],
  beforeImages: [String], // URLs to images taken before service
  afterImages: [String],  // URLs to images taken after service
  customerSignature: String, // Digital signature data
  remindersSent: {
    initial: { sent: Boolean, sentAt: Date },
    followUp: { sent: Boolean, sentAt: Date },
    completion: { sent: Boolean, sentAt: Date }
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'moyasar', 'bank_transfer', 'check']
  },
  invoice: {
    invoiceNumber: String,
    generatedAt: Date,
    dueDate: Date,
    paidAt: Date
  },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date
  },
  followUpDate: Date,
  warranty: {
    startDate: Date,
    endDate: Date,
    terms: String
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  source: {
    type: String,
    enum: ['walk_in', 'phone', 'online', 'mobile_app', 'referral'],
    default: 'online'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for appointment duration in hours
appointmentSchema.virtual('durationHours').get(function() {
  return Math.round((this.estimatedDuration / 60) * 100) / 100;
});

// Virtual for total services count
appointmentSchema.virtual('totalServices').get(function() {
  return this.services.length;
});

// Virtual for appointment day
appointmentSchema.virtual('appointmentDay').get(function() {
  return this.appointmentDate.toISOString().split('T')[0];
});

// Indexes for efficient queries
appointmentSchema.index({ customer: 1 });
appointmentSchema.index({ appointmentDate: 1, timeSlot: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ 'vehicle.licensePlate': 1 });
appointmentSchema.index({ bay: 1, appointmentDate: 1 });
appointmentSchema.index({ createdAt: -1 });

// Compound index for availability checking
appointmentSchema.index({ 
  appointmentDate: 1, 
  'timeSlot.start': 1, 
  'timeSlot.end': 1,
  status: 1 
});

// Pre-populate service details
appointmentSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'services.service',
    select: 'name category basePrice duration'
  }).populate({
    path: 'customer',
    select: 'firstName lastName email phone'
  });
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);