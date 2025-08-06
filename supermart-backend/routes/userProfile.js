const express = require('express');
const router = express.Router();
const { User, Auth } = require('../models');
const authMiddleware = require('../middleware/auth');
const { avatarUpload, deleteOldAvatar } = require('../middleware/upload');
const bcrypt = require('bcryptjs');
const multer = require('multer');

// 获取当前用户资料
router.get('/userInfo', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.user.id },
      attributes: {
        exclude: ['created_at', 'updated_at']
      }
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户资料不存在'
      });
    }

    res.json({
      code: 200,
      data: user
    });
  } catch (error) {
    console.error('获取用户资料失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户资料失败'
    });
  }
});

// 更新用户资料
router.put('/userInfo', authMiddleware, async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      department, 
      bio, 
      two_factor_enabled, 
      email_notifications, 
      sms_notifications 
    } = req.body;

    // 构建更新对象，只包含提供的字段
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (department !== undefined) updateData.department = department;
    if (bio !== undefined) updateData.bio = bio;
    if (two_factor_enabled !== undefined) updateData.two_factor_enabled = two_factor_enabled;
    if (email_notifications !== undefined) updateData.email_notifications = email_notifications;
    if (sms_notifications !== undefined) updateData.sms_notifications = sms_notifications;

    // 检查是否有数据需要更新
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        code: 400,
        message: '没有提供需要更新的数据'
      });
    }

    // 如果更新邮箱，检查邮箱是否已存在
    if (email) {
      const existingUser = await User.findOne({
        where: { 
          email,
          id: { [require('sequelize').Op.ne]: req.user.id }
        }
      });
      
      if (existingUser) {
        return res.status(400).json({
          code: 400,
          message: '该邮箱已被其他用户使用'
        });
      }
    }

    await User.update(
      updateData,
      { where: { id: req.user.id } }
    );

    res.json({
      code: 200,
      message: '用户资料更新成功'
    });
  } catch (error) {
    console.error('更新用户资料失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新用户资料失败'
    });
  }
});

// 配置上传路径和文件名
const storage = multer.diskStorage({
  destination: 'uploads/avatars', // 头像保存路径
  filename: (req, file, cb) => {
    console.log("file:",file)
    cb(null, Date.now() + '-' + file.originalname); // 避免重名
  },
});

const upload = multer({ storage });

// 上传头像
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    console.log("req:",req)
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请选择要上传的头像文件'
      });
    }

    // 获取用户当前头像
    const user = await User.findByPk(req.user.id);
    console.log("user.id:",user.id)
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    const oldAvatar = user.avatar;
    // console.log(`http://localhost:${process.env.PORT}`)
    const avatarUrl = `http://localhost:${process.env.PORT}/uploads/avatars/${req.file.filename}`;

    // 更新用户头像URL
    await User.update(
      { avatar: avatarUrl },
      { where: { id: req.user.id } }
    );

    // 删除旧头像（异步执行）
    // if (oldAvatar) {
    //   deleteOldAvatar(oldAvatar).catch(err => {
    //     console.error('删除旧头像失败:', err);
    //   });
    // }

    res.json({
      code: 200,
      message: '头像上传成功',
      data: {
        avatar: avatarUrl,
        fileInfo: {
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      }
    });
  } catch (error) {
    console.error('头像上传错误:', error);
    
    // 如果是multer错误，提供更友好的错误信息
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        code: 400,
        message: '头像文件大小超过限制（最大2MB）'
      });
    }
    
    if (error.message && error.message.includes('头像只支持')) {
      return res.status(400).json({
        code: 400,
        message: error.message
      });
    }
    
    res.status(500).json({
      code: 500,
      message: '头像上传失败'
    });
  }
});

// 修改密码
router.patch('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 验证输入
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        code: 400,
        message: '请提供当前密码和新密码'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        code: 400,
        message: '新密码长度不能少于6位'
      });
    }

    // 验证当前密码
    const authRecord = await Auth.findOne({
      where: { user_id: req.user.id }
    });

    if (!authRecord) {
      return res.status(404).json({
        code: 404,
        message: '用户认证信息不存在'
      });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, authRecord.password);
    if (!isValidPassword) {
      return res.status(400).json({
        code: 400,
        message: '当前密码错误'
      });
    }

    // 更新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await Auth.update(
      { password: hashedNewPassword },
      { where: { user_id: req.user.id } }
    );

    res.json({
      code: 200,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      code: 500,
      message: '修改密码失败'
    });
  }
});

// 切换双因子认证
router.patch('/toggle-two-factor', authMiddleware, async (req, res) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        code: 400,
        message: '请提供有效的启用状态（true/false）'
      });
    }

    await User.update(
      { two_factor_enabled: enabled },
      { where: { id: req.user.id } }
    );

    res.json({
      code: 200,
      message: `双因子认证已${enabled ? '启用' : '禁用'}`
    });
  } catch (error) {
    console.error('更新双因子认证设置失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新双因子认证设置失败'
    });
  }
});

// 更新通知设置
router.patch('/notification-settings', authMiddleware, async (req, res) => {
  try {
    const { emailNotifications, smsNotifications } = req.body;

    // 验证输入
    if (typeof emailNotifications !== 'boolean' || typeof smsNotifications !== 'boolean') {
      return res.status(400).json({
        code: 400,
        message: '请提供有效的通知设置（true/false）'
      });
    }

    await User.update(
      { 
        email_notifications: emailNotifications,
        sms_notifications: smsNotifications 
      },
      { where: { id: req.user.id } }
    );

    res.json({
      code: 200,
      message: '通知设置更新成功'
    });
  } catch (error) {
    console.error('更新通知设置失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新通知设置失败'
    });
  }
});

module.exports = router;