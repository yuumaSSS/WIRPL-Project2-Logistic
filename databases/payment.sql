CREATE DATABASE IF NOT EXISTS wirpl_payment_db;
USE wirpl_payment_db;

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  method ENUM('bank_transfer', 'ewallet', 'cod', 'credit_card') NOT NULL,
  status ENUM('pending', 'paid', 'failed', 'expired', 'refunded') NOT NULL DEFAULT 'pending',
  paidAt DATETIME NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

CREATE INDEX idx_payments_orderId ON payments (orderId);
CREATE INDEX idx_payments_status ON payments (status);
