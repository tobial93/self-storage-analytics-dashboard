const express = require('express');
const authRoutes = require('./auth');
const unitRoutes = require('./units');
const customerRoutes = require('./customers');
const metricsRoutes = require('./metrics');
const facilityRoutes = require('./facilities');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/units', unitRoutes);
router.use('/customers', customerRoutes);
router.use('/metrics', metricsRoutes);
router.use('/facilities', facilityRoutes);

module.exports = router;
