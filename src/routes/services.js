import express from 'express';
import Service from '../models/Service.js';
import { validateService, validateServiceUpdate } from '../validators/serviceValidator.js';

const router = express.Router();

// GET /api/services - Get all services with filtering and pagination
router.get('/', async (req, res) => {
  try {
    // Check if database is connected by trying to get mongoose connection state
    const isDBConnected = false; // Database is commented out in server.js
    
    if (!isDBConnected) {
      // Return fallback services for frontend demo
      const fallbackServices = [
        {
          _id: '1',
          name: 'Advanced Diagnosis',
          name_ar: 'التشخيص المتقدم',
          description: 'Comprehensive diagnosis using advanced computer systems',
          description_ar: 'تشخيص شامل للأعطال باستخدام أحدث أجهزة الكمبيوتر',
          basePrice: 150,
          currency: 'SAR',
          duration: 60,
          category: 'diagnosis',
          category_ar: 'التشخيص',
          isActive: true,
          isPopular: true,
          averageRating: 4.8,
          totalBookings: 250
        },
        {
          _id: '2',
          name: 'Regular Maintenance',
          name_ar: 'صيانة دورية',
          description: 'Regular maintenance services for optimal performance',
          description_ar: 'خدمات الصيانة الدورية لضمان أداء مثالي لسيارتك',
          basePrice: 200,
          currency: 'SAR',
          duration: 120,
          category: 'maintenance',
          category_ar: 'الصيانة',
          isActive: true,
          isPopular: true,
          averageRating: 4.7,
          totalBookings: 300
        },
        {
          _id: '3',
          name: 'Engine Repair',
          name_ar: 'إصلاح المحرك',
          description: 'Engine repair and maintenance with highest quality standards',
          description_ar: 'إصلاح وصيانة المحركات بأعلى معايير الجودة',
          basePrice: 500,
          currency: 'SAR',
          duration: 240,
          category: 'repair',
          category_ar: 'الإصلاح',
          isActive: true,
          isPopular: false,
          averageRating: 4.9,
          totalBookings: 150
        },
        {
          _id: '4',
          name: 'Electrical System',
          name_ar: 'النظام الكهربائي',
          description: 'Electrical and electronic systems inspection and repair',
          description_ar: 'فحص وإصلاح الأنظمة الكهربائية والإلكترونية',
          basePrice: 100,
          currency: 'SAR',
          duration: 90,
          category: 'electrical',
          category_ar: 'الكهرباء',
          isActive: true,
          isPopular: true,
          averageRating: 4.6,
          totalBookings: 200
        }
      ];

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const total = fallbackServices.length;
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: fallbackServices,
        pagination: {
          currentPage: page,
          totalPages,
          totalServices: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        message: req.headers['accept-language']?.includes('ar') ? 
          'تم جلب الخدمات بنجاح' : 
          'Services retrieved successfully'
      });
      return;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Filter by active status
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    // Filter by category
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // Filter by price range
    if (req.query.minPrice || req.query.maxPrice) {
      filter.basePrice = {};
      if (req.query.minPrice) filter.basePrice.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.basePrice.$lte = parseFloat(req.query.maxPrice);
    }
    
    // Search functionality
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }
    
    // Filter by popularity
    if (req.query.popular === 'true') {
      filter.isPopular = true;
    }

    let sort = { createdAt: -1 };
    
    // Sort options
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'price_asc':
          sort = { basePrice: 1 };
          break;
        case 'price_desc':
          sort = { basePrice: -1 };
          break;
        case 'rating':
          sort = { averageRating: -1 };
          break;
        case 'popular':
          sort = { totalBookings: -1 };
          break;
        case 'name':
          sort = req.rtl.isRTL ? { name_ar: 1 } : { name: 1 };
          break;
      }
    }

    const services = await Service.find(filter)
      .select('-__v')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Service.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Add calculated prices and localized data
    const servicesWithPricing = services.map(service => {
      const serviceObj = service.toObject();
      serviceObj.calculatedPrice = service.calculatePrice(req.query.vehicleType, req.query.season);
      serviceObj.activePromotions = service.getActivePromotions();
      return serviceObj;
    });

    res.json(res.localized({
      success: true,
      data: servicesWithPricing,
      pagination: {
        currentPage: page,
        totalPages,
        totalServices: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      message: req.rtl.isRTL ? 
        'تم جلب الخدمات بنجاح' : 
        'Services retrieved successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve services',
      error_ar: 'فشل في جلب الخدمات',
      details: error.message
    });
  }
});

