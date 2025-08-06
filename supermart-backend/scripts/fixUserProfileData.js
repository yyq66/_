const { sequelize, User, UserProfile } = require('../models');
const { v4: uuidv4 } = require('uuid');

async function fixUserProfileData() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 1. 先同步表结构（添加user_id字段但不加约束）
    await sequelize.sync({ alter: true });
    console.log('表结构同步完成');

    // 2. 查找所有user_profiles记录
    const profiles = await UserProfile.findAll();
    console.log(`找到 ${profiles.length} 条用户档案记录`);

    // 3. 为每个profile设置user_id
    for (const profile of profiles) {
      if (!profile.user_id) {
        // 尝试通过email匹配用户
        const user = await User.findOne({ where: { email: profile.email } });
        
        if (user) {
          // 找到匹配用户，设置user_id
          await profile.update({ user_id: user.id });
          console.log(`为档案 ${profile.id} 设置user_id: ${user.id}`);
        } else {
          // 没找到匹配用户，创建新用户
          const newUser = await User.create({
            id: uuidv4(),
            name: profile.name,
            email: profile.email,
            role: profile.role || 'employee',
            status: profile.status || 'active'
          });
          
          await profile.update({ user_id: newUser.id });
          console.log(`为档案 ${profile.id} 创建新用户并设置user_id: ${newUser.id}`);
        }
      }
    }

    // 4. 检查数据一致性
    const invalidProfiles = await sequelize.query(`
      SELECT up.id, up.user_id 
      FROM user_profiles up 
      LEFT JOIN users u ON up.user_id = u.id 
      WHERE u.id IS NULL
    `, { type: sequelize.QueryTypes.SELECT });

    if (invalidProfiles.length > 0) {
      console.log('发现无效的user_id引用：', invalidProfiles);
      // 删除或修复这些记录
      for (const profile of invalidProfiles) {
        await UserProfile.destroy({ where: { id: profile.id } });
        console.log(`删除无效档案记录: ${profile.id}`);
      }
    }

    console.log('数据修复完成');
  } catch (error) {
    console.error('数据修复失败:', error);
  } finally {
    await sequelize.close();
  }
}

fixUserProfileData();