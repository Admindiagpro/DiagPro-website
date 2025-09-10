import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from '../models/Service.js';
import Customer from '../models/Customer.js';
import { connectDB } from '../config/database.js';

dotenv.config();

const seedServices = [
  {
    name: 'Oil Change',
    name_ar: 'تغيير الزيت',
    description: 'Complete oil and filter change service',
    description_ar: 'خدمة تغيير الزيت والفلتر بالكامل',
    category: 'oil_change',
    category_ar: 'تغيير الزيت',
    basePrice: 150,
    currency: 'SAR',
    estimatedDuration: 45,
    isActive: true,
    isPopular: true,
    requiresAppointment: true,
    vehicleTypes: ['sedan', 'suv', 'coupe', 'hatchback'],
    tags: ['maintenance', 'oil', 'filter'],
    tags_ar: ['صيانة', 'زيت', 'فلتر'],
    warrantyPeriod: 90,
    warrantyTerms: '90 days warranty on oil and filter',
    warrantyTerms_ar: 'ضمان 90 يوم على الزيت والفلتر'
  },
  {
    name: 'Brake Service',
    name_ar: 'خدمة الفرامل',
    description: 'Complete brake system inspection and service',
    description_ar: 'فحص وخدمة نظام الفرامل بالكامل',
    category: 'brake_service',
    category_ar: 'خدمة الفرامل',
    basePrice: 300,
    currency: 'SAR',
    estimatedDuration: 90,
    isActive: true,
    isPopular: true,
    requiresAppointment: true,
    vehicleTypes: ['sedan', 'suv', 'truck', 'coupe', 'hatchback'],
    requiredParts: [
      { name: 'Brake Pads', name_ar: 'فحمات الفرامل', isOptional: false, estimatedCost: 200 },
      { name: 'Brake Fluid', name_ar: 'سائل الفرامل', isOptional: false, estimatedCost: 50 }
    ],
    tags: ['safety', 'brakes', 'maintenance'],
    tags_ar: ['سلامة', 'فرامل', 'صيانة'],
    warrantyPeriod: 180,
    warrantyTerms: '6 months warranty on brake service',
    warrantyTerms_ar: 'ضمان 6 أشهر على خدمة الفرامل'
  },
  {
    name: 'AC Service',
    name_ar: 'خدمة التكييف',
    description: 'Air conditioning system maintenance and repair',
    description_ar: 'صيانة وإصلاح نظام تكييف الهواء',
    category: 'ac_service',
    category_ar: 'خدمة التكييف',
    basePrice: 250,
    currency: 'SAR',
    estimatedDuration: 60,
    isActive: true,
    isPopular: true,
    requiresAppointment: true,
    vehicleTypes: ['sedan', 'suv', 'coupe', 'hatchback'],
    seasonalPricing: [
      { season: 'summer', priceAdjustment: 20, isActive: true }
    ],
    tags: ['comfort', 'ac', 'cooling'],
    tags_ar: ['راحة', 'تكييف', 'تبريد'],
    warrantyPeriod: 120,
    warrantyTerms: '4 months warranty on AC service',
    warrantyTerms_ar: 'ضمان 4 أشهر على خدمة التكييف'
  },
  {
    name: 'Engine Diagnostic',
    name_ar: 'تشخيص المحرك',
    description: 'Comprehensive engine diagnostic using advanced tools',
    description_ar: 'تشخيص شامل للمحرك باستخدام أدوات متقدمة',
    category: 'diagnostic',
    category_ar: 'التشخيص',
    basePrice: 200,
    currency: 'SAR',
    estimatedDuration: 120,
    isActive: true,
    isPopular: true,
    requiresAppointment: true,
    smartAssistantSupported: true,
    vehicleTypes: ['sedan', 'suv', 'truck', 'coupe', 'hatchback'],
    tags: ['diagnostic', 'engine', 'technology'],
    tags_ar: ['تشخيص', 'محرك', 'تقنية'],
    warrantyPeriod: 30,
    warrantyTerms: '30 days warranty on diagnostic report',
    warrantyTerms_ar: 'ضمان 30 يوم على تقرير التشخيص'
  },
  {
    name: 'Tire Service',
    name_ar: 'خدمة الإطارات',
    description: 'Tire rotation, balancing, and alignment service',
    description_ar: 'دوران الإطارات والموازنة وضبط الزوايا',
    category: 'tire_service',
    category_ar: 'خدمة الإطارات',
    basePrice: 180,
    currency: 'SAR',
    estimatedDuration: 75,
    isActive: true,
    isPopular: false,
    requiresAppointment: true,
    vehicleTypes: ['sedan', 'suv', 'truck', 'coupe', 'hatchback'],
    tags: ['tires', 'safety', 'alignment'],
    tags_ar: ['إطارات', 'سلامة', 'زوايا'],
    warrantyPeriod: 60,
    warrantyTerms: '2 months warranty on tire service',
    warrantyTerms_ar: 'ضمان شهرين على خدمة الإطارات'
  }
];

