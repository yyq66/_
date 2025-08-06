const express = require('express');
const router = express.Router();
const { Order, Product, User } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const auth = require('../middleware/auth');
const ExcelJS = require('exceljs');

// 获取报表数据
router.get('/data', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // 日期范围条件
    const dateCondition = {
      orderDate: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    };

    // 1. 销售概览
    const salesOverview = await Order.findOne({
      where: dateCondition,
      attributes: [
        [fn('SUM', col('total_amount')), 'totalSales'], 
        [fn('COUNT', col('id')), 'totalOrders'],
        [fn('AVG', col('total_amount')), 'avgOrderValue'],
        [fn('COUNT', fn('DISTINCT', col('customer_name'))), 'totalCustomers']
      ],
      raw: true
    });

    // 2. 销售趋势
    const salesTrend = await Order.findAll({
      where: dateCondition,
      attributes: [
        [fn('DATE', col('order_date')), 'date'],  // 修复字段名
        [fn('SUM', col('total_amount')), 'sales'],  // 修复字段名
        [fn('COUNT', col('id')), 'orders']
      ],
      group: [fn('DATE', col('order_date'))],  // 修复字段名
      order: [[fn('DATE', col('order_date')), 'ASC']],  // 修复字段名
      raw: true
    });

    // 3. 分类统计
    const categoryStats = await Order.findAll({
      where: dateCondition,
      attributes: [
        'category',
        [fn('SUM', col('total_amount')), 'sales'],  // 修复字段名
        [fn('COUNT', col('id')), 'orders']
      ],
      group: ['category'],
      order: [[fn('SUM', col('total_amount')), 'DESC']],  // 修复字段名
      raw: true
    });

    // 计算分类百分比
    const totalCategorySales = categoryStats.reduce((sum, item) => sum + parseFloat(item.sales), 0);
    const categoryStatsWithPercentage = categoryStats.map(item => ({
      ...item,
      percentage: ((parseFloat(item.sales) / totalCategorySales) * 100).toFixed(1)
    }));

    // 4. 商品销售排行
    const productRanking = await Order.findAll({
      where: dateCondition,
      attributes: [
        'name',
        [fn('SUM', col('quantity')), 'quantity'],
        [fn('SUM', col('total_amount')), 'revenue']  // 修复字段名
      ],
      group: ['name'],
      order: [[fn('SUM', col('total_amount')), 'DESC']],  // 修复字段名
      limit: 20,
      raw: true
    });

    // 5. 用户统计
    const userStats = await User.findOne({
      attributes: [
        [fn('COUNT', col('id')), 'totalUsers'],
        [fn('COUNT', literal('CASE WHEN status = "active" THEN 1 END')), 'activeUsers'],
        [fn('COUNT', literal(`CASE WHEN created_at >= '${startDate}' THEN 1 END`)), 'newUsers']
      ],
      raw: true
    });

    // 6. 订单状态统计
    const orderStats = await Order.findAll({
      where: dateCondition,
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const totalOrderCount = orderStats.reduce((sum, item) => sum + parseInt(item.count), 0);
    const orderStatsWithPercentage = orderStats.map(item => ({
      ...item,
      percentage: ((parseInt(item.count) / totalOrderCount) * 100).toFixed(1)
    }));

    // 7. 支付方式统计
    const paymentStats = await Order.findAll({
      where: {
        ...dateCondition,
        paymentMethod: { [Op.not]: null }
      },
      attributes: [
        'payment_method',  // 修复字段名
        [fn('SUM', col('total_amount')), 'amount'],  // 修复字段名
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['payment_method'],  // 修复字段名
      raw: true
    });

    // 8. 时段分析
    const hourlyStats = await Order.findAll({
      where: dateCondition,
      attributes: [
        [fn('HOUR', col('order_date')), 'hour'],  // 修复字段名
        [fn('COUNT', col('id')), 'orders'],
        [fn('SUM', col('total_amount')), 'sales']  // 修复字段名
      ],
      group: [fn('HOUR', col('order_date'))],  // 修复字段名
      order: [[fn('HOUR', col('order_date')), 'ASC']],  // 修复字段名
      raw: true
    });

    // 格式化时段数据
    const formattedHourlyStats = Array.from({ length: 24 }, (_, i) => {
      const hourData = hourlyStats.find(item => parseInt(item.hour) === i);
      return {
        hour: `${i}:00`,
        orders: hourData ? parseInt(hourData.orders) : 0,
        sales: hourData ? parseFloat(hourData.sales) : 0
      };
    });

    res.json({
      salesOverview: {
        totalSales: parseFloat(salesOverview?.totalSales || 0),
        totalOrders: parseInt(salesOverview?.totalOrders || 0),
        avgOrderValue: parseFloat(salesOverview?.avgOrderValue || 0),
        totalCustomers: parseInt(salesOverview?.totalCustomers || 0)
      },
      salesTrend,
      categoryStats: categoryStatsWithPercentage,
      productRanking,
      userStats: {
        totalUsers: parseInt(userStats?.totalUsers || 0),
        activeUsers: parseInt(userStats?.activeUsers || 0),
        newUsers: parseInt(userStats?.newUsers || 0),
        userGrowth: 0
      },
      orderStats: orderStatsWithPercentage,
      paymentStats: paymentStats.map(item => ({
        method: item.payment_method,  // 修复字段名
        amount: parseFloat(item.amount),
        count: parseInt(item.count)
      })),
      hourlyStats: formattedHourlyStats
    });
  } catch (error) {
    console.error('获取报表数据失败:', error);
    res.status(500).json({ message: '获取报表数据失败', error: error.message });
  }
});

// 导出报表
router.get('/export', auth, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    // 创建工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('数据报表');

    // 设置标题
    worksheet.addRow([`数据报表 (${startDate} 至 ${endDate})`]);
    worksheet.addRow([]);

    // 根据类型导出不同数据
    if (type === 'overview' || type === 'all') {
      // 导出销售概览数据
      const dateCondition = {
        orderDate: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      };

      const orders = await Order.findAll({
        where: dateCondition,
        order: [['orderDate', 'DESC']]
      });

      // 添加表头
      worksheet.addRow([
        '订单号', '商品名称', '分类', '订单类型', '数量', 
        '单价', '总金额', '客户姓名', '状态', '支付状态', 
        '支付方式', '订单日期'
      ]);

      // 添加数据
      orders.forEach(order => {
        worksheet.addRow([
          order.orderNumber,
          order.name,
          order.category,
          order.type,
          order.quantity,
          order.unitPrice,
          order.totalAmount,
          order.customerName,
          order.status,
          order.paymentStatus,
          order.paymentMethod,
          order.orderDate
        ]);
      });
    }

    // 设置响应头
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report_${startDate}_${endDate}.xlsx"`
    );

    // 写入响应
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('导出报表失败:', error);
    res.status(500).json({ message: '导出报表失败', error: error.message });
  }
});

module.exports = router;