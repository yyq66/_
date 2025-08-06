const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanIndexes() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME || 'supermart_admin'
    });

    console.log('开始清理重复索引...');
    
    // 查看当前索引
    const [indexes] = await connection.execute(`
      SELECT 
        TABLE_NAME,
        INDEX_NAME,
        COLUMN_NAME,
        NON_UNIQUE
      FROM 
        INFORMATION_SCHEMA.STATISTICS 
      WHERE 
        TABLE_SCHEMA = ? 
        AND TABLE_NAME IN ('products', 'auth', 'users', 'orders')
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
    `, [process.env.DB_NAME || 'supermart_admin']);
    
    console.log('当前索引情况:', indexes);
    
    // 删除重复的索引（根据实际情况调整）
    const indexesToDrop = [
      'DROP INDEX IF EXISTS idx_created_at ON products',
      'DROP INDEX IF EXISTS idx_updated_at ON products',
      'DROP INDEX IF EXISTS sku_2 ON products',
      'DROP INDEX IF EXISTS sku_3 ON products'
    ];
    
    for (const sql of indexesToDrop) {
      try {
        await connection.execute(sql);
        console.log('执行成功:', sql);
      } catch (error) {
        console.log('跳过（索引不存在）:', sql);
      }
    }
    
    console.log('索引清理完成');
    
  } catch (error) {
    console.error('清理索引失败:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

cleanIndexes();