const sequelize = require('../config/database');
const Auth = require('./Auth');
const User = require('./User');
const Product = require('./Product');
const ProductLog = require('./ProductLog');
const InventoryLog = require('./InventoryLog');
const PasswordChangeRequest = require('./PasswordChangeRequest');
const Order = require('./Order');

// 关联关系
Auth.belongsTo(User, { 
  foreignKey: 'user_id', 
  as: 'user',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
User.hasOne(Auth, { 
  foreignKey: 'user_id', 
  as: 'auth',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

User.hasMany(PasswordChangeRequest, { 
  foreignKey: 'user_id', 
  as: 'passwordChangeRequests',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
PasswordChangeRequest.belongsTo(User, { 
  foreignKey: 'user_id', 
  as: 'user',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// 商品和商品日志关联
Product.hasMany(ProductLog, {
  foreignKey: 'productId',
  as: 'logs'
});
ProductLog.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});

// 商品和库存日志关联
Product.hasMany(InventoryLog, {
  foreignKey: 'productId',
  as: 'inventoryLogs'
});
InventoryLog.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});

module.exports = {
  sequelize,
  Auth,
  User,
  Product,
  ProductLog,
  InventoryLog,
  Order,
  PasswordChangeRequest
};