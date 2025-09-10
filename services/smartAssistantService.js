const axios = require('axios');
const Service = require('../models/Service');

// Mock AI Service for demonstration
class SmartAssistantService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
  }

  // Car fault prediction knowledge base
  faultDatabase = {
    'engine_noise': {
      symptoms: ['knocking', 'grinding', 'squealing'],
      possibleCauses: ['worn bearings', 'timing chain issues', 'valve problems'],
      urgency: 'high',
      recommendedServices: ['engine_diagnostic', 'engine_repair']
    },
    'brake_issues': {
      symptoms: ['squeaking', 'grinding', 'soft_pedal', 'vibration'],
      possibleCauses: ['worn brake pads', 'warped rotors', 'brake fluid leak'],
      urgency: 'critical',
      recommendedServices: ['brake_inspection', 'brake_repair']
    },
    'electrical_problems': {
      symptoms: ['dim_lights', 'battery_drain', 'starting_issues'],
      possibleCauses: ['alternator failure', 'battery issues', 'wiring problems'],
      urgency: 'medium',
      recommendedServices: ['electrical_diagnostic', 'battery_test']
    },
    'transmission_trouble': {
      symptoms: ['slipping', 'hard_shifting', 'fluid_leak'],
      possibleCauses: ['low fluid', 'worn clutch', 'internal damage'],
      urgency: 'high',
      recommendedServices: ['transmission_diagnostic', 'transmission_service']
    },
    'cooling_system': {
      symptoms: ['overheating', 'coolant_leak', 'steam'],
      possibleCauses: ['radiator issues', 'thermostat failure', 'water pump'],
      urgency: 'high',
      recommendedServices: ['cooling_system_check', 'radiator_service']
    }
  };

  // Maintenance schedule based on mileage and time
  maintenanceSchedule = {
    5000: ['oil_change', 'filter_replacement'],
    10000: ['tire_rotation', 'brake_inspection'],
    15000: ['transmission_fluid_check', 'coolant_check'],
    30000: ['spark_plugs', 'air_filter', 'fuel_filter'],
    60000: ['timing_belt', 'water_pump', 'major_service']
  };

  async analyzeFaults(symptoms, vehicleInfo) {
    try {
      const analysis = [];
      
      // Analyze symptoms against knowledge base
      for (const [faultType, data] of Object.entries(this.faultDatabase)) {
        const matchingSymptoms = symptoms.filter(symptom => 
          data.symptoms.some(s => s.toLowerCase().includes(symptom.toLowerCase()) || 
                               symptom.toLowerCase().includes(s.toLowerCase()))
        );

        if (matchingSymptoms.length > 0) {
          analysis.push({
            faultType,
            matchingSymptoms,
            possibleCauses: data.possibleCauses,
            urgency: data.urgency,
            recommendedServices: data.recommendedServices,
            confidence: Math.min(0.9, matchingSymptoms.length / symptoms.length + 0.3)
          });
        }
      }

      // Sort by confidence
      analysis.sort((a, b) => b.confidence - a.confidence);

      return analysis;
    } catch (error) {
      console.error('Fault analysis error:', error);
      return [];
    }
  }

  async getMaintenanceRecommendations(vehicleInfo) {
    const { mileage, lastServiceDate, make, model, year } = vehicleInfo;
    const recommendations = [];

    // Mileage-based recommendations
    if (mileage) {
      for (const [milestone, services] of Object.entries(this.maintenanceSchedule)) {
        const milestoneMileage = parseInt(milestone);
        const mileageRemainder = mileage % milestoneMileage;
        
        if (mileageRemainder <= 1000) {
          recommendations.push({
            type: 'mileage_based',
            milestone: milestoneMileage,
            services,
            priority: mileageRemainder <= 500 ? 'high' : 'medium',
            reason: `Vehicle has reached ${milestoneMileage}km maintenance interval`
          });
        }
      }
    }

    // Time-based recommendations
    if (lastServiceDate) {
      const daysSinceService = Math.floor(
        (new Date() - new Date(lastServiceDate)) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceService > 90) {
        recommendations.push({
          type: 'time_based',
          daysSinceService,
          services: ['general_inspection', 'oil_change'],
          priority: daysSinceService > 180 ? 'high' : 'medium',
          reason: `${daysSinceService} days since last service`
        });
      }
    }

    // Vehicle age recommendations
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - year;

    if (vehicleAge > 5) {
      recommendations.push({
        type: 'age_based',
        vehicleAge,
        services: ['comprehensive_inspection', 'fluid_replacement'],
        priority: vehicleAge > 10 ? 'high' : 'medium',
        reason: `Vehicle is ${vehicleAge} years old - enhanced maintenance recommended`
      });
    }

    return recommendations;
  }

  async chatResponse(message, context = {}) {
    // Simple rule-based chat for demonstration
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('appointment') || lowerMessage.includes('booking')) {
      return {
        response: "I can help you book an appointment! You can schedule online through our booking system or call us. What type of service do you need?",
        suggestedActions: ['book_appointment', 'view_services']
      };
    }

    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return {
        response: "Service prices vary depending on your vehicle and the specific work needed. I can provide estimates once you tell me about your car and the issue you're experiencing.",
        suggestedActions: ['view_services', 'get_estimate']
      };
    }

    if (lowerMessage.includes('noise') || lowerMessage.includes('sound')) {
      return {
        response: "Car noises can indicate various issues. Can you describe the noise? Is it a squeaking, grinding, knocking, or another type of sound? Also, when do you hear it - when braking, accelerating, or turning?",
        suggestedActions: ['describe_symptoms', 'book_diagnostic']
      };
    }

    if (lowerMessage.includes('check engine') || lowerMessage.includes('warning light')) {
      return {
        response: "A check engine light can indicate many different issues. I recommend getting a diagnostic scan as soon as possible. Would you like to schedule a diagnostic appointment?",
        suggestedActions: ['book_diagnostic', 'emergency_service']
      };
    }

    if (lowerMessage.includes('oil change') || lowerMessage.includes('maintenance')) {
      return {
        response: "Regular maintenance is important for your vehicle's health. Oil changes are typically needed every 5,000-7,500 kilometers. When was your last oil change?",
        suggestedActions: ['book_oil_change', 'maintenance_schedule']
      };
    }

    // Default response
    return {
      response: "I'm here to help with your car maintenance needs! You can ask me about symptoms, schedule appointments, or get maintenance advice. What would you like to know?",
      suggestedActions: ['view_services', 'book_appointment', 'ask_question']
    };
  }
}

module.exports = SmartAssistantService;