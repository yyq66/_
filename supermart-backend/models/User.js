const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    allowNull: false
  },
  // 基础信息
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'employee'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'active'
  },
  // 详细档案信息
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  avatar: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  join_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'joinDate'
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // 登录相关
  last_login_time: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'lastLoginTime'
  },
  login_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'login_count'
  },
  // 设置选项
  two_factor_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'twoFactorEnabled'
  },
  email_notifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'emailNotifications'
  },
  sms_notifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'smsNotifications'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = User;