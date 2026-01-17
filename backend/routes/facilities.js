const express = require('express');
const { authenticateToken, checkFacilityAccess } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const facilityController = require('../controllers/facilityController');

const router = express.Router();

// Validation schemas
const createFacilitySchema = {
  body: {
    name: {
      required: true,
      type: 'string',
      minLength: 2,
      maxLength: 100,
    },
    address: {
      required: true,
      type: 'string',
      maxLength: 255,
    },
    city: {
      required: true,
      type: 'string',
      maxLength: 100,
    },
    state: {
      type: 'string',
      maxLength: 50,
    },
    zipCode: {
      required: true,
      type: 'string',
      maxLength: 20,
    },
    country: {
      required: true,
      type: 'string',
      maxLength: 50,
    },
    phone: {
      type: 'string',
      maxLength: 20,
    },
    email: {
      type: 'string',
      email: true,
    },
    totalUnits: {
      type: 'number',
      min: 0,
    },
  },
};

const updateFacilitySchema = {
  body: {
    name: {
      type: 'string',
      minLength: 2,
      maxLength: 100,
    },
    address: {
      type: 'string',
      maxLength: 255,
    },
    city: {
      type: 'string',
      maxLength: 100,
    },
    state: {
      type: 'string',
      maxLength: 50,
    },
    zipCode: {
      type: 'string',
      maxLength: 20,
    },
    country: {
      type: 'string',
      maxLength: 50,
    },
    phone: {
      type: 'string',
      maxLength: 20,
    },
    email: {
      type: 'string',
      email: true,
    },
    totalUnits: {
      type: 'number',
      min: 0,
    },
    isActive: {
      type: 'boolean',
    },
  },
};

// All routes require authentication
router.use(authenticateToken);

// Routes
router.get('/', asyncHandler(facilityController.getAllFacilities));
router.get('/:id', asyncHandler(facilityController.getFacilityById));
router.post('/', validate(createFacilitySchema), asyncHandler(facilityController.createFacility));
router.put('/:id', validate(updateFacilitySchema), asyncHandler(facilityController.updateFacility));
router.delete('/:id', asyncHandler(facilityController.deleteFacility));

module.exports = router;
