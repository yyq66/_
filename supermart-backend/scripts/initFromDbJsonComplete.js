const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function initFromDbJsonComplete() {
  let connection;
  try {
    // 连接到数据库
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME || 'supermart'
    });

    console.log('连接到数据库成功');

    // 禁用外键检查
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // 删除所有表
    await dropAllTables(connection);
    
    // 创建所有表
    await createAllTables(connection);
    
    // 插入所有数据
    await insertAllData(connection);
    
    // 重新启用外键检查
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    console.log('数据库初始化完成！');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function dropAllTables(connection) {
  console.log('开始删除所有表...');
  
  const [tables] = await connection.execute(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
  );
  
  for (const table of tables) {
    await connection.execute(`DROP TABLE IF EXISTS ${table.table_name}`);
  }
  
  console.log('所有表删除完成');
}

async function createAllTables(connection) {
  console.log('开始创建所有表...');

  // 1. 认证表
  await connection.execute(`
    CREATE TABLE auth (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      token TEXT,
      user_id VARCHAR(36),
      user_name VARCHAR(100),
      user_email VARCHAR(100),
      user_role VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ auth 表创建成功');

  // 2. 用户详细信息表
  await connection.execute(`
    CREATE TABLE user_profiles (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      phone VARCHAR(20),
      role VARCHAR(50) NOT NULL DEFAULT 'employee',
      avatar TEXT,
      department VARCHAR(100),
      join_date DATE,
      bio TEXT,
      last_login_time DATETIME,
      login_count INT DEFAULT 0,
      status VARCHAR(20) DEFAULT 'active',
      two_factor_enabled BOOLEAN DEFAULT FALSE,
      email_notifications BOOLEAN DEFAULT TRUE,
      sms_notifications BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ user_profiles 表创建成功');

  // 3. 密码修改请求表
  await connection.execute(`
    CREATE TABLE password_change_requests (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      token VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ password_change_requests 表创建成功');

  // 4. 用户基本信息表
  await connection.execute(`
    CREATE TABLE users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'employee',
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ users 表创建成功');

  // 5. 产品表
  await connection.execute(`
    CREATE TABLE products (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      sku VARCHAR(100) UNIQUE NOT NULL,
      category VARCHAR(100) NOT NULL,
      brand VARCHAR(100),
      price DECIMAL(10,2) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      min_stock INT DEFAULT 10,
      supplier VARCHAR(200),
      status VARCHAR(20) DEFAULT 'active',
      description TEXT,
      image TEXT,
      sales INT DEFAULT 0,
      create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ products 表创建成功');

  // 6. 订单表
  await connection.execute(`
    CREATE TABLE orders (
      id VARCHAR(36) PRIMARY KEY,
      customer_name VARCHAR(100) NOT NULL,
      customer_email VARCHAR(100) NOT NULL,
      customer_phone VARCHAR(20),
      total_amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      payment_method VARCHAR(50),
      shipping_address TEXT,
      order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ orders 表创建成功');

  // 7. 订单项表
  await connection.execute(`
    CREATE TABLE order_items (
      id VARCHAR(36) PRIMARY KEY,
      order_id VARCHAR(36) NOT NULL,
      product_id VARCHAR(36) NOT NULL,
      product_name VARCHAR(200) NOT NULL,
      quantity INT NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_order_id (order_id),
      INDEX idx_product_id (product_id)
    )
  `);
  console.log('✓ order_items 表创建成功');

  // 8. 仪表板核心指标表
  await connection.execute(`
    CREATE TABLE dashboard_core_metrics (
      id VARCHAR(36) PRIMARY KEY,
      total_revenue DECIMAL(15,2) DEFAULT 0,
      total_orders INT DEFAULT 0,
      total_customers INT DEFAULT 0,
      total_products INT DEFAULT 0,
      date_recorded DATE DEFAULT (CURRENT_DATE),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ dashboard_core_metrics 表创建成功');

  // 9. 实时指标表
  await connection.execute(`
    CREATE TABLE real_time_metrics (
      id VARCHAR(36) PRIMARY KEY,
      active_users INT DEFAULT 0,
      current_sales DECIMAL(10,2) DEFAULT 0,
      pending_orders INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ real_time_metrics 表创建成功');

  // 10. 销售趋势表
  await connection.execute(`
    CREATE TABLE sales_trend (
      id VARCHAR(36) PRIMARY KEY,
      date VARCHAR(10) NOT NULL,
      sales DECIMAL(10,2) NOT NULL,
      orders INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_date (date)
    )
  `);
  console.log('✓ sales_trend 表创建成功');

  // 11. 分类统计表
  await connection.execute(`
    CREATE TABLE category_stats (
      id VARCHAR(36) PRIMARY KEY,
      category VARCHAR(100) NOT NULL,
      sales DECIMAL(10,2) NOT NULL,
      percentage DECIMAL(5,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_category (category)
    )
  `);
  console.log('✓ category_stats 表创建成功');

  // 12. 小时分析表
  await connection.execute(`
    CREATE TABLE hourly_analysis (
      id VARCHAR(36) PRIMARY KEY,
      hour INT NOT NULL,
      orders INT NOT NULL,
      revenue DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_hour (hour)
    )
  `);
  console.log('✓ hourly_analysis 表创建成功');

  // 13. 地区统计表
  await connection.execute(`
    CREATE TABLE region_stats (
      id VARCHAR(36) PRIMARY KEY,
      region VARCHAR(100) NOT NULL,
      sales DECIMAL(10,2) NOT NULL,
      orders INT NOT NULL,
      customers INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_region (region)
    )
  `);
  console.log('✓ region_stats 表创建成功');

  // 14. 警报表
  await connection.execute(`
    CREATE TABLE alerts (
      id VARCHAR(36) PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      severity VARCHAR(20) NOT NULL DEFAULT 'medium',
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_type (type),
      INDEX idx_severity (severity)
    )
  `);
  console.log('✓ alerts 表创建成功');

  // 15. 预测表
  await connection.execute(`
    CREATE TABLE predictions (
      id VARCHAR(36) PRIMARY KEY,
      month VARCHAR(10) NOT NULL,
      predicted_sales DECIMAL(10,2) NOT NULL,
      confidence DECIMAL(5,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_month (month)
    )
  `);
  console.log('✓ predictions 表创建成功');

  console.log('所有表创建完成！');
}

async function insertAllData(connection) {
  console.log('开始插入所有数据...');

  // 插入认证数据
  const authData = [
    {
      id: '1',
      username: 'admin',
      password: '123456',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      user_id: '1',
      user_name: '管理员',
      user_email: 'admin@example.com',
      user_role: 'admin'
    },
    {
      id: 'c14a',
      username: 'admin',
      password: '123456'
    },
    {
      id: 'a77d',
      username: 'admin',
      password: '123456'
    },
    {
      id: 'c346',
      username: 'admin',
      password: '123456'
    },
    {
      id: '7d0f',
      username: 'admin',
      password: '123456'
    }
  ];
  
  for (const auth of authData) {
    await connection.execute(
      'INSERT IGNORE INTO auth (id, username, password, token, user_id, user_name, user_email, user_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [auth.id, auth.username, auth.password, auth.token || null, auth.user_id || null, auth.user_name || null, auth.user_email || null, auth.user_role || null]
    );
  }
  console.log('✓ auth 数据插入成功');

  // 插入用户详细信息
  const userProfilesData = [
    {
      id: '1',
      name: '管理员1333',
      email: 'admin@example.com',
      phone: '13800138000',
      role: 'admin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1_1753777927060',
      department: '系统管理部',
      join_date: '2023-01-01',
      bio: '系统管理员，负责平台的整体运营和维护工作。',
      last_login_time: '2024-01-15 09:30:00',
      login_count: 156,
      status: 'active',
      two_factor_enabled: true,
      email_notifications: true,
      sms_notifications: false
    },
    {
      id: '2',
      name: '张三',
      email: 'zhangsan@example.com',
      phone: '13900139000',
      role: 'manager',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
      department: '销售部',
      join_date: '2023-03-15',
      bio: '销售部经理，负责销售团队管理和业务拓展。',
      last_login_time: '2024-01-14 16:45:00',
      login_count: 89,
      status: 'active',
      two_factor_enabled: true,
      email_notifications: true,
      sms_notifications: true
    }
  ];
  
  for (const profile of userProfilesData) {
    await connection.execute(
      `INSERT IGNORE INTO user_profiles 
       (id, name, email, phone, role, avatar, department, join_date, bio, last_login_time, login_count, status, two_factor_enabled, email_notifications, sms_notifications) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [profile.id, profile.name, profile.email, profile.phone, profile.role, profile.avatar, profile.department, profile.join_date, profile.bio, profile.last_login_time, profile.login_count, profile.status, profile.two_factor_enabled, profile.email_notifications, profile.sms_notifications]
    );
  }
  console.log('✓ user_profiles 数据插入成功');

  // 插入用户基本信息
  const usersData = [
    { id: '1', name: '张三', email: 'zhangsan@example.com', role: '管理员', status: '活跃' },
    { id: '2', name: '李四', email: 'lisi@example.com', role: '员工', status: '活跃' }
  ];
  
  for (const user of usersData) {
    await connection.execute(
      'INSERT IGNORE INTO users (id, name, email, role, status) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.name, user.email, user.role, user.status]
    );
  }
  console.log('✓ users 数据插入成功');

  // 插入产品数据
  const productsData = [
    {
      id: '1',
      name: '有机苹果',
      sku: 'SKU001',
      category: '水果',
      brand: '绿色农场',
      price: 8.99,
      stock: 85,
      min_stock: 20,
      supplier: '有机农业合作社',
      status: 'active',
      description: '新鲜有机苹果，口感清脆甘甜',
      image: '/test.jpg',
      sales: 1250,
      create_time: '2024-01-01 00:00:00',
      update_time: '2025-07-29 09:01:26'
    },
    {
      id: '2',
      name: '有机香蕉',
      sku: 'SKU002',
      category: '水果',
      brand: '绿色农场',
      price: 12.5,
      stock: 20,
      min_stock: 30,
      supplier: '有机农业合作社',
      status: 'out_of_stock',
      description: '新鲜有机香蕉，口感细腻香甜',
      image: '',
      sales: 850,
      create_time: '2024-01-01 00:00:00',
      update_time: '2025-07-29 12:08:31'
    },
    {
      id: '3',
      name: '有机牛奶',
      sku: 'SKU003',
      category: '饮料',
      brand: '绿色农场',
      price: 4.5,
      stock: 50,
      min_stock: 40,
      supplier: '有机农业合作社',
      status: 'inactive',
      description: '新鲜有机牛奶，口感细腻香甜',
      image: '',
      sales: 650,
      create_time: '2024-01-01 00:00:00',
      update_time: '2025-07-29 12:08:31'
    }
  ];
  
  for (const product of productsData) {
    await connection.execute(
      `INSERT IGNORE INTO products 
       (id, name, sku, category, brand, price, stock, min_stock, supplier, status, description, image, sales, create_time, update_time) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [product.id, product.name, product.sku, product.category, product.brand, product.price, product.stock, product.min_stock, product.supplier, product.status, product.description, product.image, product.sales, product.create_time, product.update_time]
    );
  }
  console.log('✓ products 数据插入成功');

  // 插入订单数据
  const ordersData = [
    {
      id: '1',
      customer_name: '王五',
      customer_email: 'wangwu@example.com',
      customer_phone: '13700137000',
      total_amount: 156.50,
      status: 'completed',
      payment_method: 'credit_card',
      shipping_address: '北京市朝阳区某某街道123号',
      order_date: '2024-01-15 10:30:00'
    },
    {
      id: '2',
      customer_name: '赵六',
      customer_email: 'zhaoliu@example.com',
      customer_phone: '13600136000',
      total_amount: 89.99,
      status: 'pending',
      payment_method: 'alipay',
      shipping_address: '上海市浦东新区某某路456号',
      order_date: '2024-01-16 14:20:00'
    }
  ];
  
  for (const order of ordersData) {
    await connection.execute(
      `INSERT IGNORE INTO orders 
       (id, customer_name, customer_email, customer_phone, total_amount, status, payment_method, shipping_address, order_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order.id, order.customer_name, order.customer_email, order.customer_phone, order.total_amount, order.status, order.payment_method, order.shipping_address, order.order_date]
    );
  }
  console.log('✓ orders 数据插入成功');

  // 插入订单项数据
  const orderItemsData = [
    {
      id: uuidv4(),
      order_id: '1',
      product_id: '1',
      product_name: '有机苹果',
      quantity: 10,
      unit_price: 8.99,
      total_price: 89.90
    },
    {
      id: uuidv4(),
      order_id: '1',
      product_id: '2',
      product_name: '有机香蕉',
      quantity: 5,
      unit_price: 12.5,
      total_price: 62.50
    },
    {
      id: uuidv4(),
      order_id: '2',
      product_id: '1',
      product_name: '有机苹果',
      quantity: 10,
      unit_price: 8.99,
      total_price: 89.90
    }
  ];
  
  for (const item of orderItemsData) {
    await connection.execute(
      `INSERT IGNORE INTO order_items 
       (id, order_id, product_id, product_name, quantity, unit_price, total_price) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [item.id, item.order_id, item.product_id, item.product_name, item.quantity, item.unit_price, item.total_price]
    );
  }
  console.log('✓ order_items 数据插入成功');

  // 插入仪表板数据
  await connection.execute(
    'INSERT IGNORE INTO dashboard_core_metrics (id, total_revenue, total_orders, total_customers, total_products) VALUES (?, ?, ?, ?, ?)',
    [uuidv4(), 125000.00, 1250, 450, 120]
  );

  await connection.execute(
    'INSERT IGNORE INTO real_time_metrics (id, active_users, current_sales, pending_orders) VALUES (?, ?, ?, ?)',
    [uuidv4(), 23, 1250.00, 8]
  );

  // 插入销售趋势数据
  const salesTrendData = [
    { date: '2024-01-01', sales: 12500.00, orders: 125 },
    { date: '2024-01-02', sales: 13200.00, orders: 132 },
    { date: '2024-01-03', sales: 11800.00, orders: 118 },
    { date: '2024-01-04', sales: 14500.00, orders: 145 },
    { date: '2024-01-05', sales: 13900.00, orders: 139 },
    { date: '2024-01-06', sales: 15200.00, orders: 152 },
    { date: '2024-01-07', sales: 16800.00, orders: 168 }
  ];
  
  for (const trend of salesTrendData) {
    await connection.execute(
      'INSERT IGNORE INTO sales_trend (id, date, sales, orders) VALUES (?, ?, ?, ?)',
      [uuidv4(), trend.date, trend.sales, trend.orders]
    );
  }

  // 插入分类统计数据
  const categoryStatsData = [
    { category: '水果', sales: 45000.00, percentage: 36.0 },
    { category: '蔬菜', sales: 32000.00, percentage: 25.6 },
    { category: '饮料', sales: 28000.00, percentage: 22.4 },
    { category: '零食', sales: 20000.00, percentage: 16.0 }
  ];
  
  for (const stat of categoryStatsData) {
    await connection.execute(
      'INSERT IGNORE INTO category_stats (id, category, sales, percentage) VALUES (?, ?, ?, ?)',
      [uuidv4(), stat.category, stat.sales, stat.percentage]
    );
  }

  // 插入小时分析数据
  const hourlyAnalysisData = [
    { hour: 9, orders: 45, revenue: 2250.00 },
    { hour: 10, orders: 62, revenue: 3100.00 },
    { hour: 11, orders: 78, revenue: 3900.00 },
    { hour: 12, orders: 95, revenue: 4750.00 },
    { hour: 13, orders: 88, revenue: 4400.00 },
    { hour: 14, orders: 72, revenue: 3600.00 },
    { hour: 15, orders: 65, revenue: 3250.00 },
    { hour: 16, orders: 58, revenue: 2900.00 },
    { hour: 17, orders: 52, revenue: 2600.00 },
    { hour: 18, orders: 48, revenue: 2400.00 }
  ];
  
  for (const analysis of hourlyAnalysisData) {
    await connection.execute(
      'INSERT IGNORE INTO hourly_analysis (id, hour, orders, revenue) VALUES (?, ?, ?, ?)',
      [uuidv4(), analysis.hour, analysis.orders, analysis.revenue]
    );
  }

  // 插入地区统计数据
  const regionStatsData = [
    { region: '北京', sales: 35000.00, orders: 350, customers: 120 },
    { region: '上海', sales: 32000.00, orders: 320, customers: 110 },
    { region: '广州', sales: 28000.00, orders: 280, customers: 95 },
    { region: '深圳', sales: 30000.00, orders: 300, customers: 105 }
  ];
  
  for (const region of regionStatsData) {
    await connection.execute(
      'INSERT IGNORE INTO region_stats (id, region, sales, orders, customers) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), region.region, region.sales, region.orders, region.customers]
    );
  }

  // 插入警报数据
  const alertsData = [
    { type: 'low_stock', message: '有机香蕉库存不足，当前库存：20，最低库存：30', severity: 'high' },
    { type: 'system', message: '系统将于今晚23:00进行维护', severity: 'medium' },
    { type: 'order', message: '有新订单待处理', severity: 'low' }
  ];
  
  for (const alert of alertsData) {
    await connection.execute(
      'INSERT IGNORE INTO alerts (id, type, message, severity) VALUES (?, ?, ?, ?)',
      [uuidv4(), alert.type, alert.message, alert.severity]
    );
  }

  // 插入预测数据
  const predictionsData = [
    { month: '2024-02', predicted_sales: 135000.00, confidence: 85.5 },
    { month: '2024-03', predicted_sales: 142000.00, confidence: 82.3 },
    { month: '2024-04', predicted_sales: 138000.00, confidence: 87.1 },
    { month: '2024-05', predicted_sales: 145000.00, confidence: 84.8 }
  ];
  
  for (const prediction of predictionsData) {
    await connection.execute(
      'INSERT IGNORE INTO predictions (id, month, predicted_sales, confidence) VALUES (?, ?, ?, ?)',
      [uuidv4(), prediction.month, prediction.predicted_sales, prediction.confidence]
    );
  }

  console.log('✓ 仪表板相关数据插入成功');
  console.log('所有数据插入完成！');
}

if (require.main === module) {
  initFromDbJsonComplete();
}

module.exports = initFromDbJsonComplete;