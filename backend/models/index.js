const { sequelize } = require('../config/database');

// Import model definitions
const UserModel = require('./User');
const UnitModel = require('./Unit');
const CustomerModel = require('./Customer');
const MetricModel = require('./Metric');
const FacilityModel = require('./Facility');

// Initialize models
const User = UserModel(sequelize);
const Unit = UnitModel(sequelize);
const Customer = CustomerModel(sequelize);
const Metric = MetricModel(sequelize);
const Facility = FacilityModel(sequelize);

// Create models object
const models = {
  User,
  Unit,
  Customer,
  Metric,
  Facility,
};

// Set up associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Database sync function
const syncDatabase = async (options = {}) => {
  const defaultOptions = {
    alter: process.env.NODE_ENV === 'development',
    force: false,
  };

  const syncOptions = { ...defaultOptions, ...options };

  try {
    await sequelize.sync(syncOptions);
    console.log('Database synced successfully');
    return true;
  } catch (error) {
    console.error('Database sync error:', error);
    throw error;
  }
};

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  ...models,
  syncDatabase,
  testConnection,
};
