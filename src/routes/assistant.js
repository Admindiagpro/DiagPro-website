import express from 'express';
import { SmartAssistantService } from '../services/smartAssistantService.js';
import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';

const router = express.Router();

// POST /api/assistant/predict-faults - Predict vehicle faults
router.post('/predict-faults', async (req, res) => {
  try {
    const { 
      vehicleInfo, 
      symptoms, 
      mileage, 
      lastServiceDate,
      customerHistory 
    } = req.body;

    if (!vehicleInfo || !symptoms) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle information and symptoms are required',
        error_ar: 'معلومات المركبة والأعراض مطلوبة'
      });
    }

    const predictionResult = await SmartAssistantService.predictFaults({
      vehicleInfo,
      symptoms,
      mileage,
      lastServiceDate,
      customerHistory
    });

    res.json(res.localized({
      success: true,
      data: {
        predictions: predictionResult.predictions,
        confidence: predictionResult.confidence,
        recommendedActions: predictionResult.recommendedActions,
        urgencyLevel: predictionResult.urgencyLevel,
        estimatedCost: predictionResult.estimatedCost
      },
      message: req.rtl.isRTL ? 
        'تم تحليل الأعراض بنجاح' : 
        'Fault prediction completed successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to predict faults',
      error_ar: 'فشل في التنبؤ بالأعطال',
      details: error.message
    });
  }
});

// POST /api/assistant/chat - Chat with smart assistant
router.post('/chat', async (req, res) => {
  try {
    const { message, customerId, conversationId, language } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
        error_ar: 'الرسالة مطلوبة'
      });
    }

    // Get customer context if provided
    let customerContext = null;
    if (customerId) {
      customerContext = await Customer.findById(customerId)
        .populate('vehicles')
        .select('firstName lastName vehicles totalBookings preferences');
    }

    const chatResponse = await SmartAssistantService.processInquiry({
      message,
      language: language || (req.rtl.isRTL ? 'ar' : 'en'),
      customerContext,
      conversationId
    });

    // Save conversation if customer is logged in
    if (customerId && chatResponse.success) {
      await SmartAssistantService.saveConversation({
        customerId,
        conversationId: conversationId || chatResponse.conversationId,
        userMessage: message,
        assistantResponse: chatResponse.response,
        intent: chatResponse.intent,
        confidence: chatResponse.confidence
      });
    }

    res.json(res.localized({
      success: true,
      data: {
        response: chatResponse.response,
        intent: chatResponse.intent,
        confidence: chatResponse.confidence,
        conversationId: chatResponse.conversationId,
        suggestedActions: chatResponse.suggestedActions,
        relatedServices: chatResponse.relatedServices
      },
      message: req.rtl.isRTL ? 
        'تم معالجة الاستفسار بنجاح' : 
        'Inquiry processed successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process inquiry',
      error_ar: 'فشل في معالجة الاستفسار',
      details: error.message
    });
  }
});

// POST /api/assistant/analyze-symptoms - Analyze vehicle symptoms
router.post('/analyze-symptoms', async (req, res) => {
  try {
    const { symptoms, vehicleInfo, urgency } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one symptom is required',
        error_ar: 'عرض واحد على الأقل مطلوب'
      });
    }

    const analysisResult = await SmartAssistantService.analyzeSymptoms({
      symptoms,
      vehicleInfo,
      urgency: urgency || 'normal'
    });

    res.json(res.localized({
      success: true,
      data: {
        diagnosis: analysisResult.diagnosis,
        possibleCauses: analysisResult.possibleCauses,
        recommendedServices: analysisResult.recommendedServices,
        urgencyLevel: analysisResult.urgencyLevel,
        safetyWarnings: analysisResult.safetyWarnings,
        estimatedTimeToFix: analysisResult.estimatedTimeToFix,
        estimatedCost: analysisResult.estimatedCost
      },
      message: req.rtl.isRTL ? 
        'تم تحليل الأعراض بنجاح' : 
        'Symptoms analyzed successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to analyze symptoms',
      error_ar: 'فشل في تحليل الأعراض',
      details: error.message
    });
  }
});

