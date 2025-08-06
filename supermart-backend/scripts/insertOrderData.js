const { v4: uuidv4 } = require('uuid');
const Order = require('../models/Order');
const sequelize = require('../config/database');

// 生成订单编号的函数
function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD${timestamp}${random}`;
}

// 测试订单数据
const testOrders = [
  {
    id: uuidv4(),
    name: 'iPhone 15 Pro Max',
    category: '电子产品',
    type: 'online',
    quantity: 1,
    unitPrice: 9999.00,
    totalAmount: 9999.00,
    orderNumber: generateOrderNumber(),
    customerId: null, // 设为 null
    customerName: '张三',
    customerPhone: '13800138001',
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: 'alipay',
    discount: 0.00,
    shippingAddress: '北京市朝阳区建国路1号',
    notes: '请在工作日送货',
    orderDate: new Date('2024-01-15 10:30:00'),
    deliveryDate: new Date('2024-01-17 14:00:00')
  },
  {
    id: uuidv4(),
    name: '耐克运动鞋',
    category: '服装',
    type: 'offline',
    quantity: 2,
    unitPrice: 599.00,
    totalAmount: 1198.00,
    orderNumber: generateOrderNumber(),
    customerId: null,
    customerName: '李四',
    customerPhone: '13900139002',
    status: 'shipped',
    paymentStatus: 'paid',
    paymentMethod: 'wechat',
    discount: 100.00,
    shippingAddress: '上海市浦东新区陆家嘴金融中心',
    notes: '尺码42，黑色',
    orderDate: new Date('2024-01-16 14:20:00'),
    deliveryDate: new Date('2024-01-18 16:00:00')
  },
  {
    id: uuidv4(),
    name: '有机蔬菜礼盒',
    category: '食品',
    type: 'online',
    quantity: 3,
    unitPrice: 128.00,
    totalAmount: 384.00,
    orderNumber: generateOrderNumber(),
    customerId: null,
    customerName: '王五',
    customerPhone: '13700137003',
    status: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    discount: 20.00,
    shippingAddress: '广州市天河区珠江新城',
    notes: '新鲜蔬菜，请冷藏保存',
    orderDate: new Date('2024-01-14 09:15:00'),
    deliveryDate: new Date('2024-01-15 11:30:00'),
    completedDate: new Date('2024-01-15 15:45:00')
  },
  {
    id: uuidv4(),
    name: '洗护用品套装',
    category: '日用品',
    type: 'online',
    quantity: 1,
    unitPrice: 89.90,
    totalAmount: 89.90,
    orderNumber: generateOrderNumber(),
    customerId: null,
    customerName: '赵六',
    customerPhone: '13600136004',
    status: 'pending',
    paymentStatus: 'unpaid',
    paymentMethod: null,
    discount: 0.00,
    shippingAddress: '深圳市南山区科技园',
    notes: '包含洗发水、沐浴露、护发素',
    orderDate: new Date('2024-01-17 16:45:00'),
    deliveryDate: new Date('2024-01-19 10:00:00')
  },
  {
    id: uuidv4(),
    name: '笔记本电脑',
    category: '电子产品',
    type: 'offline',
    quantity: 1,
    unitPrice: 5999.00,
    totalAmount: 5699.00,
    orderNumber: generateOrderNumber(),
    customerId: null,
    customerName: '孙七',
    customerPhone: '13500135005',
    status: 'cancelled',
    paymentStatus: 'refunded',
    paymentMethod: 'alipay',
    discount: 300.00,
    shippingAddress: '杭州市西湖区文三路',
    notes: '客户要求退款，已处理',
    orderDate: new Date('2024-01-13 11:20:00'),
    deliveryDate: null,
    completedDate: new Date('2024-01-14 09:30:00')
  }
];

// 插入数据的函数
async function insertTestOrders() {
  try {
    // 确保数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 插入测试数据
    const createdOrders = await Order.bulkCreate(testOrders, {
      validate: true,
      returning: true
    });

    console.log(`成功插入 ${createdOrders.length} 条订单数据:`);
    createdOrders.forEach((order, index) => {
      console.log(`${index + 1}. 订单号: ${order.orderNumber}, 商品: ${order.name}, 金额: ¥${order.totalAmount}`);
    });

  } catch (error) {
    console.error('插入数据失败:', error.message);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`- ${err.path}: ${err.message}`);
      });
    }
  } finally {
    // 关闭数据库连接
    await sequelize.close();
  }
}

// 执行插入
if (require.main === module) {
  insertTestOrders();
}

module.exports = { insertTestOrders, testOrders };