const { Sequelize } = require('sequelize');
const path = require('path');

const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: console.log,
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};

const currentConfig = config[env];

let sequelize;

if (currentConfig.url) {
  sequelize = new Sequelize(currentConfig.url, {
    dialect: currentConfig.dialect,
    logging: currentConfig.logging,
    pool: currentConfig.pool,
    dialectOptions: currentConfig.dialectOptions,
  });
} else {
  sequelize = new Sequelize({
    dialect: currentConfig.dialect,
    storage: currentConfig.storage,
    logging: currentConfig.logging,
  });
}

module.exports = { sequelize, config: currentConfig };
