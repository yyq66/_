const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const ensureUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/avatars');
    ensureUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

// 文件过滤器 - 只允许图片
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('头像只支持 JPEG, PNG, GIF, WebP 格式的图片'), false);
  }
};

// 创建multer实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB 限制
    files: 1
  },
  fileFilter: fileFilter
});

// 删除旧头像的工具函数
const deleteOldAvatar = (avatarPath) => {
  return new Promise((resolve) => {
    if (!avatarPath) {
      resolve();
      return;
    }
    
    const filename = path.basename(avatarPath);
    const fullPath = path.join(__dirname, '../uploads/avatars', filename);
    
    fs.unlink(fullPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.warn('删除旧头像失败:', err);
      }
      resolve();
    });
  });
};

module.exports = {
  avatarUpload: upload.single('avatar'),
  deleteOldAvatar
};