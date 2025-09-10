import mongoose from 'mongoose';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';

// Mock AI/ML service - in production, this would integrate with actual AI services
class SmartAssistantService {
  constructor() {
    this.knowledgeBase = new Map();
    this.conversationHistory = new Map();
    this.diagnosticPatterns = new Map();
    this.initializeKnowledgeBase();
    this.initializeDiagnosticPatterns();
  }

  initializeKnowledgeBase() {
    // Initialize with common automotive knowledge
    this.knowledgeBase.set('engine_noise', {
      ar: {
        symptoms: ['صوت في المحرك', 'ضوضاء المحرك', 'صوت غريب'],
        causes: ['مشكلة في الزيت', 'تآكل قطع المحرك', 'مشكلة في حزام التوقيت'],
        solutions: ['فحص مستوى الزيت', 'فحص المحرك', 'استبدال القطع التالفة']
      },
      en: {
        symptoms: ['engine noise', 'motor noise', 'strange sound'],
        causes: ['oil problems', 'engine wear', 'timing belt issues'],
        solutions: ['check oil level', 'engine inspection', 'replace worn parts']
      }
    });

    this.knowledgeBase.set('brake_issues', {
      ar: {
        symptoms: ['صوت الفرامل', 'اهتزاز عند الفرملة', 'ضعف الفرامل'],
        causes: ['تآكل قطع الفرامل', 'مشكلة في السائل', 'تشويه الأقراص'],
        solutions: ['استبدال فحمات الفرامل', 'تغيير سائل الفرامل', 'إصلاح النظام']
      },
      en: {
        symptoms: ['brake noise', 'vibration when braking', 'weak brakes'],
        causes: ['brake pad wear', 'brake fluid issues', 'disc warping'],
        solutions: ['replace brake pads', 'change brake fluid', 'repair system']
      }
    });

    this.knowledgeBase.set('ac_problems', {
      ar: {
        symptoms: ['ضعف التكييف', 'عدم تبريد', 'صوت التكييف', 'رائحة كريهة'],
        causes: ['نقص الفريون', 'انسداد الفلتر', 'عطل في الضاغط'],
        solutions: ['إعادة شحن الفريون', 'تنظيف الفلتر', 'فحص النظام']
      },
      en: {
        symptoms: ['weak AC', 'no cooling', 'AC noise', 'bad smell'],
        causes: ['low refrigerant', 'clogged filter', 'compressor failure'],
        solutions: ['recharge refrigerant', 'clean filter', 'system inspection']
      }
    });
  }

  initializeDiagnosticPatterns() {
    // Common diagnostic patterns with probability weights
    this.diagnosticPatterns.set('engine_patterns', [
      {
        symptoms: ['engine_noise', 'vibration', 'loss_of_power'],
        diagnosis: 'engine_mount_failure',
        probability: 0.7,
        urgency: 'medium',
        estimatedCost: { min: 300, max: 800 }
      },
      {
        symptoms: ['overheating', 'coolant_leak', 'steam'],
        diagnosis: 'cooling_system_failure',
        probability: 0.8,
        urgency: 'high',
        estimatedCost: { min: 500, max: 1500 }
      }
    ]);

    this.diagnosticPatterns.set('brake_patterns', [
      {
        symptoms: ['brake_noise', 'vibration_braking', 'spongy_pedal'],
        diagnosis: 'brake_system_service_needed',
        probability: 0.75,
        urgency: 'high',
        estimatedCost: { min: 400, max: 1200 }
      }
    ]);
  }

