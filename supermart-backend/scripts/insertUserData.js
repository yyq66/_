const { sequelize, User, Auth } = require('../models');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

async function insertUserData() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 用户测试数据
    const userData = [
      {
        id: uuidv4(),
        name: '张三',
        email: 'zhangsan@example.com',
        role: 'admin',
        status: 'active',
        phone: '13800138001',
        department: '技术部',
        join_date: '2023-01-15',
        bio: '资深系统管理员，负责系统架构设计',
        login_count: 25,
        two_factor_enabled: true,
        email_notifications: true,
        sms_notifications: true
      },
      {
        id: uuidv4(),
        name: '李四',
        email: 'lisi@example.com',
        role: 'manager',
        status: 'active',
        phone: '13800138002',
        department: '销售部',
        join_date: '2023-03-20',
        bio: '销售部门经理，擅长客户关系管理',
        login_count: 18,
        two_factor_enabled: false,
        email_notifications: true,
        sms_notifications: false
      },
      {
        id: uuidv4(),
        name: '王五',
        email: 'wangwu@example.com',
        role: 'employee',
        status: 'active',
        phone: '13800138003',
        department: '财务部',
        join_date: '2023-05-10',
        bio: '财务专员，负责日常财务管理',
        login_count: 12,
        two_factor_enabled: false,
        email_notifications: true,
        sms_notifications: true
      },
      {
        id: uuidv4(),
        name: '赵六',
        email: 'zhaoliu@example.com',
        role: 'employee',
        status: 'inactive',
        phone: '13800138004',
        department: '人事部',
        join_date: '2023-02-28',
        bio: '人事专员，负责招聘和员工管理',
        login_count: 8,
        two_factor_enabled: false,
        email_notifications: false,
        sms_notifications: false
      },
      {
        id: uuidv4(),
        name: '孙七',
        email: 'sunqi@example.com',
        role: 'employee',
        status: 'active',
        phone: '13800138005',
        department: '技术部',
        join_date: '2023-06-15',
        bio: '前端开发工程师，专注于用户界面开发',
        login_count: 35,
        two_factor_enabled: true,
        email_notifications: true,
        sms_notifications: false
      }
    ];

    // 插入用户数据
    console.log('开始插入用户数据...');
    const createdUsers = [];
    for (const user of userData) {
      try {
        const existingUser = await User.findOne({ where: { email: user.email } });
        if (existingUser) {
          console.log(`用户 ${user.email} 已存在，跳过`);
          createdUsers.push(existingUser);
          continue;
        }
        
        const newUser = await User.create(user);
        console.log(`用户 ${newUser.name} 创建成功`);
        createdUsers.push(newUser);
      } catch (error) {
        console.error(`创建用户 ${user.name} 失败:`, error.message);
      }
    }

    // 为每个用户创建认证数据
    console.log('开始创建认证数据...');
    const authData = [
      { username: 'admin', password: 'admin123', userIndex: 0 },
      { username: 'manager', password: 'manager123', userIndex: 1 },
      { username: 'employee1', password: 'emp123', userIndex: 2 },
      { username: 'employee2', password: 'emp456', userIndex: 3 },
      { username: 'developer', password: 'dev123', userIndex: 4 }
    ];

    for (let i = 0; i < authData.length && i < createdUsers.length; i++) {
      const auth = authData[i];
      const user = createdUsers[auth.userIndex];
      
      if (!user) {
        console.log(`用户索引 ${auth.userIndex} 不存在，跳过认证数据创建`);
        continue;
      }

      try {
        const existingAuth = await Auth.findOne({ where: { username: auth.username } });
        if (existingAuth) {
          console.log(`认证用户 ${auth.username} 已存在，跳过`);
          continue;
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(auth.password, 10);
        
        const newAuth = await Auth.create({
          id: uuidv4(),
          username: auth.username,
          password: hashedPassword,
          user_id: user.id,
          token: null
        });
        
        console.log(`认证数据 ${newAuth.username} 创建成功，关联用户: ${user.name}`);
      } catch (error) {
        console.error(`创建认证数据 ${auth.username} 失败:`, error.message);
      }
    }

    console.log('\n数据插入完成！');
    console.log('\n测试账号信息：');
    console.log('管理员: admin / admin123');
    console.log('经理: manager / manager123');
    console.log('员工1: employee1 / emp123');
    console.log('员工2: employee2 / emp456');
    console.log('开发者: developer / dev123');
    
  } catch (error) {
    console.error('插入数据时发生错误:', error);
  } finally {
    await sequelize.close();
    console.log('数据库连接已关闭');
  }
}

// 运行脚本
if (require.main === module) {
  insertUserData();
}

module.exports = insertUserData;