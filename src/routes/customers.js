import express from 'express';
import Customer from '../models/Customer.js';
import { validateCustomer, validateCustomerUpdate } from '../validators/customerValidator.js';

const router = express.Router();

// GET /api/customers - Get all customers with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Add search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { firstName_ar: searchRegex },
        { lastName_ar: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }
    
    // Filter by active status
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    // Filter by customer type
    if (req.query.customerType) {
      filter.customerType = req.query.customerType;
    }

    const customers = await Customer.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json(res.localized({
      success: true,
      data: customers,
      pagination: {
        currentPage: page,
        totalPages,
        totalCustomers: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      message: req.rtl.isRTL ? 
        'تم جلب بيانات العملاء بنجاح' : 
        'Customers retrieved successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve customers',
      error_ar: 'فشل في جلب بيانات العملاء',
      details: error.message
    });
  }
});

// GET /api/customers/:id - Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
        error_ar: 'العميل غير موجود'
      });
    }

    res.json(res.localized({
      success: true,
      data: customer,
      message: req.rtl.isRTL ? 
        'تم جلب بيانات العميل بنجاح' : 
        'Customer retrieved successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve customer',
      error_ar: 'فشل في جلب بيانات العميل',
      details: error.message
    });
  }
});

// POST /api/customers - Create new customer
router.post('/', validateCustomer, async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();

    res.status(201).json(res.localized({
      success: true,
      data: customer,
      message: req.rtl.isRTL ? 
        'تم إنشاء حساب العميل بنجاح' : 
        'Customer created successfully'
    }));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Email or phone number already exists',
        error_ar: 'البريد الإلكتروني أو رقم الهاتف موجود مسبقاً'
      });
    }
    
    res.status(400).json({
      success: false,
      error: 'Failed to create customer',
      error_ar: 'فشل في إنشاء حساب العميل',
      details: error.message
    });
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', validateCustomerUpdate, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
        error_ar: 'العميل غير موجود'
      });
    }

    res.json(res.localized({
      success: true,
      data: customer,
      message: req.rtl.isRTL ? 
        'تم تحديث بيانات العميل بنجاح' : 
        'Customer updated successfully'
    }));
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to update customer',
      error_ar: 'فشل في تحديث بيانات العميل',
      details: error.message
    });
  }
});

// DELETE /api/customers/:id - Soft delete customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
        error_ar: 'العميل غير موجود'
      });
    }

    res.json(res.localized({
      success: true,
      message: req.rtl.isRTL ? 
        'تم حذف العميل بنجاح' : 
        'Customer deleted successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete customer',
      error_ar: 'فشل في حذف العميل',
      details: error.message
    });
  }
});

// POST /api/customers/:id/vehicles - Add vehicle to customer
router.post('/:id/vehicles', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
        error_ar: 'العميل غير موجود'
      });
    }

    customer.vehicles.push(req.body);
    await customer.save();

    res.status(201).json(res.localized({
      success: true,
      data: customer,
      message: req.rtl.isRTL ? 
        'تم إضافة المركبة بنجاح' : 
        'Vehicle added successfully'
    }));
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to add vehicle',
      error_ar: 'فشل في إضافة المركبة',
      details: error.message
    });
  }
});

// GET /api/customers/:id/loyalty - Get customer loyalty points
router.get('/:id/loyalty', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('loyaltyPoints totalSpent totalBookings');
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
        error_ar: 'العميل غير موجود'
      });
    }

    res.json(res.localized({
      success: true,
      data: {
        loyaltyPoints: customer.loyaltyPoints,
        totalSpent: customer.totalSpent,
        totalBookings: customer.totalBookings
      },
      message: req.rtl.isRTL ? 
        'تم جلب نقاط الولاء بنجاح' : 
        'Loyalty points retrieved successfully'
    }));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve loyalty points',
      error_ar: 'فشل في جلب نقاط الولاء',
      details: error.message
    });
  }
});

export default router;