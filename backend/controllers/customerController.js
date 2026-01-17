const { Op } = require('sequelize');
const { Customer, Unit } = require('../models');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const response = require('../utils/response');
const config = require('../config');

/**
 * Get all customers with pagination and filtering
 * GET /api/customers
 */
const getAll = async (req, res) => {
  const {
    page = 1,
    limit = config.pagination.defaultLimit,
    type,
    active,
    search,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(
    parseInt(limit, 10) || config.pagination.defaultLimit,
    config.pagination.maxLimit
  );
  const offset = (pageNum - 1) * limitNum;

  // Build where clause
  const where = {};

  if (type) {
    where.type = type;
  }

  if (active === 'true') {
    where.endDate = { [Op.or]: [null, { [Op.gte]: new Date() }] };
  } else if (active === 'false') {
    where.endDate = { [Op.lt]: new Date() };
  }

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { companyName: { [Op.like]: `%${search}%` } },
    ];
  }

  // Validate sort field
  const allowedSortFields = ['name', 'type', 'startDate', 'endDate', 'createdAt'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { count, rows: customers } = await Customer.findAndCountAll({
    where,
    include: [
      {
        model: Unit,
        as: 'units',
        attributes: ['id', 'size', 'pricePerMonth'],
      },
    ],
    limit: limitNum,
    offset,
    order: [[sortField, order]],
  });

  return response.paginated(res, customers, {
    page: pageNum,
    limit: limitNum,
    total: count,
  });
};

/**
 * Get customer by ID
 * GET /api/customers/:id
 */
const getById = async (req, res) => {
  const customer = await Customer.findByPk(req.params.id, {
    include: [
      {
        model: Unit,
        as: 'units',
        attributes: ['id', 'size', 'pricePerMonth', 'isOccupied', 'rentedSince'],
      },
    ],
  });

  if (!customer) {
    throw new NotFoundError('Customer');
  }

  return response.success(res, { customer });
};

/**
 * Create new customer
 * POST /api/customers
 */
const create = async (req, res) => {
  const { name, email, phone, type, companyName, address, startDate, notes } = req.body;

  // Generate customer ID
  const lastCustomer = await Customer.findOne({
    order: [['id', 'DESC']],
  });

  let nextIdNum = 1;
  if (lastCustomer) {
    const lastIdNum = parseInt(lastCustomer.id.replace('C', ''), 10);
    nextIdNum = lastIdNum + 1;
  }
  const customerId = `C${String(nextIdNum).padStart(3, '0')}`;

  const customer = await Customer.create({
    id: customerId,
    name,
    email,
    phone,
    type,
    companyName: type === 'business' ? companyName : null,
    address,
    startDate: startDate || new Date().toISOString().split('T')[0],
    notes,
  });

  return response.created(res, { customer }, 'Customer created successfully');
};

/**
 * Update customer
 * PUT /api/customers/:id
 */
const update = async (req, res) => {
  const customer = await Customer.findByPk(req.params.id);

  if (!customer) {
    throw new NotFoundError('Customer');
  }

  const { name, email, phone, type, companyName, address, startDate, endDate, notes } = req.body;

  await customer.update({
    name,
    email,
    phone,
    type,
    companyName: type === 'business' ? companyName : null,
    address,
    startDate,
    endDate,
    notes,
  });

  return response.success(res, { customer }, 'Customer updated successfully');
};

/**
 * Delete customer
 * DELETE /api/customers/:id
 */
const remove = async (req, res) => {
  const customer = await Customer.findByPk(req.params.id, {
    include: [{ model: Unit, as: 'units' }],
  });

  if (!customer) {
    throw new NotFoundError('Customer');
  }

  // Check if customer has active units
  if (customer.units && customer.units.length > 0) {
    throw new BadRequestError(
      'Cannot delete customer with active unit rentals. Release units first.'
    );
  }

  await customer.destroy();

  return response.success(res, null, 'Customer deleted successfully');
};

/**
 * Get customer statistics
 * GET /api/customers/stats
 */
const getStats = async (req, res) => {
  const now = new Date();

  // Total customers
  const totalCustomers = await Customer.count();

  // Active customers (no end date or end date in future)
  const activeCustomers = await Customer.count({
    where: {
      endDate: { [Op.or]: [null, { [Op.gte]: now }] },
    },
  });

  // Customers by type
  const byType = await Customer.findAll({
    attributes: [
      'type',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
    ],
    group: ['type'],
    raw: true,
  });

  // New customers this month
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonth = await Customer.count({
    where: {
      startDate: { [Op.gte]: firstOfMonth },
    },
  });

  // Churned this month
  const churnedThisMonth = await Customer.count({
    where: {
      endDate: {
        [Op.gte]: firstOfMonth,
        [Op.lte]: now,
      },
    },
  });

  return response.success(res, {
    totalCustomers,
    activeCustomers,
    inactiveCustomers: totalCustomers - activeCustomers,
    byType: byType.reduce((acc, item) => {
      acc[item.type] = parseInt(item.count, 10);
      return acc;
    }, {}),
    newThisMonth,
    churnedThisMonth,
    churnRate: activeCustomers > 0 ? ((churnedThisMonth / activeCustomers) * 100).toFixed(2) : 0,
  });
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getStats,
};
