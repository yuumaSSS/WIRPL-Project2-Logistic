CREATE DATABASE IF NOT EXISTS wirpl_logistics_db;
USE wirpl_logistics_db;

CREATE TABLE IF NOT EXISTS shipments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  resi VARCHAR(255) NOT NULL UNIQUE,
  recipientName VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NULL,
  address TEXT NOT NULL,
  courier VARCHAR(255) NOT NULL DEFAULT 'WIRPL Express',
  service VARCHAR(255) NOT NULL DEFAULT 'regular',
  status ENUM(
    'processing',
    'picked_up',
    'in_transit',
    'delivered',
    'returned',
    'cancelled'
  ) NOT NULL DEFAULT 'processing',
  estimasi DATETIME NULL,
  shippedAt DATETIME NULL,
  deliveredAt DATETIME NULL,
  notes TEXT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

CREATE INDEX idx_shipments_orderId ON shipments (orderId);
CREATE INDEX idx_shipments_status ON shipments (status);
