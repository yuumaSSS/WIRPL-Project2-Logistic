require("dotenv").config();
const express = require("express");
const sequelize = require("./config/database");
const logisticsRoutes = require("./routes/logisticsRoutes");

const app = express();
const PORT = process.env.PORT || 8006;

app.use(express.json());
app.use("/", logisticsRoutes);

sequelize
  .sync()
  .then(() => console.log("Logistics DB connected"))
  .catch((err) => console.error("DB connection error:", err));

app.listen(PORT, () => {
  console.log(`Logistics service running on port ${PORT}`);
});