const seedCustomers = [
  {
    firstName: 'Ahmed',
    lastName: 'Al-Saudi',
    firstName_ar: 'أحمد',
    lastName_ar: 'السعودي',
    email: 'ahmed.alsaudi@example.com',
    phone: '+966501234567',
    address: {
      street: 'King Fahd Road',
      street_ar: 'طريق الملك فهد',
      city: 'Riyadh',
      city_ar: 'الرياض',
      district: 'Al Olaya',
      district_ar: 'العليا',
      postalCode: '12211'
    },
    vehicles: [
      {
        make: 'Toyota',
        make_ar: 'تويوتا',
        model: 'Camry',
        model_ar: 'كامري',
        year: 2020,
        plateNumber: 'ABC1234',
        color: 'White',
        color_ar: 'أبيض',
        mileage: 45000,
        fuelType: 'gasoline',
        transmissionType: 'automatic'
      }
    ],
    customerType: 'individual',
    loyaltyPoints: 150,
    preferredLanguage: 'ar',
    isActive: true,
    isVerified: true
  },
  {
    firstName: 'Fatima',
    lastName: 'Al-Zahra',
    firstName_ar: 'فاطمة',
    lastName_ar: 'الزهراء',
    email: 'fatima.alzahra@example.com',
    phone: '+966507654321',
    address: {
      street: 'Prince Mohammed Road',
      street_ar: 'طريق الأمير محمد',
      city: 'Jeddah',
      city_ar: 'جدة',
      district: 'Al Salamah',
      district_ar: 'السلامة',
      postalCode: '21442'
    },
    vehicles: [
      {
        make: 'Honda',
        make_ar: 'هوندا',
        model: 'Accord',
        model_ar: 'أكورد',
        year: 2019,
        plateNumber: 'XYZ5678',
        color: 'Black',
        color_ar: 'أسود',
        mileage: 38000,
        fuelType: 'gasoline',
        transmissionType: 'automatic'
      }
    ],
    customerType: 'individual',
    loyaltyPoints: 200,
    preferredLanguage: 'ar',
    isActive: true,
    isVerified: true
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();
    
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await Service.deleteMany({});
    await Customer.deleteMany({});
    
    // Seed services
    console.log('📦 Seeding services...');
    const services = await Service.insertMany(seedServices);
    console.log(`✅ Inserted ${services.length} services`);
    
    // Seed customers
    console.log('👥 Seeding customers...');
    const customers = await Customer.insertMany(seedCustomers);
    console.log(`✅ Inserted ${customers.length} customers`);
    
    console.log('🎉 Database seeding completed successfully!');
    
    // Display summary
    console.log('\n📊 Summary:');
    console.log(`Services: ${services.length}`);
    console.log(`Customers: ${customers.length}`);
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📋 Database connection closed');
    process.exit(0);
  }
}

// Run seeding if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedDatabase();
}

export default seedDatabase;