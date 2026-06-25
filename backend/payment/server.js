require("dotenv").config();
const express = require("express");
const sequelize = require("./config/database");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
const PORT = process.env.PORT || 8005;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ service: "payment", status: "ok" });
});

app.use("/", paymentRoutes);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Payment DB connected");

    app.listen(PORT, () => {
      console.log(`Payment service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("DB connection error:", error);
    process.exit(1);
  }
};

startServer();
