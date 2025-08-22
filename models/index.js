const { sequelize } = require('../config/database');

// Import essential models
const User = require('./User');
const Category = require('./Category');
const SubCategory = require('./SubCategory');
const Store = require('./Store');
const Product = require('./Product');

// Basic associations
Category.hasMany(SubCategory, { as: 'subCategories', foreignKey: 'category_id' });
SubCategory.belongsTo(Category, { as: 'category', foreignKey: 'category_id' });

// Store associations
User.hasMany(Store, { as: 'stores', foreignKey: 'owner_id' });
Store.belongsTo(User, { as: 'owner', foreignKey: 'owner_id' });

// Product associations
Store.hasMany(Product, { as: 'products', foreignKey: 'store_id' });
Product.belongsTo(Store, { as: 'store', foreignKey: 'store_id' });

Category.hasMany(Product, { as: 'products', foreignKey: 'category_id' });
Product.belongsTo(Category, { as: 'category', foreignKey: 'category_id' });

SubCategory.hasMany(Product, { as: 'products', foreignKey: 'sub_category_id' });
Product.belongsTo(SubCategory, { as: 'subCategory', foreignKey: 'sub_category_id' });

// Export models
module.exports = {
  sequelize,
  User,
  Category,
  SubCategory,
  Store,
  Product
};
