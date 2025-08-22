const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Banner = sequelize.define('Banner', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Banner title'
  },
  subtitle: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Banner subtitle'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Banner description'
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Banner image path'
  },
  image_alt_text: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Alt text for banner image'
  },
  banner_type: {
    type: DataTypes.ENUM('main_banner', 'footer_banner', 'popup_banner', 'sidebar_banner', 'category_banner', 'product_banner'),
    allowNull: false,
    defaultValue: 'main_banner',
    comment: 'Type of banner placement'
  },
  resource_type: {
    type: DataTypes.ENUM('custom', 'product', 'category', 'store', 'page'),
    allowNull: false,
    defaultValue: 'custom',
    comment: 'Type of resource this banner links to'
  },
  resource_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of the linked resource (product, category, etc.)'
  },
  resource_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Custom URL for banner link'
  },
  button_text: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Text for call-to-action button'
  },
  button_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL for call-to-action button'
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Banner start date'
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Banner end date'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Banner status'
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether banner is featured'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Sort order for display'
  },
  clicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of banner clicks'
  },
  impressions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of banner impressions'
  },
  ctr: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: 'Click-through rate percentage'
  },
  target_audience: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Target audience criteria (age, location, etc.)'
  },
  display_conditions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Conditions for banner display'
  },
  meta_title: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'SEO meta title'
  },
  meta_description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'SEO meta description'
  },
  meta_keywords: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'SEO meta keywords'
  }
}, {
  tableName: 'banners',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['banner_type']
    },
    {
      fields: ['resource_type']
    },
    {
      fields: ['resource_id']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['is_featured']
    },
    {
      fields: ['sort_order']
    },
    {
      fields: ['start_date']
    },
    {
      fields: ['end_date']
    }
  ]
});

module.exports = Banner;
