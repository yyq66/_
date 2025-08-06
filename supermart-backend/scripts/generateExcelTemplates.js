const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

function generateExcelTemplates() {
  try {
    // 创建模板目录
    const templatesDir = path.join(__dirname, '../uploads/templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    // 入库模板
    const inboundTemplate = [
      {
        'SKU': 'IP15P001',
        '入库数量': 10,
        '单位成本': 7500.00,
        '批次号': 'BATCH001',
        '供应商': '苹果官方',
        '备注': '补充库存'
      },
      {
        'SKU': 'MBA001',
        '入库数量': 5,
        '单位成本': 8000.00,
        '批次号': 'BATCH002',
        '供应商': '苹果官方',
        '备注': '新品入库'
      }
    ];

    // 出库模板
    const outboundTemplate = [
      {
        'SKU': 'IP15P001',
        '出库数量': 5,
        '备注': '销售出库'
      },
      {
        'SKU': 'APP2001',
        '出库数量': 3,
        '备注': '促销活动'
      }
    ];

    // 创建入库模板工作簿
    const inboundWB = XLSX.utils.book_new();
    const inboundWS = XLSX.utils.json_to_sheet(inboundTemplate);
    XLSX.utils.book_append_sheet(inboundWB, inboundWS, '入库模板');
    XLSX.writeFile(inboundWB, path.join(templatesDir, '批量入库模板.xlsx'));

    // 创建出库模板工作簿
    const outboundWB = XLSX.utils.book_new();
    const outboundWS = XLSX.utils.json_to_sheet(outboundTemplate);
    XLSX.utils.book_append_sheet(outboundWB, outboundWS, '出库模板');
    XLSX.writeFile(outboundWB, path.join(templatesDir, '批量出库模板.xlsx'));

    console.log('Excel模板生成完成:');
    console.log('- 批量入库模板.xlsx');
    console.log('- 批量出库模板.xlsx');
    console.log('模板位置:', templatesDir);

  } catch (error) {
    console.error('生成Excel模板失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  generateExcelTemplates();
}

module.exports = generateExcelTemplates;