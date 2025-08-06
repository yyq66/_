const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Auth, User, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    // console.log("req.body", req.body)
    
    // 从Auth表查找用户（包含关联的用户信息）
    const authUser = await Auth.findOne({
      where: { username },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'role', 'status', 'avatar']
      }]
    });

    console.log("-----------------authUser:", authUser)

    if (!authUser) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }
    
    console.log("authUser.user.status", authUser.user.status)

    // 检查用户状态
    if (authUser.user.status !== 'active') {
      return res.status(401).json({
        code: 401,
        message: '账户已被禁用'
      });
    }

    // const hash = await bcrypt.hash("123456", 10);
    // console.log("hash", hash)

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, authUser.password);
    console.log("isValidPassword", isValidPassword)
    
    if (!isValidPassword) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }

    // 生成JWT token
    const token = jwt.sign(
      { 
        userId: authUser.user_id, 
        username: authUser.username,
        role: authUser.user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h'}
    );

    // 更新Auth表中的token
    await authUser.update({ token });

    // 更新User表中的登录信息
    await User.update(
      { 
        last_login_time: new Date(),
        login_count: sequelize.literal('login_count + 1')
      },
      { where: { id: authUser.user_id } }
    );

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: authUser.user_id,
          name: authUser.user.name,
          email: authUser.user.email,
          role: authUser.user.role,
          avatar: authUser.user.avatar
        }
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      code: 500,
      message: '登录失败'
    });
  }
});

// 退出登录
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // 清除Auth表中的token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await Auth.update(
        { token: null },
        { where: { user_id: decoded.userId } }
      );
    }

    res.json({
      code: 200,
      message: '退出登录成功'
    });
  } catch (error) {
    console.error('退出登录错误:', error);
    res.json({
      code: 200,
      message: '退出登录成功' // 即使出错也返回成功，因为前端会清除本地存储
    });
  }
});

module.exports = router;