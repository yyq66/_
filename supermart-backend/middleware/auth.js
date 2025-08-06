const jwt = require('jsonwebtoken');
const { Auth, User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    // console.log(req.headers)
    const authHeader = req.headers.authorization;
    // console.log("authHeader",authHeader)
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: '未提供有效的认证令牌'
      });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
    // console.log("token:",token)

    // 验证JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 从Auth表检查token是否存在（包含关联的用户信息）
    const authUser = await Auth.findOne({
      where: { 
        // token,
        user_id: decoded.userId 
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'role', 'status']
      }]
    });

    if (!authUser) {
      return res.status(401).json({
        code: 401,
        message: '认证令牌无效'
      });
    }
    
    if (authUser.user.status !== 'active') {
      return res.status(401).json({
        code: 401,
        message: '用户账户已被禁用'
      });
    }

    // 将用户信息添加到请求对象中
    req.user = {
      id: authUser.user_id,
      username: authUser.username,
      name: authUser.user.name,
      email: authUser.user.email,
      role: authUser.user.role
    };

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: '认证令牌格式错误'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '认证令牌已过期'
      });
    }

    console.error('认证中间件错误:', error);
    res.status(500).json({
      code: 500,
      message: '认证验证失败'
    });
  }
};

module.exports = authMiddleware;