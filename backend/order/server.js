require("dotenv").config();
const express = require("express");
const sequelize = require("./config/database");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
const PORT = process.env.PORT || 8004;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ service: "order", status: "ok" });
});

app.use("/", orderRoutes);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Order DB connected");

    app.listen(PORT, () => {
      console.log(`Order service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("DB connection error:", error);
    process.exit(1);
  }
};

startServer();
