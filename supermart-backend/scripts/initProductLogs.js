const { sequelize, ProductLog, Product } = require('../models');
const { v4: uuidv4 } = require('uuid');

async function initProductLogs() {
  try {
    // 同步模型到数据库（创建表）
    await ProductLog.sync({ force: false });
    console.log('商品日志表同步成功');

    // 检查是否已有数据
    const existingCount = await ProductLog.count();
    if (existingCount > 0) {
      console.log(`商品日志表已有 ${existingCount} 条记录，跳过初始化`);
      return;
    }

    // 获取数据库中已存在的商品
    const existingProducts = await Product.findAll({
      limit: 3,
      order: [['createTime', 'ASC']]
    });

    if (existingProducts.length === 0) {
      console.log('数据库中没有商品数据，请先运行 insertProductData.js');
      return;
    }

    console.log(`找到 ${existingProducts.length} 个商品，开始创建日志记录...`);

    // 使用真实商品数据创建示例日志
    const sampleLogs = [];
    
    // 为第一个商品创建创建日志
    if (existingProducts[0]) {
      const product1 = existingProducts[0];
      sampleLogs.push({
        id: uuidv4(),
        productId: product1.id,
        productName: product1.name,
        operationType: 'create',
        operatorId: 'user-001',
        operatorName: '管理员',
        beforeData: null,
        afterData: {
          name: product1.name,
          price: product1.price,
          stock: product1.stock,
          status: product1.status
        },
        changeFields: ['name', 'price', 'stock', 'status'],
        reason: '新商品上架',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });

      // 为第一个商品创建价格更新日志
      sampleLogs.push({
        id: uuidv4(),
        productId: product1.id,
        productName: product1.name,
        operationType: 'update',
        operatorId: 'user-002',
        operatorName: '商品经理',
        beforeData: {
          price: product1.price
        },
        afterData: {
          price: product1.price * 0.9 // 打9折
        },
        changeFields: ['price'],
        reason: '促销活动价格调整',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
    }

    // 为第二个商品创建库存变更日志
    if (existingProducts[1]) {
      const product2 = existingProducts[1];
      sampleLogs.push({
        id: uuidv4(),
        productId: product2.id,
        productName: product2.name,
        operationType: 'stock_change',
        operatorId: 'user-003',
        operatorName: '仓库管理员',
        beforeData: {
          stock: product2.stock
        },
        afterData: {
          stock: product2.stock + 30
        },
        changeFields: ['stock'],
        reason: '库存补充',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
    }

    // 批量插入
    await ProductLog.bulkCreate(sampleLogs);
    console.log(`成功插入 ${sampleLogs.length} 条商品日志记录`);

    // 查询验证
    const logs = await ProductLog.findAll({
      order: [['operationTime', 'DESC']]
    });
    
    console.log('商品日志记录：');
    logs.forEach(log => {
      console.log(`- ${log.productName} | ${log.operationType} | ${log.operatorName} | ${log.operationTime}`);
    });
    
  } catch (error) {
    console.error('初始化商品日志失败:', error);
  } finally {
    await sequelize.close();
  }
}

initProductLogs();