require("dotenv").config();
const express = require("express");
const sequelize = require("./config/database");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
const PORT = process.env.PORT || 8005;

app.use(express.json());
app.use("/", paymentRoutes);

sequelize
  .sync()
  .then(() => console.log("Payment DB connected"))
  .catch((err) => console.error("DB connection error:", err));

app.listen(PORT, () => {
  console.log(`Payment service running on port ${PORT}`);
});
