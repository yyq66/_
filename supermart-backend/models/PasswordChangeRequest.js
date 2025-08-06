const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PasswordChangeRequest = sequelize.define('PasswordChangeRequest', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.STRING(36),
    allowNull: false
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'password_change_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = PasswordChangeRequest;