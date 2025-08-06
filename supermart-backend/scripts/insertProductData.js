const { sequelize, Product } = require('../models');
const { v4: uuidv4 } = require('uuid');

async function insertProductData() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 商品测试数据
    const productData = [
      {
        id: uuidv4(),
        name: 'iPhone 15 Pro Max',
        sku: 'APPLE-IP15PM-256GB',
        category: '手机数码',
        brand: 'Apple',
        price: 9999.00,
        stock: 50,
        minStock: 10,
        supplier: '苹果官方授权经销商',
        status: 'active',
        description: 'Apple iPhone 15 Pro Max，256GB存储，钛金属材质，A17 Pro芯片，支持5G网络',
        image: '/images/products/iphone15promax.jpg',
        sales: 125,
        createTime: new Date('2023-09-15'),
        updateTime: new Date()
      },
      {
        id: uuidv4(),
        name: '华为Mate 60 Pro',
        sku: 'HUAWEI-M60P-512GB',
        category: '手机数码',
        brand: '华为',
        price: 6999.00,
        stock: 30,
        minStock: 8,
        supplier: '华为官方旗舰店',
        status: 'active',
        description: '华为Mate 60 Pro，512GB存储，麒麟9000S芯片，支持卫星通话',
        image: '/images/products/mate60pro.jpg',
        sales: 89,
        createTime: new Date('2023-08-29'),
        updateTime: new Date()
      },
      {
        id: uuidv4(),
        name: '小米13 Ultra',
        sku: 'XIAOMI-13U-256GB',
        category: '手机数码',
        brand: '小米',
        price: 5999.00,
        stock: 25,
        minStock: 5,
        supplier: '小米科技有限公司',
        status: 'active',
        description: '小米13 Ultra，256GB存储，骁龙8 Gen2芯片，徕卡影像系统',
        image: '/images/products/mi13ultra.jpg',
        sales: 67,
        createTime: new Date('2023-04-18'),
        updateTime: new Date()
      },
      {
        id: uuidv4(),
        name: 'MacBook Pro 14英寸',
        sku: 'APPLE-MBP14-M3-512GB',
        category: '电脑办公',
        brand: 'Apple',
        price: 15999.00,
        stock: 15,
        minStock: 3,
        supplier: '苹果官方授权经销商',
        status: 'active',
        description: 'MacBook Pro 14英寸，M3芯片，512GB SSD，16GB内存，Liquid Retina XDR显示屏',
        image: '/images/products/macbookpro14.jpg',
        sales: 43,
        createTime: new Date('2023-10-30'),
        updateTime: new Date()
      },
      {
        id: uuidv4(),
        name: '联想ThinkPad X1 Carbon',
        sku: 'LENOVO-X1C-I7-1TB',
        category: '电脑办公',
        brand: '联想',
        price: 12999.00,
        stock: 20,
        minStock: 5,
        supplier: '联想官方旗舰店',
        status: 'active',
        description: '联想ThinkPad X1 Carbon，Intel i7处理器，1TB SSD，16GB内存，14英寸2K屏',
        image: '/images/products/thinkpadx1.jpg',
        sales: 32,
        createTime: new Date('2023-06-12'),
        updateTime: new Date()
      },
      {
        id: uuidv4(),
        name: 'AirPods Pro 2代',
        sku: 'APPLE-APP2-USB-C',
        category: '数码配件',
        brand: 'Apple',
        price: 1899.00,
        stock: 80,
        minStock: 20,
        supplier: '苹果官方授权经销商',
        status: 'active',
        description: 'AirPods Pro 2代，主动降噪，USB-C充电盒，空间音频',
        image: '/images/products/airpodspro2.jpg',
        sales: 156,
        createTime: new Date('2023-09-12'),
        updateTime: new Date()
      },
      {
        id: uuidv4(),
        name: '索尼WH-1000XM5',
        sku: 'SONY-WH1000XM5-BLACK',
        category: '数码配件',
        brand: '索尼',
        price: 2399.00,
        stock: 35,
        minStock: 8,
        supplier: '索尼官方旗舰店',
        status: 'active',
        description: '索尼WH-1000XM5无线降噪耳机，30小时续航，Hi-Res音质',
        image: '/images/products/sonywh1000xm5.jpg',
        sales: 78,
        createTime: new Date('2023-05-20'),
        updateTime: new Date()
      },
      {
        id: uuidv4(),
        name: 'iPad Air 5代',
        sku: 'APPLE-IPAD-AIR5-256GB',
        category: '平板电脑',
        brand: 'Apple',
        price: 5399.00,
        stock: 40,
        minStock: 10,
        supplier: '苹果官方授权经销商',
        status: 'active',
        description: 'iPad Air 5代，M1芯片，256GB存储，10.9英寸Liquid Retina显示屏',
        image: '/images/products/ipadair5.jpg',
        sales: 94,
        createTime: new Date('2023-03-18'),
        updateTime: new Date()
      },
      {
        id: uuidv4(),
        name: '小米平板6 Pro',
        sku: 'XIAOMI-PAD6P-512GB',
        category: '平板电脑',
        brand: '小米',
        price: 2999.00,
        stock: 28,
        minStock: 6,
        supplier: '小米科技有限公司',
        status: 'active',
        description: '小米平板6 Pro，骁龙8+ Gen1芯片，512GB存储，11英寸2.8K屏',
        image: '/images/products/mipad6pro.jpg',
        sales: 52,
        createTime: new Date('2023-04-27'),
        updateTime: new Date()
      },
      {
        id: uuidv4(),
        name: '罗技MX Master 3S',
        sku: 'LOGITECH-MXM3S-GRAY',
        category: '数码配件',
        brand: '罗技',
        price: 699.00,
        stock: 60,
        minStock: 15,
        supplier: '罗技官方旗舰店',
        status: 'active',
        description: '罗技MX Master 3S无线鼠标，8000DPI，70天续航，静音点击',
        image: '/images/products/mxmaster3s.jpg',
        sales: 134,
        createTime: new Date('2023-07-08'),
        updateTime: new Date()
      },
      {
        id: uuidv4(),
        name: '戴尔U2723QE显示器',
        sku: 'DELL-U2723QE-27-4K',
        category: '电脑办公',
        brand: '戴尔',
        price: 3299.00,
        stock: 12,
        minStock: 3,
        supplier: '戴尔官方旗舰店',
        status: 'active',
        description: '戴尔U2723QE 27英寸4K显示器，IPS面板，USB-C一线连，色彩准确',
        image: '/images/products/dellu2723qe.jpg',
        sales: 28,
        createTime: new Date('2023-08-15'),
        updateTime: new Date()
      },
      {
        id: uuidv4(),
        name: '任天堂Switch OLED',
        sku: 'NINTENDO-SW-OLED-WHITE',
        category: '游戏设备',
        brand: '任天堂',
        price: 2599.00,
        stock: 8,
        minStock: 2,
        supplier: '任天堂官方授权店',
        status: 'out_of_stock',
        description: '任天堂Switch OLED版，7英寸OLED屏幕，64GB存储，白色款',
        image: '/images/products/switcholed.jpg',
        sales: 186,
        createTime: new Date('2023-02-14'),
        updateTime: new Date()
      }
    ];

    // 插入商品数据
    console.log('开始插入商品数据...');
    let successCount = 0;
    let skipCount = 0;
    
    for (const product of productData) {
      try {
        // 检查SKU是否已存在
        const existingProduct = await Product.findOne({ where: { sku: product.sku } });
        if (existingProduct) {
          console.log(`商品SKU ${product.sku} 已存在，跳过`);
          skipCount++;
          continue;
        }
        
        const newProduct = await Product.create(product);
        console.log(`商品 ${newProduct.name} 创建成功`);
        successCount++;
      } catch (error) {
        console.error(`创建商品 ${product.name} 失败:`, error.message);
      }
    }

    console.log('\n数据插入完成！');
    console.log(`成功插入: ${successCount} 条`);
    console.log(`跳过重复: ${skipCount} 条`);
    console.log('\n插入的商品类别包括：');
    console.log('- 手机数码: iPhone 15 Pro Max, 华为Mate 60 Pro, 小米13 Ultra');
    console.log('- 电脑办公: MacBook Pro 14英寸, 联想ThinkPad X1 Carbon, 戴尔显示器');
    console.log('- 数码配件: AirPods Pro 2代, 索尼耳机, 罗技鼠标');
    console.log('- 平板电脑: iPad Air 5代, 小米平板6 Pro');
    console.log('- 游戏设备: 任天堂Switch OLED (缺货状态)');
    
  } catch (error) {
    console.error('插入数据时发生错误:', error);
  } finally {
    await sequelize.close();
    console.log('数据库连接已关闭');
  }
}

// 运行脚本
if (require.main === module) {
  insertProductData();
}

module.exports = insertProductData;