// GET /api/assistant/maintenance-schedule/:vehicleId - Get maintenance schedule
router.get('/maintenance-schedule/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { mileage, lastServiceDate } = req.query;

    // Find customer with this vehicle
    const customer = await Customer.findOne({
      'vehicles._id': vehicleId
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found',
        error_ar: 'المركبة غير موجودة'
      });
    }

    const vehicle = customer.vehicles.id(vehicleId);
    
    const scheduleResult = await SmartAssistantService.generateMaintenanceSchedule({
      vehicle: vehicle.toObject(),
      currentMileage: mileage || vehicle.mileage,
      lastServiceDate: lastServiceDate || customer.lastVisit
    });

    res.json(res.localized({
      success: true,
      data: {
        vehicle: {
          make: vehicle.make,
          make_ar: vehicle.make_ar,
          model: vehicle.model,
          model_ar: vehicle.model_ar,
          year: vehicle.year,
          plateNumber: vehicle.plateNumber
        },
        schedule: scheduleResult.schedule,
        overdue: scheduleResult.overdue,
        upcoming: scheduleResult.upcoming,
        recommendations: scheduleResult.recommendations
      },
      message: req.rtl.isRTL ? 
        'تم إنشاء جدول الصيانة بنجاح' : 
        'Maintenance schedule generated successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate maintenance schedule',
      error_ar: 'فشل في إنشاء جدول الصيانة',
      details: error.message
    });
  }
});

// POST /api/assistant/book-recommended-service - Book recommended service
router.post('/book-recommended-service', async (req, res) => {
  try {
    const { customerId, vehicleId, recommendedServices, preferredDate, notes } = req.body;

    if (!customerId || !vehicleId || !recommendedServices) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID, vehicle ID, and recommended services are required',
        error_ar: 'رقم العميل ورقم المركبة والخدمات الموصى بها مطلوبة'
      });
    }

    const bookingResult = await SmartAssistantService.createRecommendedBooking({
      customerId,
      vehicleId,
      recommendedServices,
      preferredDate,
      notes,
      source: 'smart_assistant'
    });

    if (bookingResult.success) {
      res.status(201).json(res.localized({
        success: true,
        data: bookingResult.booking,
        message: req.rtl.isRTL ? 
          'تم إنشاء الحجز بناءً على التوصيات بنجاح' : 
          'Recommended service booking created successfully'
      }));
    } else {
      res.status(400).json({
        success: false,
        error: bookingResult.error,
        error_ar: 'فشل في إنشاء الحجز الموصى به'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create recommended booking',
      error_ar: 'فشل في إنشاء الحجز الموصى به',
      details: error.message
    });
  }
});

// GET /api/assistant/conversation/:customerId - Get customer conversation history
router.get('/conversation/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const conversations = await SmartAssistantService.getConversationHistory({
      customerId,
      page,
      limit
    });

    res.json(res.localized({
      success: true,
      data: conversations,
      message: req.rtl.isRTL ? 
        'تم جلب تاريخ المحادثات بنجاح' : 
        'Conversation history retrieved successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve conversation history',
      error_ar: 'فشل في جلب تاريخ المحادثات',
      details: error.message
    });
  }
});

// POST /api/assistant/feedback - Submit feedback on assistant response
router.post('/feedback', async (req, res) => {
  try {
    const { conversationId, rating, feedback, helpful } = req.body;

    if (!conversationId || rating === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Conversation ID and rating are required',
        error_ar: 'رقم المحادثة والتقييم مطلوبان'
      });
    }

    await SmartAssistantService.submitFeedback({
      conversationId,
      rating,
      feedback,
      helpful
    });

    res.json(res.localized({
      success: true,
      message: req.rtl.isRTL ? 
        'تم إرسال التقييم بنجاح' : 
        'Feedback submitted successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback',
      error_ar: 'فشل في إرسال التقييم',
      details: error.message
    });
  }
});

// GET /api/assistant/knowledge-base - Search knowledge base
router.get('/knowledge-base', async (req, res) => {
  try {
    const { query, category, language } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
        error_ar: 'استعلام البحث مطلوب'
      });
    }

    const searchResults = await SmartAssistantService.searchKnowledgeBase({
      query,
      category,
      language: language || (req.rtl.isRTL ? 'ar' : 'en')
    });

    res.json(res.localized({
      success: true,
      data: searchResults,
      message: req.rtl.isRTL ? 
        'تم البحث في قاعدة المعرفة بنجاح' : 
        'Knowledge base search completed successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search knowledge base',
      error_ar: 'فشل في البحث في قاعدة المعرفة',
      details: error.message
    });
  }
});

export default router;