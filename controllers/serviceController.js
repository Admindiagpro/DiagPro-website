const Service = require('../models/Service');
const { validationResult } = require('express-validator');

// @desc    Get all services
// @route   GET /api/services
// @access  Public
exports.getServices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = { isActive: true };
    
    // Search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by price range
    if (req.query.minPrice || req.query.maxPrice) {
      query.basePrice = {};
      if (req.query.minPrice) query.basePrice.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.basePrice.$lte = parseFloat(req.query.maxPrice);
    }

    // Filter by duration range
    if (req.query.minDuration || req.query.maxDuration) {
      query.duration = {};
      if (req.query.minDuration) query.duration.$gte = parseInt(req.query.minDuration);
      if (req.query.maxDuration) query.duration.$lte = parseInt(req.query.maxDuration);
    }

    // Filter by vehicle type
    if (req.query.vehicleType) {
      query.vehicleTypes = { $in: [req.query.vehicleType] };
    }

    // Sort options
    let sort = {};
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'price_asc':
          sort.basePrice = 1;
          break;
        case 'price_desc':
          sort.basePrice = -1;
          break;
        case 'rating':
          sort.averageRating = -1;
          break;
        case 'popular':
          sort.popularity = -1;
          break;
        case 'duration':
          sort.duration = 1;
          break;
        default:
          sort.name = 1;
      }
    } else {
      sort.name = 1;
    }

    const services = await Service.find(query)
      .populate('relatedServices', 'name basePrice duration')
      .limit(limit * 1)
      .skip(startIndex)
      .sort(sort);

    const total = await Service.countDocuments(query);

    res.status(200).json({
      success: true,
      count: services.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: services
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
exports.getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('relatedServices', 'name basePrice duration category');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new service
// @route   POST /api/services
// @access  Private (Admin)
exports.createService = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const service = await Service.create(req.body);

    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private (Admin)
exports.updateService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private (Admin)
exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get service categories
// @route   GET /api/services/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Service.distinct('category', { isActive: true });
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get popular services
// @route   GET /api/services/popular
// @access  Public
exports.getPopularServices = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    
    const services = await Service.find({ isActive: true })
      .sort({ popularity: -1, averageRating: -1 })
      .limit(limit)
      .select('name basePrice duration category averageRating popularity');

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get service recommendations based on vehicle
// @route   GET /api/services/recommendations
// @access  Public
exports.getRecommendations = async (req, res, next) => {
  try {
    const { vehicleType, mileage, lastServiceDate } = req.query;
    
    let query = { isActive: true };
    
    // Filter by vehicle type if provided
    if (vehicleType) {
      query.vehicleTypes = { $in: [vehicleType] };
    }
    
    // Recommend based on mileage intervals
    let recommendations = [];
    
    if (mileage) {
      const currentMileage = parseInt(mileage);
      
      // Find services with mileage intervals
      const mileageBasedServices = await Service.find({
        ...query,
        estimatedMileageInterval: { $exists: true, $ne: null }
      });
      
      mileageBasedServices.forEach(service => {
        if (currentMileage % service.estimatedMileageInterval <= 1000) {
          recommendations.push({
            service,
            reason: `Due for maintenance based on mileage (${service.estimatedMileageInterval} km interval)`,
            priority: 'high'
          });
        }
      });
    }
    
    // Time-based recommendations
    if (lastServiceDate) {
      const daysSinceLastService = Math.floor(
        (new Date() - new Date(lastServiceDate)) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastService > 90) {
        const maintenanceServices = await Service.find({
          ...query,
          category: 'maintenance'
        }).limit(3);
        
        maintenanceServices.forEach(service => {
          recommendations.push({
            service,
            reason: `Regular maintenance recommended (${daysSinceLastService} days since last service)`,
            priority: daysSinceLastService > 180 ? 'high' : 'medium'
          });
        });
      }
    }
    
    // If no specific recommendations, suggest popular services
    if (recommendations.length === 0) {
      const popularServices = await Service.find(query)
        .sort({ popularity: -1 })
        .limit(5);
      
      popularServices.forEach(service => {
        recommendations.push({
          service,
          reason: 'Popular service among customers',
          priority: 'low'
        });
      });
    }

    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update service popularity
// @route   PATCH /api/services/:id/popularity
// @access  Private
exports.updatePopularity = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { $inc: { popularity: 1 } },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};