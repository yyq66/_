const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  minStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    field: 'minStock'
  },
  supplier: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'out_of_stock'),
    allowNull: false,
    defaultValue: 'active',
    comment: '商品状态：active-上架，inactive-下架，out_of_stock-缺货'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sales: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'createTime'
  },
  updateTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'updateTime'
  }
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    // 在保存前自动更新状态
    beforeSave: async (product, options) => {
      // 如果库存为0，自动设置为缺货状态
      if (product.stock === 0 && product.status !== 'inactive') {
        product.status = 'out_of_stock';
      }
      // 如果库存大于0且当前是缺货状态，自动设置为上架状态
      else if (product.stock > 0 && product.status === 'out_of_stock') {
        product.status = 'active';
      }
    }
  }
});

module.exports = Product;