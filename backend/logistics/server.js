require("dotenv").config();
const express = require("express");
const sequelize = require("./config/database");
const logisticsRoutes = require("./routes/logisticsRoutes");

// Import semua model agar Sequelize tahu tabel yang perlu di-sync
require("./models/Shipment");
require("./models/TrackingLog");
require("./models/WebhookSubscriber");

const app = express();
const PORT = process.env.PORT || 8006;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ service: "logistics", status: "ok", port: PORT });
});

app.use("/", logisticsRoutes);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    // sync({ alter: true }) → update tabel yang sudah ada tanpa hapus data
    await sequelize.sync({ alter: true });
    console.log("Logistics DB connected and tables synced");

    app.listen(PORT, () => {
      console.log(`Logistics service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("DB connection error:", error);
    process.exit(1);
  }
};

startServer();
