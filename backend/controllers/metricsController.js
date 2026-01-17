const { Op } = require('sequelize');
const { Metric, Unit, Customer, sequelize } = require('../models');
const { NotFoundError } = require('../utils/errors');
const response = require('../utils/response');

/**
 * Get all metrics with optional date range filtering
 * GET /api/metrics
 */
const getAll = async (req, res) => {
  const { startMonth, endMonth, limit = 12 } = req.query;

  const where = {};

  if (startMonth) {
    where.month = { ...where.month, [Op.gte]: startMonth };
  }

  if (endMonth) {
    where.month = { ...where.month, [Op.lte]: endMonth };
  }

  const metrics = await Metric.findAll({
    where,
    order: [['month', 'DESC']],
    limit: parseInt(limit, 10),
  });

  return response.success(res, { metrics });
};

/**
 * Get metric by month
 * GET /api/metrics/:month
 */
const getByMonth = async (req, res) => {
  const metric = await Metric.findOne({
    where: { month: req.params.month },
  });

  if (!metric) {
    throw new NotFoundError('Metric');
  }

  return response.success(res, { metric });
};

/**
 * Calculate and store current month's metrics
 * POST /api/metrics/calculate
 */
const calculateCurrentMetrics = async (req, res) => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Calculate metrics
  const totalUnits = await Unit.count();
  const occupiedUnits = await Unit.count({ where: { isOccupied: true } });
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

  // Revenue calculation (occupied units * price)
  const totalRevenue = await Unit.sum('pricePerMonth', { where: { isOccupied: true } }) || 0;

  // New customers this month
  const newCustomers = await Customer.count({
    where: {
      startDate: {
        [Op.gte]: firstOfMonth.toISOString().split('T')[0],
        [Op.lte]: lastOfMonth.toISOString().split('T')[0],
      },
    },
  });

  // Churned customers this month
  const churnedCustomers = await Customer.count({
    where: {
      endDate: {
        [Op.gte]: firstOfMonth.toISOString().split('T')[0],
        [Op.lte]: lastOfMonth.toISOString().split('T')[0],
      },
    },
  });

  // Revenue by size
  const revenueBySize = await Unit.findAll({
    attributes: [
      'size',
      [sequelize.fn('SUM', sequelize.col('pricePerMonth')), 'revenue'],
    ],
    where: { isOccupied: true },
    group: ['size'],
    raw: true,
  });

  // Occupancy by size
  const occupancyBySize = await Unit.findAll({
    attributes: [
      'size',
      [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
      [
        sequelize.fn(
          'SUM',
          sequelize.literal("CASE WHEN isOccupied = 1 THEN 1 ELSE 0 END")
        ),
        'occupied',
      ],
    ],
    group: ['size'],
    raw: true,
  });

  // Calculate average rental duration for active rentals
  const activeRentals = await Unit.findAll({
    where: {
      isOccupied: true,
      rentedSince: { [Op.ne]: null },
    },
    attributes: ['rentedSince'],
    raw: true,
  });

  let averageRentalDuration = 0;
  if (activeRentals.length > 0) {
    const totalDays = activeRentals.reduce((sum, unit) => {
      const rentedDate = new Date(unit.rentedSince);
      const daysDiff = Math.floor((now - rentedDate) / (1000 * 60 * 60 * 24));
      return sum + daysDiff;
    }, 0);
    averageRentalDuration = (totalDays / activeRentals.length / 30).toFixed(2); // Convert to months
  }

  // Upsert metric
  const [metric, created] = await Metric.upsert({
    month: currentMonth,
    totalRevenue,
    occupancyRate: occupancyRate.toFixed(2),
    totalUnits,
    occupiedUnits,
    newCustomers,
    churnedCustomers,
    averageRentalDuration,
    revenueBySize: revenueBySize.reduce((acc, item) => {
      acc[item.size] = parseFloat(item.revenue) || 0;
      return acc;
    }, {}),
    occupancyBySize: occupancyBySize.reduce((acc, item) => {
      acc[item.size] = {
        total: parseInt(item.total, 10),
        occupied: parseInt(item.occupied, 10),
        rate: ((parseInt(item.occupied, 10) / parseInt(item.total, 10)) * 100).toFixed(2),
      };
      return acc;
    }, {}),
  });

  return response.success(
    res,
    { metric },
    created ? 'Metrics calculated and stored' : 'Metrics updated'
  );
};

/**
 * Get dashboard overview data
 * GET /api/metrics/dashboard
 */
