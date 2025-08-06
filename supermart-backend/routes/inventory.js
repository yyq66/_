const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Product, InventoryLog } = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');

// 配置文件上传
const upload = multer({
  dest: 'uploads/temp/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持Excel文件格式'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// 记录库存操作日志的辅助函数
const logInventoryOperation = async (productId, productName, operationType, quantity, beforeStock, afterStock, operatorId, operatorName, reason, unitCost, batchNumber, supplier, req) => {
  try {
    await InventoryLog.create({
      id: uuidv4(),
      productId,
      productName,
      operationType,
      quantity,
      beforeStock,
      afterStock,
      unitCost: unitCost ? parseFloat(unitCost) : null,
      totalCost: unitCost ? parseFloat(unitCost) * Math.abs(quantity) : null,
      batchNumber,
      supplier,
      operatorId,
      operatorName,
      reason,
      operationTime: new Date()
    });
  } catch (error) {
    console.error('记录库存日志失败:', error);
  }
};

// 获取库存日志
router.get('/logs', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      productId, 
      operationType, 
      startDate, 
      endDate 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};
    
    if (productId) {
      whereClause.productId = productId;
    }
    
    if (operationType) {
      whereClause.operationType = operationType;
    }
    
    if (startDate && endDate) {
      whereClause.operationTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const { count, rows } = await InventoryLog.findAndCountAll({
      where: whereClause,
      include: [{
        model: Product,
        as: 'product',
        attributes: ['name', 'sku', 'stock']
      }],
      order: [['operationTime', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      logs: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('获取库存日志失败:', error);
    res.status(500).json({ error: '获取库存日志失败' });
  }
});

// 单个商品入库
router.post('/in', auth, async (req, res) => {
  try {
    const { productId, quantity, unitCost, batchNumber, supplier, reason } = req.body;
    
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: '请提供有效的商品ID和入库数量' });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    const beforeStock = product.stock;
    const afterStock = beforeStock + parseInt(quantity);
    
    await product.update({ stock: afterStock });

    // 记录库存日志
    await logInventoryOperation(
      productId,
      product.name,
      'in',
      parseInt(quantity),
      beforeStock,
      afterStock,
      req.user.id,
      req.user.username,
      reason || '商品入库',
      unitCost,
      batchNumber,
      supplier,
      req
    );

    res.json({ message: '入库成功', beforeStock, afterStock });
  } catch (error) {
    console.error('入库失败:', error);
    res.status(500).json({ error: '入库失败' });
  }
});

// 单个商品出库
router.post('/out', auth, async (req, res) => {
  try {
    const { productId, quantity, reason } = req.body;
    
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: '请提供有效的商品ID和出库数量' });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    const beforeStock = product.stock;
    if (beforeStock < quantity) {
      return res.status(400).json({ error: '库存不足' });
    }

    const afterStock = beforeStock - parseInt(quantity);
    
    await product.update({ stock: afterStock });

    // 记录库存日志
    await logInventoryOperation(
      productId,
      product.name,
      'out',
      -parseInt(quantity),
      beforeStock,
      afterStock,
      req.user.id,
      req.user.username,
      reason || '商品出库',
      null,
      null,
      null,
      req
    );

    res.json({ message: '出库成功', beforeStock, afterStock });
  } catch (error) {
    console.error('出库失败:', error);
    res.status(500).json({ error: '出库失败' });
  }
});

