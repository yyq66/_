const { sequelize, User } = require('../models');
const { v4: uuidv4 } = require('uuid');

async function mergeUserTables() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 1. 分别备份现有数据
    try {
      await sequelize.query('CREATE TABLE users_backup AS SELECT * FROM users');
      console.log('users表备份完成');
    } catch (error) {
      console.log('users表备份失败或已存在:', error.message);
    }
    
    try {
      await sequelize.query('CREATE TABLE user_profiles_backup AS SELECT * FROM user_profiles');
      console.log('user_profiles表备份完成');
    } catch (error) {
      console.log('user_profiles表备份失败或已存在:', error.message);
    }

    // 2. 获取现有数据
    let users = [];
    let profiles = [];
    
    try {
      const [usersResult] = await sequelize.query('SELECT * FROM users');
      users = usersResult;
      console.log(`获取到 ${users.length} 条用户记录`);
    } catch (error) {
      console.log('获取users数据失败:', error.message);
    }
    
    try {
      const [profilesResult] = await sequelize.query('SELECT * FROM user_profiles');
      profiles = profilesResult;
      console.log(`获取到 ${profiles.length} 条用户档案记录`);
    } catch (error) {
      console.log('获取user_profiles数据失败:', error.message);
    }
    
    // 3. 删除旧表（按依赖顺序）
    try {
      await sequelize.query('DROP TABLE IF EXISTS auth');
      console.log('auth表删除完成');
    } catch (error) {
      console.log('auth表删除失败:', error.message);
    }
    
    try {
      await sequelize.query('DROP TABLE IF EXISTS user_profiles');
      console.log('user_profiles表删除完成');
    } catch (error) {
      console.log('user_profiles表删除失败:', error.message);
    }
    
    try {
      await sequelize.query('DROP TABLE IF EXISTS users');
      console.log('users表删除完成');
    } catch (error) {
      console.log('users表删除失败:', error.message);
    }

    // 4. 创建新的合并表
    await sequelize.sync({ force: true });
    console.log('新表结构创建完成');

    // 5. 合并数据
    if (users.length > 0) {
      const mergedData = [];
      
      for (const user of users) {
        const profile = profiles.find(p => p.email === user.email);
        
        const mergedUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          phone: profile?.phone || null,
          avatar: profile?.avatar || null,
          department: profile?.department || null,
          join_date: profile?.joinDate || profile?.join_date || null,
          bio: profile?.bio || null,
          last_login_time: profile?.lastLoginTime || profile?.last_login_time || null,
          login_count: profile?.loginCount || profile?.login_count || 0,
          two_factor_enabled: profile?.twoFactorEnabled || profile?.two_factor_enabled || false,
          email_notifications: profile?.emailNotifications || profile?.email_notifications || true,
          sms_notifications: profile?.smsNotifications || profile?.sms_notifications || false,
          created_at: user.created_at,
          updated_at: user.updated_at
        };
        
        mergedData.push(mergedUser);
      }

      // 6. 插入合并后的数据
      await User.bulkCreate(mergedData);
      console.log(`合并完成，共处理 ${mergedData.length} 条记录`);
    } else {
      console.log('没有找到用户数据，跳过数据合并');
    }

  } catch (error) {
    console.error('合并失败:', error);
  } finally {
    await sequelize.close();
  }
}

mergeUserTables();