  async predictFaults(data) {
    try {
      const { vehicleInfo, symptoms, mileage, lastServiceDate, customerHistory } = data;
      
      // Analyze symptoms against diagnostic patterns
      const predictions = [];
      let overallConfidence = 0;
      
      for (const [category, patterns] of this.diagnosticPatterns) {
        for (const pattern of patterns) {
          const matchScore = this.calculateSymptomMatch(symptoms, pattern.symptoms);
          
          if (matchScore > 0.5) {
            const ageAdjustment = this.calculateAgeAdjustment(vehicleInfo.year);
            const mileageAdjustment = this.calculateMileageAdjustment(mileage);
            const serviceAdjustment = this.calculateServiceAdjustment(lastServiceDate);
            
            const adjustedProbability = Math.min(
              pattern.probability * matchScore * ageAdjustment * mileageAdjustment * serviceAdjustment,
              1.0
            );
            
            predictions.push({
              component: this.getLocalizedComponent(pattern.diagnosis),
              probability: adjustedProbability,
              description: this.getLocalizedDescription(pattern.diagnosis),
              recommendedAction: this.getLocalizedAction(pattern.diagnosis),
              urgency: pattern.urgency,
              estimatedCost: pattern.estimatedCost
            });
          }
        }
      }
      
      // Sort by probability
      predictions.sort((a, b) => b.probability - a.probability);
      
      // Calculate overall confidence
      overallConfidence = predictions.length > 0 ? 
        predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length : 0;

      // Generate recommended actions
      const recommendedActions = this.generateRecommendedActions(predictions);
      
      // Determine urgency level
      const urgencyLevel = this.determineUrgencyLevel(predictions);
      
      // Estimate total cost
      const estimatedCost = this.calculateEstimatedCost(predictions);

      return {
        predictions: predictions.slice(0, 5), // Top 5 predictions
        confidence: overallConfidence,
        recommendedActions,
        urgencyLevel,
        estimatedCost
      };
    } catch (error) {
      throw new Error(`Fault prediction failed: ${error.message}`);
    }
  }

  async processInquiry(data) {
    try {
      const { message, language, customerContext, conversationId } = data;
      
      // Analyze message intent
      const intent = this.analyzeIntent(message, language);
      
      // Generate response based on intent
      let response = '';
      let suggestedActions = [];
      let relatedServices = [];
      let confidence = 0.8;
      
      switch (intent.type) {
        case 'greeting':
          response = language === 'ar' ? 
            'أهلاً وسهلاً! كيف يمكنني مساعدتك اليوم؟' :
            'Hello! How can I assist you today?';
          break;
          
        case 'service_inquiry':
          const serviceInfo = await this.handleServiceInquiry(intent.entities, language);
          response = serviceInfo.response;
          relatedServices = serviceInfo.services;
          break;
          
        case 'booking_inquiry':
          response = language === 'ar' ? 
            'يمكنني مساعدتك في حجز موعد. ما نوع الخدمة التي تحتاجها؟' :
            'I can help you book an appointment. What type of service do you need?';
          suggestedActions = ['book_appointment', 'view_services'];
          break;
          
        case 'technical_support':
          const technicalHelp = await this.handleTechnicalInquiry(intent.entities, language);
          response = technicalHelp.response;
          suggestedActions = technicalHelp.actions;
          break;
          
        default:
          response = language === 'ar' ? 
            'أعتذر، لم أفهم طلبك. هل يمكنك إعادة صياغته؟' :
            'I apologize, I didn\'t understand your request. Could you rephrase it?';
          confidence = 0.3;
      }
      
      const newConversationId = conversationId || this.generateConversationId();
      
      return {
        success: true,
        response,
        intent: intent.type,
        confidence,
        conversationId: newConversationId,
        suggestedActions,
        relatedServices
      };
    } catch (error) {
      throw new Error(`Inquiry processing failed: ${error.message}`);
    }
  }

  async analyzeSymptoms(data) {
    try {
      const { symptoms, vehicleInfo, urgency } = data;
      
      // Analyze each symptom
      const analyses = [];
      let overallUrgency = 'normal';
      let safetyWarnings = [];
      
      for (const symptom of symptoms) {
        const analysis = this.analyzeSingleSymptom(symptom);
        analyses.push(analysis);
        
        if (analysis.urgency === 'critical') {
          overallUrgency = 'critical';
          safetyWarnings.push(...analysis.safetyWarnings);
        } else if (analysis.urgency === 'high' && overallUrgency !== 'critical') {
          overallUrgency = 'high';
        }
      }
      
      // Get recommended services
      const recommendedServices = await this.getRecommendedServices(analyses);
      
      // Estimate time and cost
      const estimatedTimeToFix = this.estimateRepairTime(analyses);
      const estimatedCost = this.estimateRepairCost(analyses);
      
      return {
        diagnosis: this.compileDiagnosis(analyses),
        possibleCauses: this.compilePossibleCauses(analyses),
        recommendedServices,
        urgencyLevel: overallUrgency,
        safetyWarnings: [...new Set(safetyWarnings)], // Remove duplicates
        estimatedTimeToFix,
        estimatedCost
      };
    } catch (error) {
      throw new Error(`Symptom analysis failed: ${error.message}`);
    }
  }

