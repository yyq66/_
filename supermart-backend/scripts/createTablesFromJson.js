const { v4: uuidv4 } = require('uuid');
const { sequelize, Auth, UserProfile, User, Product, PasswordChangeRequest } = require('../models');
const fs = require('fs');
const path = require('path');

async function createTablesFromJson() {
  try {
    console.log('开始连接数据库...');
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 强制同步所有表（删除现有表并重新创建）
    console.log('开始同步数据库表结构...');
    await sequelize.sync({ force: true });
    console.log('数据库表结构同步完成');

    // 读取db.json文件
    const dbJsonPath = path.join(__dirname, '../../supermart-admin/db.json');
    const dbData = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));

    console.log('开始插入初始数据...');

    // 1. 先插入User数据（因为Auth表依赖Users表）
    if (dbData.users && dbData.users.length > 0) {
      for (const userData of dbData.users) {
        // 检查email是否已存在
        const existingUser = await User.findOne({ where: { email: userData.email } });
        if (existingUser) {
          console.log(`警告: email '${userData.email}' 已存在，跳过此User记录`);
          continue;
        }

        await User.create({
          id: userData.id.toString(), // 确保ID是字符串类型
          name: userData.name,
          email: userData.email,
          role: userData.role,
          status: userData.status
        });
      }
      console.log(`✓ 插入了User记录`);
    }

    // 2. 插入Auth数据
    if (dbData.auth && dbData.auth.length > 0) {
      for (const authData of dbData.auth) {
        // 检查username是否已存在
        const existingAuth = await Auth.findOne({ where: { username: authData.username } });
        if (existingAuth) {
          console.log(`警告: username '${authData.username}' 已存在，跳过此Auth记录`);
          continue;
        }

        // 只有当user_id存在且对应的用户记录存在时才插入
        let userId = null;
        if (authData.user && authData.user.id) {
          userId = authData.user.id.toString();
          // 检查用户是否存在
          const userExists = await User.findByPk(userId);
          if (!userExists) {
            console.log(`警告: 用户ID ${userId} 不存在，跳过此Auth记录`);
            continue;
          }
        }

        await Auth.create({
          id: authData.id || uuidv4(),
          username: authData.username,
          password: authData.password,
          token: authData.token || null,
          user_id: userId,
          user_name: authData.user ? authData.user.name : null,
          user_email: authData.user ? authData.user.email : null,
          user_role: authData.user ? authData.user.role : null
        });
      }
      console.log(`✓ 插入了Auth记录`);
    }

    // 3. 插入UserProfile数据
    if (dbData.userProfiles && dbData.userProfiles.length > 0) {
      for (const profileData of dbData.userProfiles) {
        // 检查对应的用户是否存在
        const userId = profileData.id.toString();
        const userExists = await User.findByPk(userId);
        if (!userExists) {
          console.log(`警告: 用户ID ${userId} 不存在，跳过此UserProfile记录`);
          continue;
        }

        await UserProfile.create({
          id: userId,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          role: profileData.role,
          avatar: profileData.avatar,
          department: profileData.department,
          join_date: profileData.joinDate,
          bio: profileData.bio,
          last_login_time: profileData.lastLoginTime,
          login_count: profileData.loginCount || 0,
          status: profileData.status || 'active',
          two_factor_enabled: profileData.settings?.twoFactorEnabled || false,
          email_notifications: profileData.settings?.emailNotifications !== false,
          sms_notifications: profileData.settings?.smsNotifications || false
        });
      }
      console.log(`✓ 插入了 ${dbData.userProfiles.length} 条UserProfile记录`);
    }

    // 4. 插入Product数据
    if (dbData.products && dbData.products.length > 0) {
      for (const productData of dbData.products) {
        await Product.create({
          id: productData.id || uuidv4(),
          name: productData.name,
          sku: productData.sku,
          category: productData.category,
          brand: productData.brand,
          price: productData.price,
          stock: productData.stock,
          min_stock: productData.minStock,
          supplier: productData.supplier,
          status: productData.status,
          description: productData.description,
          image: typeof productData.image === 'string' ? productData.image : JSON.stringify(productData.image),
          sales: productData.sales || 0,
          create_time: productData.createTime,
          update_time: productData.updateTime
        });
      }
      console.log(`✓ 插入了 ${dbData.products.length} 条Product记录`);
    }

    // 5. 插入PasswordChangeRequest数据（如果有）
    if (dbData.passwordChangeRequests && dbData.passwordChangeRequests.length > 0) {
      for (const requestData of dbData.passwordChangeRequests) {
        // 检查用户是否存在
        const userExists = await User.findByPk(requestData.user_id.toString());
        if (!userExists) {
          console.log(`警告: 用户ID ${requestData.user_id} 不存在，跳过此PasswordChangeRequest记录`);
          continue;
        }

        await PasswordChangeRequest.create({
          id: requestData.id || uuidv4(),
          user_id: requestData.user_id.toString(),
          token: requestData.token,
          expires_at: requestData.expires_at,
          used: requestData.used || false
        });
      }
      console.log(`✓ 插入了 ${dbData.passwordChangeRequests.length} 条PasswordChangeRequest记录`);
    }

    console.log('\n🎉 数据库初始化完成！');
    console.log('所有表已创建，初始数据已插入。');

  } catch (error) {
    console.error('数据库初始化失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createTablesFromJson();
}

module.exports = createTablesFromJson;