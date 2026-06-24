require("dotenv").config();
const express = require("express");
const sequelize = require("./config/database");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 8001;

app.use(express.json());
app.use("/", authRoutes);

sequelize
  .sync()
  .then(() => console.log("Auth DB connected"))
  .catch((err) => console.error("DB connection error:", err));

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
