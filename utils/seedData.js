const Service = require('../models/Service');

// Sample services data for demonstration
const sampleServices = [
  {
    name: 'Oil Change',
    description: 'Complete engine oil and filter replacement service',
    category: 'maintenance',
    basePrice: 150,
    duration: 30,
    complexity: 'simple',
    vehicleTypes: ['sedan', 'suv', 'truck'],
    estimatedMileageInterval: 5000,
    popularity: 95
  },
  {
    name: 'Brake Inspection',
    description: 'Comprehensive brake system inspection and safety check',
    category: 'brakes',
    basePrice: 80,
    duration: 45,
    complexity: 'moderate',
    vehicleTypes: ['sedan', 'suv', 'truck', 'van'],
    popularity: 78
  },
  {
    name: 'Engine Diagnostic',
    description: 'Computer-based engine diagnosis and fault code reading',
    category: 'diagnostic',
    basePrice: 120,
    duration: 60,
    complexity: 'moderate',
    vehicleTypes: ['sedan', 'suv', 'truck', 'van', 'luxury', 'sports'],
    popularity: 65
  },
  {
    name: 'Transmission Service',
    description: 'Transmission fluid change and system inspection',
    category: 'transmission',
    basePrice: 200,
    duration: 90,
    complexity: 'complex',
    vehicleTypes: ['sedan', 'suv', 'truck'],
    estimatedMileageInterval: 30000,
    popularity: 45
  },
  {
    name: 'AC System Check',
    description: 'Air conditioning system diagnosis and refrigerant check',
    category: 'ac_heating',
    basePrice: 100,
    duration: 60,
    complexity: 'moderate',
    vehicleTypes: ['sedan', 'suv', 'truck', 'van', 'luxury'],
    popularity: 55
  }
];

const seedServices = async () => {
  try {
    // Check if services already exist
    const existingServices = await Service.countDocuments();
    
    if (existingServices === 0) {
      await Service.insertMany(sampleServices);
      console.log('Sample services seeded successfully');
    } else {
      console.log('Services already exist, skipping seed');
    }
  } catch (error) {
    console.log('Service seeding skipped (database not available)');
  }
};

module.exports = { seedServices, sampleServices };