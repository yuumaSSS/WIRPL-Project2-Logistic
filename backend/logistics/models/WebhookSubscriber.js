const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Menyimpan data mitra e-commerce yang berlangganan notifikasi webhook
const WebhookSubscriber = sequelize.define(
  "WebhookSubscriber",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Nama perusahaan e-commerce mitra",
    },
    callbackUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "URL endpoint e-commerce yang akan dikirim notifikasi POST",
    },
    apiKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: "API key unik yang diberikan ke mitra untuk autentikasi",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Aktif/nonaktif pengiriman webhook ke mitra ini",
    },
  },
  {
    tableName: "webhook_subscribers",
    timestamps: true,
  }
);

module.exports = WebhookSubscriber;
