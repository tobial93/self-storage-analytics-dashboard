const express = require('express');
const { authenticateToken, authorizeRoles, checkFacilityAccess } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const unitController = require('../controllers/unitController');

const router = express.Router();

// Validation schemas
const createUnitSchema = {
  body: {
    id: {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 10,
    },
    size: {
      required: true,
      type: 'string',
      enum: ['5m²', '10m²', '15m²', '20m²', '30m²'],
    },
    pricePerMonth: {
      required: true,
      type: 'number',
      min: 0,
    },
    floor: {
      type: 'number',
      min: 0,
    },
    notes: {
      type: 'string',
    },
  },
};

const updateUnitSchema = {
  body: {
    size: {
      type: 'string',
      enum: ['5m²', '10m²', '15m²', '20m²', '30m²'],
    },
    pricePerMonth: {
      type: 'number',
      min: 0,
    },
    floor: {
      type: 'number',
      min: 0,
    },
    notes: {
      type: 'string',
    },
  },
};

const rentUnitSchema = {
  body: {
    customerId: {
      required: true,
      type: 'string',
    },
  },
};

// All routes require authentication
router.use(authenticateToken);

// Get unit statistics (must be before /:id route)
router.get('/stats', checkFacilityAccess, asyncHandler(unitController.getStats));

// Get all units with pagination and filtering
router.get('/', checkFacilityAccess, asyncHandler(unitController.getAll));

// Get unit by ID
router.get('/:id', checkFacilityAccess, asyncHandler(unitController.getById));

// Create new unit (admin and manager only)
router.post(
  '/',
  authorizeRoles('admin', 'manager'),
  validate(createUnitSchema),
  asyncHandler(unitController.create)
);

// Update unit (admin and manager only)
router.put(
  '/:id',
  authorizeRoles('admin', 'manager'),
  validate(updateUnitSchema),
  asyncHandler(unitController.update)
);

// Delete unit (admin only)
router.delete(
  '/:id',
  authorizeRoles('admin'),
  asyncHandler(unitController.remove)
);

// Rent unit to customer (admin and manager only)
router.post(
  '/:id/rent',
  authorizeRoles('admin', 'manager'),
  validate(rentUnitSchema),
  asyncHandler(unitController.rentUnit)
);

// Release unit from customer (admin and manager only)
router.post(
  '/:id/release',
  authorizeRoles('admin', 'manager'),
  asyncHandler(unitController.releaseUnit)
);

module.exports = router;
