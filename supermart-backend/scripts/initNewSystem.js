const { sequelize, Product, ProductLog, InventoryLog } = require('../models');
const { v4: uuidv4 } = require('uuid');

async function initNewSystem() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 创建新表
    console.log('开始创建新表结构...');
    await sequelize.sync({ force: false, alter: true });
    console.log('表结构创建/更新完成');

    // 检查是否已有数据
    const existingProducts = await Product.count();
    if (existingProducts > 0) {
      console.log('检测到已有商品数据，跳过初始化数据插入');
      return;
    }

    console.log('开始插入初始化数据...');

    // 插入示例商品数据
    const sampleProducts = [
      {
        id: uuidv4(),
        name: 'iPhone 15 Pro',
        sku: 'IP15P001',
        category: '手机数码',
        brand: 'Apple',
        price: 8999.00,
        stock: 50,
        minStock: 10,
        supplier: '苹果官方',
        status: 'active',
        description: '最新款iPhone 15 Pro，搭载A17 Pro芯片',
        sales: 25,
        createTime: new Date(),
        updateTime: new Date()
      },
      {
        id: uuidv4(),
        name: 'MacBook Air M2',
        sku: 'MBA001',
        category: '电脑办公',
        brand: 'Apple',
        price: 9499.00,
        stock: 30,
        minStock: 5,
        supplier: '苹果官方',
        status: 'active',
        description: 'MacBook Air M2芯片版本',
        sales: 15,
        createTime: new Date(),
        updateTime: new Date()
      },
      {
        id: uuidv4(),
        name: '小米13 Ultra',
        sku: 'MI13U001',
        category: '手机数码',
        brand: '小米',
        price: 5999.00,
        stock: 0,
        minStock: 10,
        supplier: '小米科技',
        status: 'out_of_stock',
        description: '小米13 Ultra 徕卡影像旗舰',
        sales: 8,
        createTime: new Date(),
        updateTime: new Date()
      },
      {
        id: uuidv4(),
        name: 'AirPods Pro 2',
        sku: 'APP2001',
        category: '数码配件',
        brand: 'Apple',
        price: 1899.00,
        stock: 5,
        minStock: 15,
        supplier: '苹果官方',
        status: 'active',
        description: 'AirPods Pro 第二代，主动降噪',
        sales: 42,
        createTime: new Date(),
        updateTime: new Date()
      },
      {
        id: uuidv4(),
        name: '华为MateBook X Pro',
        sku: 'HWMBX001',
        category: '电脑办公',
        brand: '华为',
        price: 8999.00,
        stock: 20,
        minStock: 8,
        supplier: '华为技术',
        status: 'inactive',
        description: '华为MateBook X Pro 轻薄本',
        sales: 12,
        createTime: new Date(),
        updateTime: new Date()
      },
      {
        id: uuidv4(),
        name: 'iPad Air 5',
        sku: 'IPA5001',
        category: '平板电脑',
        brand: 'Apple',
        price: 4399.00,
        stock: 35,
        minStock: 12,
        supplier: '苹果官方',
        status: 'active',
        description: 'iPad Air 第五代，M1芯片',
        sales: 28,
        createTime: new Date(),
        updateTime: new Date()
      }
    ];

    await Product.bulkCreate(sampleProducts);
    console.log('商品数据插入完成');

    // 插入示例商品操作日志
    const sampleProductLogs = [];
    const operatorId = uuidv4();
    const operatorName = '系统管理员';

    sampleProducts.forEach(product => {
      sampleProductLogs.push({
        id: uuidv4(),
        productId: product.id,
        productName: product.name,
        operationType: 'create',
        operatorId,
        operatorName,
        beforeData: null,
        afterData: product,
        changeFields: null,
        reason: '系统初始化创建商品',
        operationTime: new Date()
      });
    });

    await ProductLog.bulkCreate(sampleProductLogs);
    console.log('商品日志数据插入完成');

    // 插入示例库存操作日志
    const sampleInventoryLogs = [
      {
        id: uuidv4(),
        productId: sampleProducts[0].id,
        productName: sampleProducts[0].name,
        operationType: 'in',
        quantity: 50,
        beforeStock: 0,
        afterStock: 50,
        unitCost: 7500.00,
        totalCost: 375000.00,
        batchNumber: 'BATCH001',
        supplier: '苹果官方',
        operatorId,
        operatorName,
        reason: '初始入库',
        operationTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7天前
      },
      {
        id: uuidv4(),
        productId: sampleProducts[1].id,
        productName: sampleProducts[1].name,
        operationType: 'in',
        quantity: 30,
        beforeStock: 0,
        afterStock: 30,
        unitCost: 8000.00,
        totalCost: 240000.00,
        batchNumber: 'BATCH002',
        supplier: '苹果官方',
        operatorId,
        operatorName,
        reason: '初始入库',
        operationTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6天前
      },
      {
        id: uuidv4(),
        productId: sampleProducts[3].id,
        productName: sampleProducts[3].name,
        operationType: 'out',
        quantity: -10,
        beforeStock: 15,
        afterStock: 5,
        operatorId,
        operatorName,
        reason: '销售出库',
        operationTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2天前
      }
    ];

    await InventoryLog.bulkCreate(sampleInventoryLogs);
    console.log('库存日志数据插入完成');

    console.log('\n=== 初始化完成 ===');
    console.log('已创建商品数量:', sampleProducts.length);
    console.log('已创建商品日志数量:', sampleProductLogs.length);
    console.log('已创建库存日志数量:', sampleInventoryLogs.length);
    
  } catch (error) {
    console.error('初始化失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initNewSystem();
}

module.exports = initNewSystem;