  async generateMaintenanceSchedule(data) {
    try {
      const { vehicle, currentMileage, lastServiceDate } = data;
      
      // Standard maintenance intervals based on vehicle age and mileage
      const maintenanceItems = this.getMaintenanceItems(vehicle);
      
      const schedule = [];
      const overdue = [];
      const upcoming = [];
      
      for (const item of maintenanceItems) {
        const status = this.calculateMaintenanceStatus(
          item, 
          currentMileage, 
          lastServiceDate, 
          vehicle.year
        );
        
        const scheduleItem = {
          ...item,
          status: status.status,
          dueDate: status.dueDate,
          dueMileage: status.dueMileage,
          priority: status.priority
        };
        
        schedule.push(scheduleItem);
        
        if (status.status === 'overdue') {
          overdue.push(scheduleItem);
        } else if (status.status === 'due_soon') {
          upcoming.push(scheduleItem);
        }
      }
      
      // Generate recommendations
      const recommendations = this.generateMaintenanceRecommendations(overdue, upcoming, vehicle);
      
      return {
        schedule: schedule.sort((a, b) => a.priority - b.priority),
        overdue: overdue.sort((a, b) => a.priority - b.priority),
        upcoming: upcoming.sort((a, b) => a.priority - b.priority),
        recommendations
      };
    } catch (error) {
      throw new Error(`Maintenance schedule generation failed: ${error.message}`);
    }
  }

  // Helper methods
  calculateSymptomMatch(userSymptoms, patternSymptoms) {
    const matches = userSymptoms.filter(symptom => 
      patternSymptoms.some(pattern => 
        symptom.toLowerCase().includes(pattern.toLowerCase())
      )
    );
    return matches.length / patternSymptoms.length;
  }

  calculateAgeAdjustment(year) {
    const age = new Date().getFullYear() - year;
    return age > 10 ? 1.2 : age > 5 ? 1.1 : 1.0;
  }

  calculateMileageAdjustment(mileage) {
    if (!mileage) return 1.0;
    return mileage > 200000 ? 1.3 : mileage > 100000 ? 1.2 : 1.0;
  }

  calculateServiceAdjustment(lastServiceDate) {
    if (!lastServiceDate) return 1.2;
    const daysSinceService = (Date.now() - new Date(lastServiceDate)) / (1000 * 60 * 60 * 24);
    return daysSinceService > 365 ? 1.3 : daysSinceService > 180 ? 1.1 : 1.0;
  }

  analyzeIntent(message, language) {
    const lowerMessage = message.toLowerCase();
    
    // Simple intent classification - in production, use NLP services
    if (this.containsGreeting(lowerMessage, language)) {
      return { type: 'greeting', entities: [] };
    }
    
    if (this.containsServiceKeywords(lowerMessage, language)) {
      return { type: 'service_inquiry', entities: this.extractServiceEntities(lowerMessage, language) };
    }
    
    if (this.containsBookingKeywords(lowerMessage, language)) {
      return { type: 'booking_inquiry', entities: [] };
    }
    
    if (this.containsTechnicalKeywords(lowerMessage, language)) {
      return { type: 'technical_support', entities: this.extractTechnicalEntities(lowerMessage, language) };
    }
    
    return { type: 'unknown', entities: [] };
  }

  containsGreeting(message, language) {
    const greetings = language === 'ar' ? 
      ['مرحبا', 'أهلا', 'السلام', 'صباح', 'مساء'] :
      ['hello', 'hi', 'good morning', 'good evening', 'hey'];
    
    return greetings.some(greeting => message.includes(greeting));
  }

  containsServiceKeywords(message, language) {
    const keywords = language === 'ar' ? 
      ['خدمة', 'صيانة', 'إصلاح', 'فحص', 'تغيير'] :
      ['service', 'maintenance', 'repair', 'check', 'change'];
    
    return keywords.some(keyword => message.includes(keyword));
  }

  containsBookingKeywords(message, language) {
    const keywords = language === 'ar' ? 
      ['حجز', 'موعد', 'تحديد'] :
      ['book', 'appointment', 'schedule'];
    
    return keywords.some(keyword => message.includes(keyword));
  }

  containsTechnicalKeywords(message, language) {
    const keywords = language === 'ar' ? 
      ['مشكلة', 'عطل', 'صوت', 'ضوضاء', 'اهتزاز'] :
      ['problem', 'issue', 'noise', 'vibration', 'trouble'];
    
    return keywords.some(keyword => message.includes(keyword));
  }

  extractServiceEntities(message, language) {
    // Extract service-related entities from message
    return [];
  }

  extractTechnicalEntities(message, language) {
    // Extract technical problem entities from message
    return [];
  }