// 批量入库（Excel）
router.post('/batch-in', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传Excel文件' });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const results = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const { SKU, 入库数量, 单位成本, 批次号, 供应商, 备注 } = row;
        
        if (!SKU || !入库数量) {
          errors.push(`第${i + 2}行：SKU和入库数量不能为空`);
          continue;
        }

        const product = await Product.findOne({ where: { sku: SKU } });
        if (!product) {
          errors.push(`第${i + 2}行：找不到SKU为${SKU}的商品`);
          continue;
        }

        const quantity = parseInt(入库数量);
        if (isNaN(quantity) || quantity <= 0) {
          errors.push(`第${i + 2}行：入库数量必须是正整数`);
          continue;
        }

        const beforeStock = product.stock;
        const afterStock = beforeStock + quantity;
        
        await product.update({ stock: afterStock });

        // 记录库存日志
        await logInventoryOperation(
          product.id,
          product.name,
          'in',
          quantity,
          beforeStock,
          afterStock,
          req.user.id,
          req.user.username,
          备注 || '批量入库',
          单位成本,
          批次号,
          供应商,
          req
        );

        results.push({
          sku: SKU,
          name: product.name,
          quantity,
          beforeStock,
          afterStock
        });
      } catch (error) {
        errors.push(`第${i + 2}行：${error.message}`);
      }
    }

    // 删除临时文件
    const fs = require('fs');
    fs.unlinkSync(req.file.path);

    res.json({
      message: `批量入库完成，成功${results.length}条，失败${errors.length}条`,
      results,
      errors
    });
  } catch (error) {
    console.error('批量入库失败:', error);
    res.status(500).json({ error: '批量入库失败' });
  }
});

// 批量出库（Excel）
router.post('/batch-out', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传Excel文件' });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const results = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const { SKU, 出库数量, 备注 } = row;
        
        if (!SKU || !出库数量) {
          errors.push(`第${i + 2}行：SKU和出库数量不能为空`);
          continue;
        }

        const product = await Product.findOne({ where: { sku: SKU } });
        if (!product) {
          errors.push(`第${i + 2}行：找不到SKU为${SKU}的商品`);
          continue;
        }

        const quantity = parseInt(出库数量);
        if (isNaN(quantity) || quantity <= 0) {
          errors.push(`第${i + 2}行：出库数量必须是正整数`);
          continue;
        }

        const beforeStock = product.stock;
        if (beforeStock < quantity) {
          errors.push(`第${i + 2}行：${product.name}库存不足，当前库存${beforeStock}`);
          continue;
        }

        const afterStock = beforeStock - quantity;
        
        await product.update({ stock: afterStock });

        // 记录库存日志
        await logInventoryOperation(
          product.id,
          product.name,
          'out',
          -quantity,
          beforeStock,
          afterStock,
          req.user.id,
          req.user.username,
          备注 || '批量出库',
          null,
          null,
          null,
          req
        );

        results.push({
          sku: SKU,
          name: product.name,
          quantity,
          beforeStock,
          afterStock
        });
      } catch (error) {
        errors.push(`第${i + 2}行：${error.message}`);
      }
    }

    // 删除临时文件
    const fs = require('fs');
    fs.unlinkSync(req.file.path);

    res.json({
      message: `批量出库完成，成功${results.length}条，失败${errors.length}条`,
      results,
      errors
    });
  } catch (error) {
    console.error('批量出库失败:', error);
    res.status(500).json({ error: '批量出库失败' });
  }
});

// 库存调整
router.post('/adjust', auth, async (req, res) => {
  try {
    const { productId, newStock, reason } = req.body;
    
    if (!productId || newStock === undefined || newStock < 0) {
      return res.status(400).json({ error: '请提供有效的商品ID和新库存数量' });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    const beforeStock = product.stock;
    const afterStock = parseInt(newStock);
    const quantity = afterStock - beforeStock;
    
    await product.update({ stock: afterStock });

    // 记录库存日志
    await logInventoryOperation(
      productId,
      product.name,
      'adjust',
      quantity,
      beforeStock,
      afterStock,
      req.user.id,
      req.user.username,
      reason || '库存调整',
      null,
      null,
      null,
      req
    );

    res.json({ message: '库存调整成功', beforeStock, afterStock });
  } catch (error) {
    console.error('库存调整失败:', error);
    res.status(500).json({ error: '库存调整失败' });
  }
});

module.exports = router;