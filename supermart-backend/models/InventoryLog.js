const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryLog = sequelize.define('InventoryLog', {
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
    type: DataTypes.ENUM('in', 'out', 'adjust'),
    allowNull: false,
    comment: '操作类型：in-入库，out-出库，adjust-调整'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '变动数量（正数为增加，负数为减少）'
  },
  beforeStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '操作前库存'
  },
  afterStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '操作后库存'
  },
  unitCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '单位成本'
  },
  totalCost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: '总成本'
  },
  batchNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '批次号'
  },
  supplier: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '供应商'
  },
  operatorId: {
    type: DataTypes.STRING(36),
    allowNull: false
  },
  operatorName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '操作原因'
  },
  operationTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'inventory_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = InventoryLog;