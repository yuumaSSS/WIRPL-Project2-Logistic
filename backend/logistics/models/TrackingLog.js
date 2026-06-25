const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Menyimpan histori setiap perubahan status pengiriman
const TrackingLog = sequelize.define(
  "TrackingLog",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    shipmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "FK ke tabel shipments",
    },
    resi: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Nomor resi pengiriman (redundan untuk query cepat tanpa join)",
    },
    status: {
      type: DataTypes.ENUM(
        "processing",
        "picked_up",
        "in_transit",
        "delivered",
        "returned",
        "cancelled"
      ),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Keterangan tambahan perubahan status, e.g. lokasi kurir",
    },
    changedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: "Waktu perubahan status dicatat",
    },
  },
  {
    tableName: "tracking_logs",
    timestamps: false, // pakai changedAt manual supaya lebih eksplisit
  }
);

module.exports = TrackingLog;
