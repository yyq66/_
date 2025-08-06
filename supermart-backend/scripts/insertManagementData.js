const { sequelize, Product, ProductManagement, InventoryManagement } = require('../models');
const { v4: uuidv4 } = require('uuid');

async function insertManagementData() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 获取现有商品数据
    const products = await Product.findAll({ limit: 5 });
    if (products.length === 0) {
      console.log('请先确保products表中有数据');
      return;
    }

    console.log('开始插入商品管理日志数据...');

    // 插入商品管理日志数据
    const productManagementData = [
      {
        id: uuidv4(),
        productId: products[0].id,
        operationType: 'create',
        operatorId: 'admin-001',
        operatorName: '管理员',
        beforeData: null,
        afterData: {
          name: products[0].name,
          sku: products[0].sku,
          price: products[0].price,
          stock: products[0].stock,
          status: 'active'
        },
        changeFields: ['name', 'sku', 'price', 'stock', 'status'],
        reason: '新商品创建',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        operationTime: new Date('2024-01-15 09:30:00')
      },
      {
        id: uuidv4(),
        productId: products[0].id,
        operationType: 'price_change',
        operatorId: 'admin-001',
        operatorName: '管理员',
        beforeData: {
          price: products[0].price
        },
        afterData: {
          price: (parseFloat(products[0].price) + 5).toFixed(2)
        },
        changeFields: ['price'],
        reason: '市场价格调整',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        operationTime: new Date('2024-01-16 14:20:00')
      },
      {
        id: uuidv4(),
        productId: products[1].id,
        operationType: 'update',
        operatorId: 'user-002',
        operatorName: '商品专员',
        beforeData: {
          description: products[1].description,
          category: products[1].category
        },
        afterData: {
          description: '更新后的商品描述信息',
          category: products[1].category
        },
        changeFields: ['description'],
        reason: '完善商品信息',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        operationTime: new Date('2024-01-17 10:15:00')
      },
      {
        id: uuidv4(),
        productId: products[1].id,
        operationType: 'status_change',
        operatorId: 'admin-001',
        operatorName: '管理员',
        beforeData: {
          status: 'active'
        },
        afterData: {
          status: 'inactive'
        },
        changeFields: ['status'],
        reason: '临时下架维护',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        operationTime: new Date('2024-01-18 16:45:00')
      },
      {
        id: uuidv4(),
        productId: products[2].id,
        operationType: 'update',
        operatorId: 'user-003',
        operatorName: '库存管理员',
        beforeData: {
          minStock: products[2].minStock,
          supplier: products[2].supplier
        },
        afterData: {
          minStock: (products[2].minStock || 10) + 5,
          supplier: '新供应商有限公司'
        },
        changeFields: ['minStock', 'supplier'],
        reason: '供应商变更，调整安全库存',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        operationTime: new Date('2024-01-19 11:30:00')
      }
    ];

    await ProductManagement.bulkCreate(productManagementData);
    console.log('✓ 商品管理日志数据插入成功');

    console.log('开始插入库存管理记录数据...');

    // 插入库存管理记录数据
    const inventoryManagementData = [
      {
        id: uuidv4(),
        productId: products[0].id,
        operationType: 'in',
        quantity: 100,
        beforeStock: products[0].stock,
        afterStock: products[0].stock + 100,
        unitCost: 45.50,
        totalCost: 4550.00,
        warehouseId: 'WH-001',
        warehouseName: '主仓库',
        supplierId: 'SUP-001',
        supplierName: '优质供应商有限公司',
        batchNumber: 'BATCH-20240115-001',
        expiryDate: new Date('2025-01-15'),
        operatorId: 'user-003',
        operatorName: '库存管理员',
        reason: '新货到库',
        relatedOrderId: null,
        status: 'completed',
        operationTime: new Date('2024-01-15 08:30:00')
      },
      {
        id: uuidv4(),
        productId: products[0].id,
        operationType: 'out',
        quantity: -25,
        beforeStock: products[0].stock + 100,
        afterStock: products[0].stock + 75,
        unitCost: null,
        totalCost: null,
        warehouseId: 'WH-001',
        warehouseName: '主仓库',
        supplierId: null,
        supplierName: null,
        batchNumber: 'BATCH-20240115-001',
        expiryDate: null,
        operatorId: 'user-004',
        operatorName: '销售专员',
        reason: '订单发货',
        relatedOrderId: 'ORDER-20240115-001',
        status: 'completed',
        operationTime: new Date('2024-01-15 14:20:00')
      },
      {
        id: uuidv4(),
        productId: products[1].id,
        operationType: 'adjust',
        quantity: -5,
        beforeStock: products[1].stock,
        afterStock: products[1].stock - 5,
        unitCost: null,
        totalCost: null,
        warehouseId: 'WH-001',
        warehouseName: '主仓库',
        supplierId: null,
        supplierName: null,
        batchNumber: null,
        expiryDate: null,
        operatorId: 'user-003',
        operatorName: '库存管理员',
        reason: '盘点发现损耗',
        relatedOrderId: null,
        status: 'completed',
        operationTime: new Date('2024-01-16 09:15:00')
      },
      {
        id: uuidv4(),
        productId: products[1].id,
        operationType: 'transfer',
        quantity: 20,
        beforeStock: products[1].stock - 5,
        afterStock: products[1].stock + 15,
        unitCost: null,
        totalCost: null,
        warehouseId: 'WH-002',
        warehouseName: '分仓库',
        supplierId: null,
        supplierName: null,
        batchNumber: null,
        expiryDate: null,
        operatorId: 'user-003',
        operatorName: '库存管理员',
        reason: '仓库间调拨',
        relatedOrderId: null,
        status: 'completed',
        operationTime: new Date('2024-01-17 13:45:00')
      },
      {
        id: uuidv4(),
        productId: products[2].id,
        operationType: 'in',
        quantity: 50,
        beforeStock: products[2].stock,
        afterStock: products[2].stock + 50,
        unitCost: 28.80,
        totalCost: 1440.00,
        warehouseId: 'WH-001',
        warehouseName: '主仓库',
        supplierId: 'SUP-002',
        supplierName: '新供应商有限公司',
        batchNumber: 'BATCH-20240118-002',
        expiryDate: new Date('2024-12-31'),
        operatorId: 'user-003',
        operatorName: '库存管理员',
        reason: '补充库存',
        relatedOrderId: null,
        status: 'completed',
        operationTime: new Date('2024-01-18 10:30:00')
      },
      {
        id: uuidv4(),
        productId: products[2].id,
        operationType: 'check',
        quantity: 0,
        beforeStock: products[2].stock + 50,
        afterStock: products[2].stock + 50,
        unitCost: null,
        totalCost: null,
        warehouseId: 'WH-001',
        warehouseName: '主仓库',
        supplierId: null,
        supplierName: null,
        batchNumber: null,
        expiryDate: null,
        operatorId: 'user-003',
        operatorName: '库存管理员',
        reason: '定期盘点',
        relatedOrderId: null,
        status: 'completed',
        operationTime: new Date('2024-01-19 16:00:00')
      },
      {
        id: uuidv4(),
        productId: products[3].id,
        operationType: 'out',
        quantity: -15,
        beforeStock: products[3].stock,
        afterStock: products[3].stock - 15,
        unitCost: null,
        totalCost: null,
        warehouseId: 'WH-001',
        warehouseName: '主仓库',
        supplierId: null,
        supplierName: null,
        batchNumber: null,
        expiryDate: null,
        operatorId: 'user-004',
        operatorName: '销售专员',
        reason: '大客户订单',
        relatedOrderId: 'ORDER-20240120-002',
        status: 'completed',
        operationTime: new Date('2024-01-20 11:15:00')
      },
      {
        id: uuidv4(),
        productId: products[4].id,
        operationType: 'adjust',
        quantity: 3,
        beforeStock: products[4].stock,
        afterStock: products[4].stock + 3,
        unitCost: null,
        totalCost: null,
        warehouseId: 'WH-001',
        warehouseName: '主仓库',
        supplierId: null,
        supplierName: null,
        batchNumber: null,
        expiryDate: null,
        operatorId: 'user-003',
        operatorName: '库存管理员',
        reason: '盘点发现多余库存',
        relatedOrderId: null,
        status: 'completed',
        operationTime: new Date('2024-01-21 09:30:00')
      }
    ];

    await InventoryManagement.bulkCreate(inventoryManagementData);
    console.log('✓ 库存管理记录数据插入成功');

    console.log('\n=== 数据插入完成 ===');
    console.log(`商品管理日志: ${productManagementData.length} 条`);
    console.log(`库存管理记录: ${inventoryManagementData.length} 条`);
    
    // 显示插入的数据统计
    const pmStats = await ProductManagement.findAll({
      attributes: [
        'operationType',
        [sequelize.fn('COUNT', sequelize.col('operationType')), 'count']
      ],
      group: ['operationType']
    });
    
    const imStats = await InventoryManagement.findAll({
      attributes: [
        'operationType',
        [sequelize.fn('COUNT', sequelize.col('operationType')), 'count']
      ],
      group: ['operationType']
    });
    
    console.log('\n商品管理操作统计:');
    pmStats.forEach(stat => {
      console.log(`  ${stat.operationType}: ${stat.dataValues.count} 条`);
    });
    
    console.log('\n库存管理操作统计:');
    imStats.forEach(stat => {
      console.log(`  ${stat.operationType}: ${stat.dataValues.count} 条`);
    });

  } catch (error) {
    console.error('插入数据失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  insertManagementData();
}

module.exports = insertManagementData;