const getDashboard = async (req, res) => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Get last 12 months of metrics
  const metrics = await Metric.findAll({
    order: [['month', 'DESC']],
    limit: 12,
  });

  // Current stats
  const totalUnits = await Unit.count();
  const occupiedUnits = await Unit.count({ where: { isOccupied: true } });
  const totalCustomers = await Customer.count();
  const activeCustomers = await Customer.count({
    where: {
      endDate: { [Op.or]: [null, { [Op.gte]: now }] },
    },
  });

  const currentRevenue = await Unit.sum('pricePerMonth', { where: { isOccupied: true } }) || 0;
  const potentialRevenue = await Unit.sum('pricePerMonth') || 0;

  // Calculate month-over-month changes
  const previousMonth = metrics[1];
  const currentMetrics = metrics[0];

  let revenueChange = 0;
  let occupancyChange = 0;

  if (previousMonth && currentMetrics) {
    revenueChange = previousMonth.totalRevenue > 0
      ? (((currentMetrics.totalRevenue - previousMonth.totalRevenue) / previousMonth.totalRevenue) * 100).toFixed(2)
      : 0;
    occupancyChange = (currentMetrics.occupancyRate - previousMonth.occupancyRate).toFixed(2);
  }

  return response.success(res, {
    overview: {
      totalUnits,
      occupiedUnits,
      availableUnits: totalUnits - occupiedUnits,
      occupancyRate: totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(2) : 0,
      totalCustomers,
      activeCustomers,
      currentRevenue,
      potentialRevenue,
      revenueUtilization: potentialRevenue > 0 ? ((currentRevenue / potentialRevenue) * 100).toFixed(2) : 0,
    },
    trends: {
      revenueChange: parseFloat(revenueChange),
      occupancyChange: parseFloat(occupancyChange),
    },
    historicalMetrics: metrics.reverse(), // Oldest to newest for charts
  });
};

/**
 * Get revenue analytics
 * GET /api/metrics/revenue
 */
const getRevenueAnalytics = async (req, res) => {
  const { months = 12 } = req.query;

  const metrics = await Metric.findAll({
    attributes: ['month', 'totalRevenue', 'revenueBySize'],
    order: [['month', 'DESC']],
    limit: parseInt(months, 10),
  });

  const currentRevenue = await Unit.sum('pricePerMonth', { where: { isOccupied: true } }) || 0;
  const potentialRevenue = await Unit.sum('pricePerMonth') || 0;

  // Revenue by size (current)
  const revenueBySize = await Unit.findAll({
    attributes: [
      'size',
      [sequelize.fn('SUM', sequelize.col('pricePerMonth')), 'revenue'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'units'],
    ],
    where: { isOccupied: true },
    group: ['size'],
    raw: true,
  });

  return response.success(res, {
    currentRevenue,
    potentialRevenue,
    lostRevenue: potentialRevenue - currentRevenue,
    revenueBySize: revenueBySize.map((item) => ({
      size: item.size,
      revenue: parseFloat(item.revenue) || 0,
      units: parseInt(item.units, 10),
    })),
    monthlyTrend: metrics.reverse(),
  });
};

/**
 * Get occupancy analytics
 * GET /api/metrics/occupancy
 */
const getOccupancyAnalytics = async (req, res) => {
  const { months = 12 } = req.query;

  const metrics = await Metric.findAll({
    attributes: ['month', 'occupancyRate', 'totalUnits', 'occupiedUnits', 'occupancyBySize'],
    order: [['month', 'DESC']],
    limit: parseInt(months, 10),
  });

  // Current occupancy by size
  const occupancyBySize = await Unit.findAll({
    attributes: [
      'size',
      [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
      [
        sequelize.fn(
          'SUM',
          sequelize.literal("CASE WHEN isOccupied = 1 THEN 1 ELSE 0 END")
        ),
        'occupied',
      ],
    ],
    group: ['size'],
    raw: true,
  });

  return response.success(res, {
    currentOccupancy: occupancyBySize.map((item) => ({
      size: item.size,
      total: parseInt(item.total, 10),
      occupied: parseInt(item.occupied, 10),
      available: parseInt(item.total, 10) - parseInt(item.occupied, 10),
      rate: ((parseInt(item.occupied, 10) / parseInt(item.total, 10)) * 100).toFixed(2),
    })),
    monthlyTrend: metrics.reverse(),
  });
};

module.exports = {
  getAll,
  getByMonth,
  calculateCurrentMetrics,
  getDashboard,
  getRevenueAnalytics,
  getOccupancyAnalytics,
};
