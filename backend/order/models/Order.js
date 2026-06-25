const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Order = sequelize.define("Order", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  shippingAddress: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "waiting_payment", "paid", "processing", "shipped", "completed", "cancelled"),
    defaultValue: "pending",
  },
}, {
  tableName: "orders",
});

module.exports = Order;
