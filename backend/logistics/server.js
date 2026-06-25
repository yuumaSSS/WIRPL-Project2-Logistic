require("dotenv").config();
const express = require("express");
const sequelize = require("./config/database");
const logisticsRoutes = require("./routes/logisticsRoutes");

const app = express();
const PORT = process.env.PORT || 8006;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ service: "logistics", status: "ok" });
});

app.use("/", logisticsRoutes);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Logistics DB connected");

    app.listen(PORT, () => {
      console.log(`Logistics service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("DB connection error:", error);
    process.exit(1);
  }
};

startServer();
