const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Auth = sequelize.define('Auth', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  user_id: {
    type: DataTypes.STRING(36),
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  }
  // 移除冗余字段：user_name, user_email, user_role
}, {
  tableName: 'auth',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Auth;