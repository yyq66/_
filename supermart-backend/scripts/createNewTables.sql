-- 商品管理表
CREATE TABLE product_management (
  id VARCHAR(36) PRIMARY KEY,
  productId VARCHAR(36) NOT NULL,
  operationType ENUM('create', 'update', 'delete', 'status_change', 'price_change') NOT NULL,
  operatorId VARCHAR(36) NOT NULL,
  operatorName VARCHAR(100) NOT NULL,
  beforeData JSON,
  afterData JSON,
  changeFields JSON,
  reason TEXT,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  operationTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
);

-- 库存管理表
CREATE TABLE inventory_management (
  id VARCHAR(36) PRIMARY KEY,
  productId VARCHAR(36) NOT NULL,
  operationType ENUM('in', 'out', 'transfer', 'adjust', 'check') NOT NULL,
  quantity INT NOT NULL,
  beforeStock INT NOT NULL,
  afterStock INT NOT NULL,
  unitCost DECIMAL(10,2),
  totalCost DECIMAL(12,2),
  warehouseId VARCHAR(36),
  warehouseName VARCHAR(100),
  supplierId VARCHAR(36),
  supplierName VARCHAR(200),
  batchNumber VARCHAR(100),
  expiryDate DATE,
  operatorId VARCHAR(36) NOT NULL,
  operatorName VARCHAR(100) NOT NULL,
  reason TEXT,
  relatedOrderId VARCHAR(36),
  status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'completed',
  operationTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_product_management_product_id ON product_management(productId);
CREATE INDEX idx_product_management_operation_time ON product_management(operationTime);
CREATE INDEX idx_product_management_operator ON product_management(operatorId);

CREATE INDEX idx_inventory_management_product_id ON inventory_management(productId);
CREATE INDEX idx_inventory_management_operation_time ON inventory_management(operationTime);
CREATE INDEX idx_inventory_management_operator ON inventory_management(operatorId);
CREATE INDEX idx_inventory_management_operation_type ON inventory_management(operationType);