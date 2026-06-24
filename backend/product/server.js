require("dotenv").config();
const express = require("express");
const sequelize = require("./config/database");
const productRoutes = require("./routes/productRoutes");

const app = express();
const PORT = process.env.PORT || 8002;

app.use(express.json());
app.use("/", productRoutes);

sequelize
  .sync()
  .then(() => console.log("Product DB connected"))
  .catch((err) => console.error("DB connection error:", err));

app.listen(PORT, () => {
  console.log(`Product service running on port ${PORT}`);
});
