const express = require('express');
const router = express.Router();
const { User, Auth } = require('../models');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// 获取所有用户
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'status', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      code: 200,
      message: '获取用户列表成功',
      data: users
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户列表失败'
    });
  }
});

// 添加用户
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, role, status } = req.body;
    // status = status=="活跃"? "active": "inactive";
    const password = '123456'
    
    if (!name || !email || !role || !password || !status) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数'
      });
    }

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: '邮箱已存在'
      });
    }

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await User.create({
      id: userId,
      name,
      email,
      role,
      status
    });

    // 创建认证信息
    await Auth.create({
      id: uuidv4(),
      username: email,
      password: hashedPassword,
      user_id: userId
    });

    res.json({
      code: 200,
      message: '用户添加成功',
      data: { id: userId, name, email, role, status: 'active' }
    });
  } catch (error) {
    console.error('添加用户失败:', error);
    res.status(500).json({
      code: 500,
      message: '添加用户失败'
    });
  }
});

// 更新用户
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;

    await User.update(
      { name, email, role, status },
      { where: { id } }
    );

    res.json({
      code: 200,
      message: '用户更新成功'
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新用户失败'
    });
  }
});

// 删除用户
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    await User.destroy({ where: { id } });

    res.json({
      code: 200,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除用户失败'
    });
  }
});

module.exports = router;