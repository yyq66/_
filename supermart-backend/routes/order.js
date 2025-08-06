const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Order } = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

// 获取所有订单（支持分页和筛选）
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      type, 
      category,
      paymentStatus,
      startDate,
      endDate,
      keyword 
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // 添加筛选条件
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;
    if (category) whereClause.category = category;
    if (paymentStatus) whereClause.paymentStatus = paymentStatus;
    
    // 日期范围筛选
    if (startDate && endDate) {
      whereClause.orderDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    // 关键词搜索（订单号、客户姓名、商品名称）
    if (keyword) {
      whereClause[Op.or] = [
        { orderNumber: { [Op.like]: `%${keyword}%` } },
        { customerName: { [Op.like]: `%${keyword}%` } },
        { name: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      order: [['orderDate', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      orders: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

// 根据ID获取单个订单
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    res.json(order);
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({ error: '获取订单详情失败' });
  }
});

// 创建新订单
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      category,
      type,
      quantity,
      unitPrice,
      customerId,
      customerName,
      customerPhone,
      paymentMethod,
      discount = 0,
      shippingAddress,
      notes,
      deliveryDate
    } = req.body;

    // 验证必填字段
    if (!name || !category || !type || !quantity || !unitPrice) {
      return res.status(400).json({ 
        error: '缺少必填字段：name, category, type, quantity, unitPrice' 
      });
    }

    // 验证数值字段
    if (quantity <= 0 || unitPrice <= 0) {
      return res.status(400).json({ error: '数量和单价必须大于0' });
    }

    const orderId = uuidv4();
    const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const now = new Date();
    
    // 计算总金额（在模型的beforeSave钩子中会自动计算，但这里也可以预计算）
    const subtotal = quantity * unitPrice;
    const totalAmount = subtotal - (discount || 0);

    const order = await Order.create({
      id: orderId,
      name,
      category,
      type,
      quantity: parseInt(quantity),
      unitPrice: parseFloat(unitPrice),
      totalAmount: parseFloat(totalAmount),
      orderNumber,
      customerId: customerId || null,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      status: 'pending',
      paymentStatus: 'unpaid',
      paymentMethod: paymentMethod || null,
      discount: parseFloat(discount) || 0,
      shippingAddress: shippingAddress || null,
      notes: notes || null,
      orderDate: now,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null
    });

    res.status(201).json({ 
      id: orderId, 
      orderNumber,
      message: '订单创建成功' 
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({ error: '创建订单失败' });
  }
});

// 更新订单
router.put('/:id', auth, async (req, res) => {
  try {
    console.log("req.body",req.body)
    const orderId = req.params.id;
    const updateData = req.body;

    // 查找订单
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    // 检查订单状态，某些状态下不允许修改
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(409).json({ 
        success: false,
        message: '已完成或已取消的订单不能修改' 
      });
    }
    
    

    // 过滤不允许直接修改的字段
    const allowedFields = [
      'name', 'category', 'type', 'quantity', 'unitPrice',
      'customerName', 'customerPhone', 'paymentMethod',"orderDate",
      'discount', 'shippingAddress', 'notes', 'deliveryDate',
      'status', 'paymentStatus'
    ];
    
    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    // 如果修改了数量、单价或折扣，需要重新计算总金额
    if (filteredData.quantity || filteredData.unitPrice || filteredData.discount !== undefined) {
      const quantity = filteredData.quantity || order.quantity;
      const unitPrice = filteredData.unitPrice || order.unitPrice;
      const discount = filteredData.discount !== undefined ? filteredData.discount : order.discount;
      
      filteredData.totalAmount = (quantity * unitPrice) - discount;
    }

    console.log(filteredData)

    // 更新订单
    await order.update(filteredData);

    res.json({ message: '订单更新成功' });
  } catch (error) {
    console.error('更新订单失败:', error);
    res.status(500).json({ error: '更新订单失败' });
  }
});

// 删除订单
router.delete('/:id', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    // 检查订单状态，某些状态下不允许删除
    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({ 
        error: '已发货或已完成的订单不能删除' 
      });
    }

    await order.destroy();
    res.json({ message: '订单删除成功' });
  } catch (error) {
    console.error('删除订单失败:', error);
    res.status(500).json({ error: '删除订单失败' });
  }
});

// 批量更新订单状态
router.patch('/batch-status', auth, async (req, res) => {
  try {
    const { orderIds, status } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: '请提供有效的订单ID列表' });
    }

    if (!status) {
      return res.status(400).json({ error: '请提供要更新的状态' });
    }

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '无效的订单状态' });
    }

    const [updatedCount] = await Order.update(
      { status },
      { where: { id: orderIds } }
    );

    res.json({ 
      message: `成功更新 ${updatedCount} 个订单状态`,
      updatedCount 
    });
  } catch (error) {
    console.error('批量更新订单状态失败:', error);
    res.status(500).json({ error: '批量更新订单状态失败' });
  }
});

// 获取订单统计信息
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = {};
    
    if (startDate && endDate) {
      whereClause.orderDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // 总订单数
    const totalOrders = await Order.count({ where: whereClause });
    
    // 各状态订单数
    const statusStats = await Order.findAll({
      where: whereClause,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // 总销售额
    const totalRevenue = await Order.sum('totalAmount', { where: whereClause }) || 0;
    
    // 平均订单金额
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      statusStats
    });
  } catch (error) {
    console.error('获取订单统计失败:', error);
    res.status(500).json({ error: '获取订单统计失败' });
  }
});

// 根据订单号搜索
router.get('/search/:orderNumber', auth, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const order = await Order.findOne({
      where: { orderNumber }
    });

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    res.json(order);
  } catch (error) {
    console.error('搜索订单失败:', error);
    res.status(500).json({ error: '搜索订单失败' });
  }
});

module.exports = router;