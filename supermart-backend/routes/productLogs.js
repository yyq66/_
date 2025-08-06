const express = require('express');
const router = express.Router();
const { ProductLog, Product } = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

// 获取商品操作日志
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      productId, 
      operationType, 
      operatorName,
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
    
    if (operatorName) {
      whereClause.operatorName = { [Op.like]: `%${operatorName}%` };
    }
    
    if (startDate && endDate) {
      whereClause.operationTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const { count, rows } = await ProductLog.findAndCountAll({
      where: whereClause,
      include: [{
        model: Product,
        as: 'product',
        attributes: ['name', 'sku']
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
    console.error('获取商品日志失败:', error);
    res.status(500).json({ error: '获取商品日志失败' });
  }
});

// 获取操作统计
router.get('/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = {};
    
    if (startDate && endDate) {
      whereClause.operationTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // 按操作类型统计
    const operationStats = await ProductLog.findAll({
      where: whereClause,
      attributes: [
        'operationType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['operationType']
    });

    // 按操作员统计
    const operatorStats = await ProductLog.findAll({
      where: whereClause,
      attributes: [
        'operatorName',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['operatorName'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10
    });

    res.json({
      operationStats,
      operatorStats
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

module.exports = router;