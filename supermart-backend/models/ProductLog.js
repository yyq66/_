const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductLog = sequelize.define('ProductLog', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    allowNull: false
  },
  productId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  productName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '商品名称快照'
  },
  operationType: {
    type: DataTypes.ENUM('create', 'update', 'delete', 'status_change', 'stock_change'),
    allowNull: false,
    comment: '操作类型'
  },
  operatorId: {
    type: DataTypes.STRING(36),
    allowNull: false
  },
  operatorName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  beforeData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '操作前的数据'
  },
  afterData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '操作后的数据'
  },
  changeFields: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '变更的字段'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '操作原因'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  operationTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'product_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ProductLog;