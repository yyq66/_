const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Product, ProductLog } = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

// 记录操作日志的辅助函数
const logProductOperation = async (productId, productName, operationType, operatorId, operatorName, beforeData, afterData, reason, req) => {
  try {
    const changeFields = [];
    if (beforeData && afterData) {
      Object.keys(afterData).forEach(key => {
        if (beforeData[key] !== afterData[key]) {
          changeFields.push(key);
        }
      });
    }

    await ProductLog.create({
      id: uuidv4(),
      productId,
      productName,
      operationType,
      operatorId,
      operatorName,
      beforeData,
      afterData,
      changeFields,
      reason,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      operationTime: new Date()
    });
  } catch (error) {
    console.error('记录操作日志失败:', error);
  }
};

// 获取所有商品
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, status } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (category) {
      whereClause.category = category;
    }
    
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Product.findAndCountAll({
      where: whereClause,
      order: [['createTime', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      products: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('获取商品列表失败:', error);
    res.status(500).json({ message: '获取商品列表失败' });
  }
});

// 获取单个商品
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }
    res.json(product);
  } catch (error) {
    console.error('获取商品详情失败:', error);
    res.status(500).json({ error: '获取商品详情失败' });
  }
});

// 创建商品
router.post('/', auth, async (req, res) => {
  try {
    const {
      name, sku, category, brand, price, stock, minStock,
      supplier, description, image, reason
    } = req.body;

    // 验证必填字段
    if (!name || !sku || !category || !price) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    // 检查SKU是否已存在
    const existing = await Product.findOne({ where: { sku } });
    if (existing) {
      return res.status(400).json({ error: 'SKU已存在' });
    }

    const productId = uuidv4();
    const now = new Date();
    
    // 确保price是数字类型
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) {
      return res.status(400).json({ error: '价格必须是有效数字' });
    }

    const productData = {
      id: productId,
      name,
      sku,
      category,
      brand: brand || null,
      price: numericPrice,
      stock: parseInt(stock) || 0,
      minStock: parseInt(minStock) || 10,
      supplier: supplier || null,
      status: parseInt(stock) === 0 ? 'out_of_stock' : 'active',
      description: description || null,
      image: image || null,
      sales: 0,
      createTime: now,
      updateTime: now
    };

    const product = await Product.create(productData);

    // 记录操作日志
    await logProductOperation(
      productId,
      name,
      'create',
      req.user.id,
      req.user.username,
      null,
      productData,
      reason || '创建新商品',
      req
    );

    res.status(201).json({ id: productId, message: '商品创建成功' });
  } catch (error) {
    console.error('创建商品失败:', error);
    res.status(500).json({ error: '创建商品失败' });
  }
});

// 更新商品
router.put('/:id', auth, async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      name, sku, category, brand, price, stock, minStock,
      supplier, status, description, image, reason
    } = req.body;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    // 保存更新前的数据
    const beforeData = product.toJSON();

    // 检查SKU是否被其他商品使用
    if (sku && sku !== product.sku) {
      const existing = await Product.findOne({ 
        where: { 
          sku, 
          id: { [Op.ne]: productId } 
        } 
      });
      if (existing) {
        return res.status(400).json({ error: 'SKU已被其他商品使用' });
      }
    }

    // 更新数据
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (sku !== undefined) updateData.sku = sku;
    if (category !== undefined) updateData.category = category;
    if (brand !== undefined) updateData.brand = brand;
    if (price !== undefined) {
      const numericPrice = parseFloat(price);
      if (isNaN(numericPrice)) {
        return res.status(400).json({ error: '价格必须是有效数字' });
      }
      updateData.price = numericPrice;
    }
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (minStock !== undefined) updateData.minStock = parseInt(minStock);
    if (supplier !== undefined) updateData.supplier = supplier;
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    updateData.updateTime = new Date();

    await product.update(updateData);
    
    // 获取更新后的数据
    const afterData = (await Product.findByPk(productId)).toJSON();

    // 记录操作日志
    await logProductOperation(
      productId,
      afterData.name,
      'update',
      req.user.id,
      req.user.username,
      beforeData,
      afterData,
      reason || '更新商品信息',
      req
    );

    res.json({ message: '商品更新成功' });
  } catch (error) {
    console.error('更新商品失败:', error);
    res.status(500).json({ error: '更新商品失败' });
  }
});

// 删除商品
router.delete('/:id', auth, async (req, res) => {
  try {
    const productId = req.params.id;
    const { reason } = req.body;
    
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    const beforeData = product.toJSON();

    await product.destroy();

    // 记录操作日志
    await logProductOperation(
      productId,
      beforeData.name,
      'delete',
      req.user.id,
      req.user.username,
      beforeData,
      null,
      reason || '删除商品',
      req
    );

    res.json({ message: '商品删除成功' });
  } catch (error) {
    console.error('删除商品失败:', error);
    res.status(500).json({ error: '删除商品失败' });
  }
});

// 批量更新商品状态
router.patch('/batch-status', auth, async (req, res) => {
  try {
    const { productIds, status, reason } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: '请选择要更新的商品' });
    }
    
    if (!status) {
      return res.status(400).json({ error: '请指定状态' });
    }

    const products = await Product.findAll({
      where: { id: { [Op.in]: productIds } }
    });

    for (const product of products) {
      const beforeData = product.toJSON();
      await product.update({ status, updateTime: new Date() });
      const afterData = (await Product.findByPk(product.id)).toJSON();
      
      // 记录操作日志
      await logProductOperation(
        product.id,
        product.name,
        'status_change',
        req.user.id,
        req.user.username,
        beforeData,
        afterData,
        reason || `批量更新状态为${status}`,
        req
      );
    }

    res.json({ message: `成功更新${products.length}个商品的状态` });
  } catch (error) {
    console.error('批量更新状态失败:', error);
    res.status(500).json({ error: '批量更新状态失败' });
  }
});

// 获取商品分类列表
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Product.findAll({
      attributes: ['category'],
      group: ['category'],
      where: {
        category: { [Op.ne]: null }
      }
    });
    
    const categoryList = categories.map(item => item.category).filter(Boolean);
    res.json(categoryList);
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({ error: '获取分类列表失败' });
  }
});

module.exports = router;