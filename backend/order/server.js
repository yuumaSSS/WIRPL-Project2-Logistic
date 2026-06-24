require("dotenv").config();
const express = require("express");
const sequelize = require("./config/database");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
const PORT = process.env.PORT || 8004;

app.use(express.json());
app.use("/", orderRoutes);

sequelize
  .sync()
  .then(() => console.log("Order DB connected"))
  .catch((err) => console.error("DB connection error:", err));

app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
});
