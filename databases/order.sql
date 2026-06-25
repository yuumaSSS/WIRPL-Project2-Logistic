CREATE DATABASE IF NOT EXISTS wirpl_order_db;
USE wirpl_order_db;

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  items JSON NOT NULL,
  shippingAddress JSON NOT NULL,
  totalPrice DECIMAL(10, 2) NOT NULL,
  status ENUM(
    'pending',
    'waiting_payment',
    'paid',
    'processing',
    'shipped',
    'completed',
    'cancelled'
  ) NOT NULL DEFAULT 'pending',
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

CREATE INDEX idx_orders_userId ON orders (userId);
CREATE INDEX idx_orders_status ON orders (status);
