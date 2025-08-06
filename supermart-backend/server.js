const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
// 引入模型
const { sequelize } = require('./models');

// 中间件
app.use(helmet());
app.use(morgan('combined'));
app.use(cors());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static('uploads',{
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src * data: blob:;");
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/userProfiles', require('./routes/userProfile'));
app.use('/api/products', require('./routes/products'));
app.use('/api/product-logs', require('./routes/productLogs'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));


// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : '服务器错误'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在'
  });
});

// 启动服务器
// 在启动服务器之前同步数据库
const PORT = process.env.PORT || 3001;

// 同步数据库模型（开发环境）
if (process.env.NODE_ENV !== 'production') {
  // 将原来的 sequelize.sync() 修改为更安全的方式
  sequelize.authenticate()
    .then(() => {
      console.log('数据库连接成功');
      // 只验证连接，不自动同步表结构
      app.listen(PORT, () => {
        console.log(`服务器运行在端口 ${PORT}`);
      });
    })
    .catch(err => {
      console.error('数据库连接失败:', err);
    });
} else {
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
  });
}
console.log(`环境: ${process.env.NODE_ENV}`);

module.exports = app;