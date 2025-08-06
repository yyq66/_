const { sequelize } = require('../models');

async function cleanDuplicateTables() {
  try {
    // 删除重复的表
    await sequelize.query('DROP TABLE IF EXISTS product_management;');
    await sequelize.query('DROP TABLE IF EXISTS inventory_management;');
    await sequelize.query('DROP TABLE IF EXISTS user_profiles;');
    
    console.log('重复表清理完成');
  } catch (error) {
    console.error('清理重复表失败:', error);
  }
}

cleanDuplicateTables();