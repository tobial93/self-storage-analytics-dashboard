const { Op } = require('sequelize');
const { Unit, Customer } = require('../models');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const response = require('../utils/response');
const config = require('../config');

/**
 * Get all units with pagination and filtering
 * GET /api/units
 */
const getAll = async (req, res) => {
  const {
    page = 1,
    limit = config.pagination.defaultLimit,
    size,
    occupied,
    search,
    sortBy = 'id',
    sortOrder = 'ASC',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(
    parseInt(limit, 10) || config.pagination.defaultLimit,
    config.pagination.maxLimit
  );
  const offset = (pageNum - 1) * limitNum;

  // Build where clause
  const where = {};

  if (size) {
    where.size = size;
  }

  if (occupied === 'true') {
    where.isOccupied = true;
  } else if (occupied === 'false') {
    where.isOccupied = false;
  }

  if (search) {
    where.id = { [Op.like]: `%${search}%` };
  }

  // Validate sort field
  const allowedSortFields = ['id', 'size', 'pricePerMonth', 'isOccupied', 'createdAt'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'id';
  const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const { count, rows: units } = await Unit.findAndCountAll({
    where,
    include: [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'type'],
      },
    ],
    limit: limitNum,
    offset,
    order: [[sortField, order]],
  });

  return response.paginated(res, units, {
    page: pageNum,
    limit: limitNum,
    total: count,
  });
};

/**
 * Get unit by ID
 * GET /api/units/:id
 */
const getById = async (req, res) => {
  const unit = await Unit.findByPk(req.params.id, {
    include: [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'type', 'email', 'phone', 'startDate'],
      },
    ],
  });

  if (!unit) {
    throw new NotFoundError('Unit');
  }

  return response.success(res, { unit });
};

/**
 * Create new unit
 * POST /api/units
 */
const create = async (req, res) => {
  const { id, size, pricePerMonth, floor, notes } = req.body;

  // Check if unit ID already exists
  const existingUnit = await Unit.findByPk(id);
  if (existingUnit) {
    throw new BadRequestError(`Unit with ID ${id} already exists`);
  }

  const unit = await Unit.create({
    id,
    size,
    pricePerMonth,
    floor,
    notes,
    isOccupied: false,
  });

  return response.created(res, { unit }, 'Unit created successfully');
};

/**
 * Update unit
 * PUT /api/units/:id
 */
const update = async (req, res) => {
  const unit = await Unit.findByPk(req.params.id);

  if (!unit) {
    throw new NotFoundError('Unit');
  }

  const { size, pricePerMonth, floor, notes } = req.body;

  await unit.update({
    size,
    pricePerMonth,
    floor,
    notes,
  });

  return response.success(res, { unit }, 'Unit updated successfully');
};

/**
 * Delete unit
 * DELETE /api/units/:id
 */
const remove = async (req, res) => {
  const unit = await Unit.findByPk(req.params.id);

  if (!unit) {
    throw new NotFoundError('Unit');
  }

  if (unit.isOccupied) {
    throw new BadRequestError('Cannot delete an occupied unit. Release it first.');
  }

  await unit.destroy();

  return response.success(res, null, 'Unit deleted successfully');
};

/**
 * Rent unit to a customer
 * POST /api/units/:id/rent
 */
const rentUnit = async (req, res) => {
  const { customerId } = req.body;

  const unit = await Unit.findByPk(req.params.id);

  if (!unit) {
    throw new NotFoundError('Unit');
  }

  if (unit.isOccupied) {
    throw new BadRequestError('Unit is already occupied');
  }

  // Verify customer exists and is active
  const customer = await Customer.findByPk(customerId);
  if (!customer) {
    throw new NotFoundError('Customer');
  }

  if (customer.endDate && new Date(customer.endDate) < new Date()) {
    throw new BadRequestError('Customer is no longer active');
  }

  await unit.update({
    isOccupied: true,
    customerId,
    rentedSince: new Date().toISOString().split('T')[0],
  });

  return response.success(res, { unit }, 'Unit rented successfully');
};

/**
 * Release unit from customer
 * POST /api/units/:id/release
 */
const releaseUnit = async (req, res) => {
  const unit = await Unit.findByPk(req.params.id);

  if (!unit) {
    throw new NotFoundError('Unit');
  }

  if (!unit.isOccupied) {
    throw new BadRequestError('Unit is not occupied');
  }

  await unit.update({
    isOccupied: false,
    customerId: null,
    rentedSince: null,
  });

  return response.success(res, { unit }, 'Unit released successfully');
};

/**
 * Get unit statistics
 * GET /api/units/stats
 */
const getStats = async (req, res) => {
  // Total units
  const totalUnits = await Unit.count();

  // Occupied units
  const occupiedUnits = await Unit.count({
    where: { isOccupied: true },
  });

  // Occupancy rate
  const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(2) : 0;

  // Units by size
  const bySize = await Unit.findAll({
    attributes: [
      'size',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total'],
      [
        require('sequelize').fn(
          'SUM',
          require('sequelize').literal("CASE WHEN isOccupied = 1 THEN 1 ELSE 0 END")
        ),
        'occupied',
      ],
    ],
    group: ['size'],
    raw: true,
  });

  // Average price per size
  const avgPriceBySize = await Unit.findAll({
    attributes: [
      'size',
      [require('sequelize').fn('AVG', require('sequelize').col('pricePerMonth')), 'avgPrice'],
    ],
    group: ['size'],
    raw: true,
  });

  // Total potential revenue (all units occupied)
  const totalPotentialRevenue = await Unit.sum('pricePerMonth');

  // Current monthly revenue (only occupied units)
  const currentRevenue = await Unit.sum('pricePerMonth', {
    where: { isOccupied: true },
  });

  return response.success(res, {
    totalUnits,
    occupiedUnits,
    availableUnits: totalUnits - occupiedUnits,
    occupancyRate: parseFloat(occupancyRate),
    bySize: bySize.map((item) => ({
      size: item.size,
      total: parseInt(item.total, 10),
      occupied: parseInt(item.occupied, 10),
      available: parseInt(item.total, 10) - parseInt(item.occupied, 10),
      occupancyRate: ((parseInt(item.occupied, 10) / parseInt(item.total, 10)) * 100).toFixed(2),
    })),
    avgPriceBySize: avgPriceBySize.reduce((acc, item) => {
      acc[item.size] = parseFloat(item.avgPrice).toFixed(2);
      return acc;
    }, {}),
    totalPotentialRevenue: parseFloat(totalPotentialRevenue || 0),
    currentMonthlyRevenue: parseFloat(currentRevenue || 0),
    revenueUtilization: totalPotentialRevenue
      ? ((currentRevenue / totalPotentialRevenue) * 100).toFixed(2)
      : 0,
  });
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  rentUnit,
  releaseUnit,
  getStats,
};
