import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  // Reference Information
  bookingNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Customer and Vehicle Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required']
  },
  
  vehicle: {
    plateNumber: { type: String, required: true },
    make: String,
    make_ar: String,
    model: String,
    model_ar: String,
    year: Number,
    mileage: Number
  },

  // Services Information
  services: [{
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    estimatedDuration: Number, // in minutes
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending'
    },
    notes: String,
    notes_ar: String
  }],

  // Scheduling Information
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  scheduledTime: {
    type: String,
    required: [true, 'Scheduled time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
  },
  estimatedDuration: { // Total estimated duration in minutes
    type: Number,
    required: true
  },
  estimatedCompletionTime: Date,

  // Booking Status and Progress
  status: {
    type: String,
    enum: [
      'pending',      // Waiting for confirmation
      'confirmed',    // Confirmed by center
      'in_progress',  // Work has started
      'completed',    // All services completed
      'cancelled',    // Cancelled by customer/center
      'no_show',      // Customer didn't show up
      'rescheduled'   // Booking was rescheduled
    ],
    default: 'pending'
  },
  
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'emergency'],
    default: 'normal'
  },

  // Financial Information
  pricing: {
    subtotal: { type: Number, required: true },
    taxRate: { type: Number, default: 0.15 }, // 15% VAT in Saudi Arabia
    taxAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'SAR' }
  },

  // Payment Information
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'refunded', 'failed'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'moyasar', 'apple_pay', 'stc_pay']
    },
    transactionId: String,
    paidAmount: { type: Number, default: 0 },
    paidAt: Date,
    refundAmount: { type: Number, default: 0 },
    refundReason: String,
    refundReason_ar: String
  },

  // Customer Information and Preferences
  customerNotes: String,
  customerNotes_ar: String,
  
  contactPreference: {
    type: String,
    enum: ['phone', 'email', 'sms', 'whatsapp'],
    default: 'phone'
  },

  // Service Center Information
  assignedTechnician: String,
  assignedTechnician_ar: String,
  workBay: String,
  
  // Smart Assistant Integration
  smartAssistant: {
    predictedFaults: [{
      component: String,
      component_ar: String,
      probability: { type: Number, min: 0, max: 1 },
      description: String,
      description_ar: String,
      recommendedAction: String,
      recommendedAction_ar: String
    }],
    diagnosticResults: [{
      code: String,
      description: String,
      description_ar: String,
      severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
      detectedAt: { type: Date, default: Date.now }
    }],
    customerInquiries: [{
      question: String,
      question_ar: String,
      answer: String,
      answer_ar: String,
      askedAt: { type: Date, default: Date.now },
      confidence: { type: Number, min: 0, max: 1 }
    }]
  },

  // Quality and Feedback
  qualityCheck: {
    isCompleted: { type: Boolean, default: false },
    checkedBy: String,
    checkedAt: Date,
    rating: { type: Number, min: 1, max: 5 },
    notes: String,
    notes_ar: String
  },

  customerFeedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    comment_ar: String,
    submittedAt: Date,
    wouldRecommend: Boolean
  },

  // Notifications and Communication
  notifications: {
    confirmationSent: { type: Boolean, default: false },
    reminderSent: { type: Boolean, default: false },
    completionNotificationSent: { type: Boolean, default: false },
    feedbackRequestSent: { type: Boolean, default: false }
  },

  // Audit Trail
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: String,
    reason: String,
    reason_ar: String
  }],

  // Additional Information
  specialRequests: String,
  specialRequests_ar: String,
  
  isFollowUpRequired: { type: Boolean, default: false },
  followUpDate: Date,
  followUpNotes: String,
  followUpNotes_ar: String,

  // Metadata
  source: {
    type: String,
    enum: ['website', 'mobile_app', 'phone', 'walk_in', 'referral'],
    default: 'website'
  },
  
  cancelledAt: Date,
  cancelledBy: String,
  cancellationReason: String,
  cancellationReason_ar: String,
  
  completedAt: Date

}, {
  timestamps: true,
  collection: 'bookings'
});

// Indexes for performance
bookingSchema.index({ bookingNumber: 1 });
bookingSchema.index({ customer: 1 });
bookingSchema.index({ 'vehicle.plateNumber': 1 });
bookingSchema.index({ scheduledDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'payment.status': 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ scheduledDate: 1, scheduledTime: 1 });

// Pre-save middleware to generate booking number
bookingSchema.pre('save', async function(next) {
  if (this.isNew && !this.bookingNumber) {
    const count = await mongoose.model('Booking').countDocuments();
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.bookingNumber = `BK${date}${(count + 1).toString().padStart(4, '0')}`;
  }
  
  // Calculate estimated completion time
  if (this.scheduledDate && this.scheduledTime && this.estimatedDuration) {
    const [hours, minutes] = this.scheduledTime.split(':').map(Number);
    const startTime = new Date(this.scheduledDate);
    startTime.setHours(hours, minutes, 0, 0);
    
    this.estimatedCompletionTime = new Date(startTime.getTime() + this.estimatedDuration * 60000);
  }
  
  next();
});

// Methods
bookingSchema.methods.calculateTotalAmount = function() {
  const subtotal = this.services.reduce((sum, service) => sum + service.totalPrice, 0);
  const taxAmount = subtotal * this.pricing.taxRate;
  const totalAmount = subtotal + taxAmount - this.pricing.discountAmount;
  
  this.pricing.subtotal = subtotal;
  this.pricing.taxAmount = taxAmount;
  this.pricing.totalAmount = totalAmount;
  
  return totalAmount;
};

bookingSchema.methods.updateStatus = function(newStatus, changedBy = 'system', reason = '') {
  this.statusHistory.push({
    status: this.status,
    changedBy,
    reason
  });
  
  this.status = newStatus;
  
  if (newStatus === 'completed') {
    this.completedAt = new Date();
  } else if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
    this.cancelledBy = changedBy;
  }
  
  return this.save();
};

bookingSchema.methods.addSmartPrediction = function(prediction) {
  this.smartAssistant.predictedFaults.push(prediction);
  return this.save();
};

bookingSchema.methods.canBeModified = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

// Static methods
bookingSchema.statics.getAvailableSlots = async function(date, duration = 60) {
  const startOfDay = new Date(date);
  startOfDay.setHours(8, 0, 0, 0); // 8 AM start
  
  const endOfDay = new Date(date);
  endOfDay.setHours(18, 0, 0, 0); // 6 PM end
  
  const bookings = await this.find({
    scheduledDate: {
      $gte: startOfDay,
      $lt: endOfDay
    },
    status: { $nin: ['cancelled', 'no_show'] }
  }).sort({ scheduledTime: 1 });
  
  // Generate available slots logic here
  const slots = [];
  let currentTime = new Date(startOfDay);
  
  while (currentTime < endOfDay) {
    const timeString = currentTime.toTimeString().slice(0, 5);
    const isAvailable = !bookings.some(booking => {
      const bookingStart = new Date(booking.scheduledDate);
      const [hours, minutes] = booking.scheduledTime.split(':').map(Number);
      bookingStart.setHours(hours, minutes);
      
      const bookingEnd = new Date(bookingStart.getTime() + booking.estimatedDuration * 60000);
      const slotEnd = new Date(currentTime.getTime() + duration * 60000);
      
      return (currentTime < bookingEnd && slotEnd > bookingStart);
    });
    
    if (isAvailable) {
      slots.push(timeString);
    }
    
    currentTime.setMinutes(currentTime.getMinutes() + 30); // 30-minute intervals
  }
  
  return slots;
};

export default mongoose.model('Booking', bookingSchema);