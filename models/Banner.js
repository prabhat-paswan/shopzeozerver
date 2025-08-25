const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Banner = sequelize.define('Banner', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Banner title'
  },
  type: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Type of banner (store_wise, item_wise, category_wise, common)'
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Banner image filename'
  },
  status: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
    comment: 'Banner status (1=active, 0=inactive)'
  },
  data: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Banner data (store_id, category_id, item_id, or null for common)'
  },
  featured: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 0,
    comment: 'Whether banner is featured (1=featured, 0=not featured)'
  },
  default_link: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Default link for banner'
  },
  zone_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 1,
    comment: 'Zone ID for banner placement (1=homepage, 2=category page, etc.)'
  },
  created_by: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'admin',
    comment: 'User who created the banner'
  }
}, {
  tableName: 'banners',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Banner;