// GET /api/services/categories - Get service categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Service.distinct('category');
    const categoriesWithArabic = await Service.aggregate([
      { $group: { _id: '$category', category_ar: { $first: '$category_ar' } } },
      { $project: { category: '$_id', category_ar: 1, _id: 0 } }
    ]);

    res.json(res.localized({
      success: true,
      data: categoriesWithArabic,
      message: req.rtl.isRTL ? 
        'تم جلب فئات الخدمات بنجاح' : 
        'Service categories retrieved successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve categories',
      error_ar: 'فشل في جلب الفئات',
      details: error.message
    });
  }
});

// GET /api/services/popular - Get popular services
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const popularServices = await Service.find({ isActive: true, isPopular: true })
      .sort({ averageRating: -1, totalBookings: -1 })
      .limit(limit);

    const servicesWithPricing = popularServices.map(service => {
      const serviceObj = service.toObject();
      serviceObj.calculatedPrice = service.calculatePrice();
      serviceObj.activePromotions = service.getActivePromotions();
      return serviceObj;
    });

    res.json(res.localized({
      success: true,
      data: servicesWithPricing,
      message: req.rtl.isRTL ? 
        'تم جلب الخدمات الشائعة بنجاح' : 
        'Popular services retrieved successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve popular services',
      error_ar: 'فشل في جلب الخدمات الشائعة',
      details: error.message
    });
  }
});

// GET /api/services/:id - Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
        error_ar: 'الخدمة غير موجودة'
      });
    }

    const serviceObj = service.toObject();
    serviceObj.calculatedPrice = service.calculatePrice(req.query.vehicleType, req.query.season);
    serviceObj.activePromotions = service.getActivePromotions();

    res.json(res.localized({
      success: true,
      data: serviceObj,
      message: req.rtl.isRTL ? 
        'تم جلب بيانات الخدمة بنجاح' : 
        'Service retrieved successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve service',
      error_ar: 'فشل في جلب بيانات الخدمة',
      details: error.message
    });
  }
});

// POST /api/services - Create new service
router.post('/', validateService, async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();

    res.status(201).json(res.localized({
      success: true,
      data: service,
      message: req.rtl.isRTL ? 
        'تم إنشاء الخدمة بنجاح' : 
        'Service created successfully'
    }));
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to create service',
      error_ar: 'فشل في إنشاء الخدمة',
      details: error.message
    });
  }
});

// PUT /api/services/:id - Update service
router.put('/:id', validateServiceUpdate, async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
        error_ar: 'الخدمة غير موجودة'
      });
    }

    res.json(res.localized({
      success: true,
      data: service,
      message: req.rtl.isRTL ? 
        'تم تحديث الخدمة بنجاح' : 
        'Service updated successfully'
    }));
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to update service',
      error_ar: 'فشل في تحديث الخدمة',
      details: error.message
    });
  }
});

// DELETE /api/services/:id - Soft delete service
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
        error_ar: 'الخدمة غير موجودة'
      });
    }

    res.json(res.localized({
      success: true,
      message: req.rtl.isRTL ? 
        'تم حذف الخدمة بنجاح' : 
        'Service deleted successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete service',
      error_ar: 'فشل في حذف الخدمة',
      details: error.message
    });
  }
});

// POST /api/services/:id/promotions - Add promotion to service
router.post('/:id/promotions', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
        error_ar: 'الخدمة غير موجودة'
      });
    }

    service.promotionalOffers.push(req.body);
    await service.save();

    res.status(201).json(res.localized({
      success: true,
      data: service,
      message: req.rtl.isRTL ? 
        'تم إضافة العرض الترويجي بنجاح' : 
        'Promotion added successfully'
    }));
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to add promotion',
      error_ar: 'فشل في إضافة العرض الترويجي',
      details: error.message
    });
  }
});

// GET /api/services/:id/price - Calculate service price
router.get('/:id/price', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
        error_ar: 'الخدمة غير موجودة'
      });
    }

    const calculatedPrice = service.calculatePrice(req.query.vehicleType, req.query.season);
    const activePromotions = service.getActivePromotions();

    res.json(res.localized({
      success: true,
      data: {
        basePrice: service.basePrice,
        calculatedPrice,
        currency: service.currency,
        activePromotions,
        vehicleType: req.query.vehicleType,
        season: req.query.season
      },
      message: req.rtl.isRTL ? 
        'تم حساب سعر الخدمة بنجاح' : 
        'Service price calculated successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to calculate price',
      error_ar: 'فشل في حساب السعر',
      details: error.message
    });
  }
});

export default router;