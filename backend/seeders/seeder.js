const { User, Unit, Customer, Metric, Facility, sequelize } = require('../models');
const { units, customers } = require('./mockData');

/**
 * Seed database with initial data
 */
const seedDatabase = async (options = {}) => {
  const { force = false } = options;

  try {
    console.log('Starting database seeding...');

    // Check if data already exists
    const existingUsers = await User.count();
    const existingUnits = await Unit.count();
    const existingFacilities = await Facility.count();

    if (!force && (existingUsers > 0 || existingUnits > 0 || existingFacilities > 0)) {
      console.log('Database already contains data. Skipping seed.');
      console.log(`  Facilities: ${existingFacilities}`);
      console.log(`  Users: ${existingUsers}`);
      console.log(`  Units: ${existingUnits}`);
      return { seeded: false, message: 'Database already seeded' };
    }

    if (force) {
      console.log('Force seeding - clearing existing data...');
      // Delete in order to respect foreign key constraints
      await Metric.destroy({ where: {} });
      await Unit.destroy({ where: {} });
      await Customer.destroy({ where: {} });
      await User.destroy({ where: {} });
      await Facility.destroy({ where: {} });
    }

    // Create facilities first
    console.log('Creating facilities...');
    const facility1 = await Facility.create({
      name: 'Main Storage Facility',
      address: '123 Storage Street',
      city: 'Berlin',
      state: 'Berlin',
      zipCode: '10115',
      country: 'Germany',
      phone: '+49 30 12345678',
      email: 'main@selfstorage.com',
      totalUnits: 80,
    });

    const facility2 = await Facility.create({
      name: 'Downtown Storage Center',
      address: '456 Warehouse Ave',
      city: 'Berlin',
      state: 'Berlin',
      zipCode: '10117',
      country: 'Germany',
      phone: '+49 30 87654321',
      email: 'downtown@selfstorage.com',
      totalUnits: 45,
    });
    console.log('  Created 2 facilities');

    // Create admin user
    console.log('Creating admin user...');
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@selfstorage.com',
      password: 'admin123',
      role: 'admin',
      isActive: true,
      facilityId: null, // Admins can access all facilities
    });

    // Create manager user
    console.log('Creating manager user...');
    const managerUser = await User.create({
      username: 'manager',
      email: 'manager@selfstorage.com',
      password: 'manager123',
      role: 'manager',
      isActive: true,
      facilityId: facility1.id,
    });

    // Create staff user
    console.log('Creating staff user...');
    const staffUser = await User.create({
      username: 'staff',
      email: 'staff@selfstorage.com',
      password: 'staff123',
      role: 'staff',
      isActive: true,
      facilityId: facility1.id,
    });

    // Create customers first (due to foreign key constraints)
    console.log('Creating customers...');
    const customerPromises = customers.map((customer) =>
      Customer.create({
        id: customer.id,
        name: customer.name,
        type: customer.type,
        email: `${customer.id.toLowerCase()}@example.com`,
        phone: `+49 ${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        startDate: customer.startDate,
        endDate: customer.endDate,
      })
    );
    await Promise.all(customerPromises);
    console.log(`  Created ${customers.length} customers`);

    // Create units (assign to facilities)
    console.log('Creating units...');
    const unitPromises = units.map((unit, index) =>
      Unit.create({
        id: unit.id,
        size: unit.size,
        pricePerMonth: unit.pricePerMonth,
        isOccupied: unit.isOccupied,
        customerId: unit.customerId,
        rentedSince: unit.rentedSince,
        floor: Math.floor(Math.random() * 3) + 1,
        facilityId: index < 80 ? facility1.id : facility2.id, // Split units between facilities
      })
    );
    await Promise.all(unitPromises);
    console.log(`  Created ${units.length} units`);

    // Generate historical metrics for the last 12 months
    console.log('Generating historical metrics...');
    const metrics = generateHistoricalMetrics();
    await Metric.bulkCreate(metrics);
    console.log(`  Created ${metrics.length} monthly metrics`);

    console.log('Database seeding completed successfully!');
    console.log('\nDefault users created:');
    console.log('  Admin: admin@selfstorage.com / admin123');
    console.log('  Manager: manager@selfstorage.com / manager123');
    console.log('  Staff: staff@selfstorage.com / staff123');

    return {
      seeded: true,
      users: 3,
      customers: customers.length,
      units: units.length,
      metrics: metrics.length,
    };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

/**
 * Generate historical metrics for the last 12 months
 */
const generateHistoricalMetrics = () => {
  const metrics = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Simulate gradual growth over time
    const growthFactor = 1 + (11 - i) * 0.02; // 2% growth per month
    const seasonalFactor = 1 + Math.sin((date.getMonth() / 12) * Math.PI * 2) * 0.1;

    const baseOccupancy = 0.75;
    const occupancyRate = Math.min(95, (baseOccupancy * growthFactor * seasonalFactor * 100));
    const totalUnits = 125;
    const occupiedUnits = Math.round((occupancyRate / 100) * totalUnits);

    // Calculate revenue based on unit distribution and prices
    const avgPricePerUnit = 120; // Average price
    const totalRevenue = occupiedUnits * avgPricePerUnit;

    // Customer metrics
    const newCustomers = Math.floor(3 + Math.random() * 7);
    const churnedCustomers = Math.floor(1 + Math.random() * 4);

    metrics.push({
      month,
      totalRevenue,
      occupancyRate: occupancyRate.toFixed(2),
      totalUnits,
      occupiedUnits,
      newCustomers,
      churnedCustomers,
      averageRentalDuration: (8 + Math.random() * 4).toFixed(2),
      revenueBySize: {
        '5m²': Math.round(totalRevenue * 0.15),
        '10m²': Math.round(totalRevenue * 0.28),
        '15m²': Math.round(totalRevenue * 0.25),
        '20m²': Math.round(totalRevenue * 0.18),
        '30m²': Math.round(totalRevenue * 0.14),
      },
      occupancyBySize: {
        '5m²': { total: 40, occupied: Math.round(40 * (occupancyRate / 100) * 1.1), rate: (occupancyRate * 1.1).toFixed(2) },
        '10m²': { total: 35, occupied: Math.round(35 * (occupancyRate / 100) * 1.05), rate: (occupancyRate * 1.05).toFixed(2) },
        '15m²': { total: 25, occupied: Math.round(25 * (occupancyRate / 100)), rate: occupancyRate.toFixed(2) },
        '20m²': { total: 15, occupied: Math.round(15 * (occupancyRate / 100) * 0.95), rate: (occupancyRate * 0.95).toFixed(2) },
        '30m²': { total: 10, occupied: Math.round(10 * (occupancyRate / 100) * 0.85), rate: (occupancyRate * 0.85).toFixed(2) },
      },
    });
  }

  return metrics;
};

/**
 * Clear all data from database
 */
const clearDatabase = async () => {
  try {
    console.log('Clearing database...');
    await Metric.destroy({ where: {} });
    await Unit.destroy({ where: {} });
    await Customer.destroy({ where: {} });
    await User.destroy({ where: {} });
    console.log('Database cleared successfully!');
    return true;
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};

module.exports = {
  seedDatabase,
  clearDatabase,
  generateHistoricalMetrics,
};
