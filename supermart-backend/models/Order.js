const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    allowNull: false
  },
  // 必填字段
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '订单名称/商品名称'
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '商品分类：如电子产品、服装、食品、日用品等'
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '订单类型：online-线上订单, offline-线下订单'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '商品数量'
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'unit_price',
    comment: '单价'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_amount',
    comment: '总金额'
  },
  
  // 额外字段
  orderNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'order_number',
    comment: '订单编号'
  },
  customerId: {
    type: DataTypes.STRING(36),
    allowNull: true,
    field: 'customer_id',
    comment: '客户ID'
  },
  customerName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'customer_name',
    comment: '客户姓名'
  },
  customerPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'customer_phone',
    comment: '客户电话'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    comment: '订单状态：pending-待处理, confirmed-已确认, shipped-已发货, delivered-已送达, cancelled-已取消'
  },
  paymentStatus: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'unpaid',
    field: 'payment_status',
    comment: '支付状态：unpaid-未支付, paid-已支付, refunded-已退款'
  },
  paymentMethod: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'payment_method',
    comment: '支付方式：cash-现金, card-刷卡, alipay-支付宝, wechat-微信'
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
    comment: '折扣金额'
  },
  shippingAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'shipping_address',
    comment: '收货地址'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '订单备注'
  },
  orderDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'order_date',
    comment: '下单时间'
  },
  deliveryDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'delivery_date',
    comment: '预计送达时间'
  },
  completedDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_date',
    comment: '完成时间'
  }
}, {
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '订单表'
});

// 添加钩子函数，自动计算总金额
Order.addHook('beforeSave', (order, options) => {
  // 如果单价和数量都存在，自动计算总金额
  if (order.unitPrice && order.quantity) {
    const subtotal = parseFloat(order.unitPrice) * parseInt(order.quantity);
    const discount = parseFloat(order.discount) || 0;
    order.totalAmount = subtotal - discount;
  }
});

module.exports = Order;