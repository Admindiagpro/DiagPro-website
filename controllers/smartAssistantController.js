const SmartAssistantService = require('../services/smartAssistantService');
const Service = require('../models/Service');

const smartAssistant = new SmartAssistantService();

// @desc    Predict potential faults based on symptoms
// @route   POST /api/smart-assistant/predict-faults
// @access  Public
exports.predictFaults = async (req, res, next) => {
  try {
    const { symptoms, vehicleInfo } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Symptoms array is required'
      });
    }

    const analysis = await smartAssistant.analyzeFaults(symptoms, vehicleInfo || {});

    // Get recommended services from database
    const serviceRecommendations = [];
    for (const fault of analysis) {
      if (fault.recommendedServices) {
        const services = await Service.find({
          name: { $in: fault.recommendedServices.map(s => new RegExp(s, 'i')) },
          isActive: true
        }).select('name basePrice duration category');
        
        serviceRecommendations.push(...services);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        analysis,
        recommendedServices: serviceRecommendations,
        totalPredictions: analysis.length,
        highPriorityIssues: analysis.filter(a => a.urgency === 'critical' || a.urgency === 'high').length
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get maintenance advice based on vehicle info
// @route   POST /api/smart-assistant/maintenance-advice
// @access  Public
exports.getMaintenanceAdvice = async (req, res, next) => {
  try {
    const { vehicleInfo } = req.body;

    if (!vehicleInfo) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle information is required'
      });
    }

    const recommendations = await smartAssistant.getMaintenanceRecommendations(vehicleInfo);

    // Get actual services from database
    const serviceDetails = [];
    for (const rec of recommendations) {
      if (rec.services) {
        const services = await Service.find({
          $or: rec.services.map(serviceName => ({
            name: new RegExp(serviceName.replace('_', ' '), 'i')
          })),
          isActive: true
        }).select('name basePrice duration category');
        
        serviceDetails.push({
          ...rec,
          serviceDetails: services
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        vehicleInfo,
        recommendations: serviceDetails,
        totalRecommendations: recommendations.length,
        highPriorityCount: recommendations.filter(r => r.priority === 'high').length
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Chat with smart assistant
// @route   POST /api/smart-assistant/chat
// @access  Public
exports.chatWithAssistant = async (req, res, next) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const response = await smartAssistant.chatResponse(message, context || {});

    res.status(200).json({
      success: true,
      data: {
        userMessage: message,
        assistantResponse: response.response,
        suggestedActions: response.suggestedActions,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Analyze symptoms and provide immediate advice
// @route   POST /api/smart-assistant/analyze-symptoms
// @access  Public
exports.analyzeSymptoms = async (req, res, next) => {
  try {
    const { symptoms, vehicleInfo, urgencyLevel } = req.body;

    if (!symptoms || !Array.isArray(symptoms)) {
      return res.status(400).json({
        success: false,
        message: 'Symptoms array is required'
      });
    }

    // Analyze faults
    const faultAnalysis = await smartAssistant.analyzeFaults(symptoms, vehicleInfo || {});

    // Determine immediate actions needed
    const criticalIssues = faultAnalysis.filter(a => a.urgency === 'critical');
    const highPriorityIssues = faultAnalysis.filter(a => a.urgency === 'high');

    let immediateAction = 'schedule_regular_appointment';
    let actionMessage = 'Please schedule an appointment for proper diagnosis and repair.';

    if (criticalIssues.length > 0) {
      immediateAction = 'emergency_service';
      actionMessage = 'URGENT: Stop driving immediately and contact emergency service. These symptoms indicate critical safety issues.';
    } else if (highPriorityIssues.length > 0) {
      immediateAction = 'priority_appointment';
      actionMessage = 'Please schedule an appointment as soon as possible. These issues require prompt attention.';
    }

    // Get safety recommendations
    const safetyRecommendations = [];
    if (symptoms.some(s => s.toLowerCase().includes('brake'))) {
      safetyRecommendations.push('Avoid high-speed driving until brakes are inspected');
      safetyRecommendations.push('Test brakes in a safe area before normal driving');
    }
    if (symptoms.some(s => s.toLowerCase().includes('steering'))) {
      safetyRecommendations.push('Drive slowly and maintain firm grip on steering wheel');
      safetyRecommendations.push('Avoid highway driving if possible');
    }

    res.status(200).json({
      success: true,
      data: {
        symptoms,
        analysis: faultAnalysis,
        immediateAction,
        actionMessage,
        safetyRecommendations,
        riskLevel: criticalIssues.length > 0 ? 'critical' : 
                   highPriorityIssues.length > 0 ? 'high' : 
                   faultAnalysis.length > 0 ? 'medium' : 'low'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get service suggestions based on customer history and vehicle
// @route   POST /api/smart-assistant/service-suggestions
// @access  Private
exports.getServiceSuggestions = async (req, res, next) => {
  try {
    const { customerId, vehicleInfo, budget, timeframe } = req.body;

    // Get customer's service history if provided
    let serviceHistory = [];
    if (customerId) {
      const Appointment = require('../models/Appointment');
      serviceHistory = await Appointment.find({
        customer: customerId,
        status: 'completed'
      })
      .populate('services.service', 'name category')
      .sort({ appointmentDate: -1 })
      .limit(10);
    }

    // Get maintenance recommendations
    const maintenanceRecs = await smartAssistant.getMaintenanceRecommendations(vehicleInfo || {});

    // Get services based on budget
    let budgetQuery = { isActive: true };
    if (budget) {
      budgetQuery.basePrice = { $lte: parseFloat(budget) };
    }

    const affordableServices = await Service.find(budgetQuery)
      .sort({ popularity: -1, averageRating: -1 })
      .limit(10);

    // Get popular services for vehicle type
    let popularServices = [];
    if (vehicleInfo && vehicleInfo.vehicleType) {
      popularServices = await Service.find({
        vehicleTypes: { $in: [vehicleInfo.vehicleType] },
        isActive: true
      })
      .sort({ popularity: -1 })
      .limit(5);
    }

    // Combine and prioritize suggestions
    const suggestions = {
      maintenance: maintenanceRecs,
      budget_friendly: affordableServices,
      popular_for_vehicle: popularServices,
      service_history: serviceHistory.map(apt => ({
        date: apt.appointmentDate,
        services: apt.services.map(s => s.service.name)
      }))
    };

    res.status(200).json({
      success: true,
      data: {
        suggestions,
        criteria: {
          budget: budget || 'not_specified',
          timeframe: timeframe || 'not_specified',
          vehicleInfo: vehicleInfo || {}
        },
        totalSuggestions: affordableServices.length + popularServices.length + maintenanceRecs.length
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};