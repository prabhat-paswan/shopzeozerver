const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductMedia = sequelize.define('ProductMedia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  mediaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'media',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('image', 'video', 'document'),
    allowNull: false,
    defaultValue: 'image'
  },
  isPrimary: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'True if this is the primary media for the product'
  },
  isGallery: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'True if this media should appear in the product gallery'
  },
  alt: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Alt text for accessibility'
  },
  caption: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'product_media',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['productId', 'mediaId']
    },
    {
      fields: ['productId']
    },
    {
      fields: ['mediaId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['isPrimary']
    },
    {
      fields: ['isGallery']
    },
    {
      fields: ['sortOrder']
    }
  ]
});

module.exports = ProductMedia;
