const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Store = sequelize.define('Store', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  logo: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Store logo image path'
  },
  banner: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Store banner image path'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  gst_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'GST registration number'
  },
  gst_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Default GST percentage for store'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Store verification status'
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    comment: 'Store rating (0-5)'
  },
  total_products: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_orders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_revenue: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  commission_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 15,
    comment: 'Platform commission percentage'
  },
  owner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  meta_title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  meta_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  meta_keywords: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'stores',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['slug'] },
    { fields: ['owner_id'] },
    { fields: ['is_active'] },
    { fields: ['is_verified'] },
    { fields: ['rating'] }
  ]
});

module.exports = Store;
