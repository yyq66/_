const express = require('express');
const router = express.Router();
// 删除这行：const db = require('../config/database');
const { Product } = require('../models');
const auth = require('../middleware/auth');

// 通用日期范围处理函数
function getDateRange(startDate, endDate) {
  const start = startDate ? dayjs(startDate).startOf('day').toDate() : dayjs().subtract(30, 'day').startOf('day').toDate();
  const end = endDate ? dayjs(endDate).endOf('day').toDate() : dayjs().endOf('day').toDate();
  return { start, end };
}

// 更新时间范围
router.post('update-time', auth, async (req, res) => {
  const { startTime, endTime } = req.body;
  const { start, end } = getDateRange(startTime, endTime);
  
} )

// 获取核心指标
// router.get('/core-metrics', auth, async (req, res) => {
//   try {
//     // 模拟数据，实际应该从数据库计算
//     const coreMetrics = {
//       totalSales: 1234567.89,
//       onlineUsers: 1234,
//       conversionRate: 3.45,
//       averageOrderValue: 234.56
//     };

//     res.json({
//       code: 200,
//       message: '获取核心指标成功',
//       data: coreMetrics
//     });
//   } catch (error) {
//     console.error('获取核心指标失败:', error);
//     res.status(500).json({
//       code: 500,
//       message: '获取核心指标失败'
//     });
//   }
// });

// 获取销售趋势
router.get('/sales-trend', auth, async (req, res) => {
  try {
    // 模拟7天销售数据
    const salesTrend = [
      { date: '2024-01-01', sales: 12000 },
      { date: '2024-01-02', sales: 15000 },
      { date: '2024-01-03', sales: 18000 },
      { date: '2024-01-04', sales: 14000 },
      { date: '2024-01-05', sales: 16000 },
      { date: '2024-01-06', sales: 20000 },
      { date: '2024-01-07', sales: 22000 }
    ];

    res.json({
      code: 200,
      message: '获取销售趋势成功',
      data: salesTrend
    });
  } catch (error) {
    console.error('获取销售趋势失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取销售趋势失败'
    });
  }
});

// 获取分类统计
router.get('/category-stats', auth, async (req, res) => {
  try {
    const categories = await Product.findAll({
      attributes: [
        'category',
        [Product.sequelize.fn('COUNT', '*'), 'count'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('sales')), 'totalSales']
      ],
      group: ['category']
    });

    res.json({
      code: 200,
      message: '获取分类统计成功',
      data: categories
    });
  } catch (error) {
    console.error('获取分类统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取分类统计失败'
    });
  }
});

// 获取小时分析
router.get('/hourly-analysis', auth, async (req, res) => {
  try {
    // 模拟24小时数据
    const hourlyAnalysis = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      orders: Math.floor(Math.random() * 100) + 10,
      sales: Math.floor(Math.random() * 5000) + 1000
    }));

    res.json({
      code: 200,
      message: '获取小时分析成功',
      data: hourlyAnalysis
    });
  } catch (error) {
    console.error('获取小时分析失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取小时分析失败'
    });
  }
});

// 获取地区统计
router.get('/region-stats', auth, async (req, res) => {
  try {
    // 模拟地区数据
    const regionStats = [
      { region: '北京', sales: 150000, orders: 1200 },
      { region: '上海', sales: 180000, orders: 1500 },
      { region: '广州', sales: 120000, orders: 1000 },
      { region: '深圳', sales: 160000, orders: 1300 },
      { region: '杭州', sales: 100000, orders: 800 }
    ];

    res.json({
      code: 200,
      message: '获取地区统计成功',
      data: regionStats
    });
  } catch (error) {
    console.error('获取地区统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取地区统计失败'
    });
  }
});

// 获取预警信息
router.get('/alerts', auth, async (req, res) => {
  try {
    const lowStockProducts = await Product.findAll({
      attributes: ['name', 'stock', 'min_stock'],
      where: {
        stock: {
          [Product.sequelize.Op.lte]: Product.sequelize.col('min_stock')
        },
        status: 'active'
      },
      limit: 10
    });

    const alerts = lowStockProducts.map(product => ({
      type: 'warning',
      message: `商品 ${product.name} 库存不足，当前库存：${product.stock}`,
      time: new Date().toISOString()
    }));

    res.json({
      code: 200,
      message: '获取预警信息成功',
      data: alerts
    });
  } catch (error) {
    console.error('获取预警信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取预警信息失败'
    });
  }
});

// 获取预测数据
router.get('/prediction', auth, async (req, res) => {
  try {
    // 模拟预测数据
    const prediction = {
      nextWeekSales: 180000,
      growthRate: 12.5,
      confidence: 85
    };

    res.json({
      code: 200,
      message: '获取预测数据成功',
      data: prediction
    });
  } catch (error) {
    console.error('获取预测数据失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取预测数据失败'
    });
  }
});

module.exports = router;