  generateConversationId() {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getLocalizedComponent(diagnosis) {
    const components = {
      engine_mount_failure: { ar: 'دعامات المحرك', en: 'Engine Mounts' },
      cooling_system_failure: { ar: 'نظام التبريد', en: 'Cooling System' },
      brake_system_service_needed: { ar: 'نظام الفرامل', en: 'Brake System' }
    };
    return components[diagnosis] || { ar: 'غير محدد', en: 'Unknown' };
  }

  getLocalizedDescription(diagnosis) {
    const descriptions = {
      engine_mount_failure: { 
        ar: 'تحتاج دعامات المحرك إلى فحص أو استبدال',
        en: 'Engine mounts need inspection or replacement'
      },
      cooling_system_failure: {
        ar: 'يحتاج نظام التبريد إلى فحص وإصلاح',
        en: 'Cooling system needs inspection and repair'
      }
    };
    return descriptions[diagnosis] || { ar: 'يحتاج إلى فحص', en: 'Needs inspection' };
  }

  getLocalizedAction(diagnosis) {
    const actions = {
      engine_mount_failure: {
        ar: 'فحص دعامات المحرك واستبدال التالف منها',
        en: 'Inspect engine mounts and replace damaged ones'
      },
      cooling_system_failure: {
        ar: 'فحص نظام التبريد وإصلاح التسريبات',
        en: 'Inspect cooling system and repair leaks'
      }
    };
    return actions[diagnosis] || { ar: 'فحص شامل', en: 'Comprehensive inspection' };
  }

  // Placeholder methods - implement based on business logic
  async handleServiceInquiry(entities, language) {
    return {
      response: language === 'ar' ? 'يمكنني مساعدتك في معرفة خدماتنا' : 'I can help you learn about our services',
      services: []
    };
  }

  async handleTechnicalInquiry(entities, language) {
    return {
      response: language === 'ar' ? 'سأساعدك في حل المشكلة التقنية' : 'I\'ll help you solve the technical issue',
      actions: ['diagnose_problem']
    };
  }

  async saveConversation(data) {
    // Save conversation to database
    console.log('Saving conversation:', data);
  }

  async getConversationHistory(data) {
    // Retrieve conversation history from database
    return { conversations: [], total: 0 };
  }

  async submitFeedback(data) {
    // Save feedback to database
    console.log('Saving feedback:', data);
  }

  async searchKnowledgeBase(data) {
    // Search knowledge base
    return { results: [], total: 0 };
  }

  async createRecommendedBooking(data) {
    // Create booking based on AI recommendations
    return { success: true, booking: null };
  }

  // Additional helper methods would be implemented here...
  analyzeSingleSymptom(symptom) {
    return {
      symptom,
      urgency: 'normal',
      safetyWarnings: [],
      possibleCauses: []
    };
  }

  compileDiagnosis(analyses) {
    return { ar: 'تشخيص أولي', en: 'Initial diagnosis' };
  }

  compilePossibleCauses(analyses) {
    return [];
  }

  async getRecommendedServices(analyses) {
    return [];
  }

  estimateRepairTime(analyses) {
    return { hours: 2, description: 'Estimated repair time' };
  }

  estimateRepairCost(analyses) {
    return { min: 200, max: 500, currency: 'SAR' };
  }

  getMaintenanceItems(vehicle) {
    return [];
  }

  calculateMaintenanceStatus(item, mileage, lastService, year) {
    return {
      status: 'scheduled',
      dueDate: new Date(),
      dueMileage: mileage + 5000,
      priority: 1
    };
  }

  generateMaintenanceRecommendations(overdue, upcoming, vehicle) {
    return [];
  }

  generateRecommendedActions(predictions) {
    return predictions.map(p => ({
      action: 'schedule_inspection',
      description: p.description,
      urgency: p.urgency
    }));
  }

  determineUrgencyLevel(predictions) {
    if (predictions.some(p => p.urgency === 'critical')) return 'critical';
    if (predictions.some(p => p.urgency === 'high')) return 'high';
    if (predictions.some(p => p.urgency === 'medium')) return 'medium';
    return 'low';
  }

  calculateEstimatedCost(predictions) {
    const totalMin = predictions.reduce((sum, p) => sum + (p.estimatedCost?.min || 0), 0);
    const totalMax = predictions.reduce((sum, p) => sum + (p.estimatedCost?.max || 0), 0);
    
    return {
      min: totalMin,
      max: totalMax,
      currency: 'SAR'
    };
  }
}

// Export as singleton
const smartAssistantServiceInstance = new SmartAssistantService();
export { smartAssistantServiceInstance as SmartAssistantService };