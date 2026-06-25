const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Payment = sequelize.define("Payment", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  method: {
    type: DataTypes.ENUM("bank_transfer", "ewallet", "cod", "credit_card"),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "paid", "failed", "expired", "refunded"),
    defaultValue: "pending",
  },
  paidAt: {
    type: DataTypes.DATE,
  },
}, {
  tableName: "payments",
});

module.exports = Payment;
