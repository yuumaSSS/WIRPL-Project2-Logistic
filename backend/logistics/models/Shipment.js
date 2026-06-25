const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Shipment = sequelize.define("Shipment", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  resi: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  recipientName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  courier: {
    type: DataTypes.STRING,
    defaultValue: "WIRPL Express",
  },
  service: {
    type: DataTypes.STRING,
    defaultValue: "regular",
  },
  status: {
    type: DataTypes.ENUM("processing", "picked_up", "in_transit", "delivered", "returned", "cancelled"),
    defaultValue: "processing",
  },
  estimasi: {
    type: DataTypes.DATE,
  },
  shippedAt: {
    type: DataTypes.DATE,
  },
  deliveredAt: {
    type: DataTypes.DATE,
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: "shipments",
});

module.exports = Shipment;
