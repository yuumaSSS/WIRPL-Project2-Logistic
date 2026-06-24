require("dotenv").config();
const express = require("express");
const sequelize = require("./config/database");
const supplierRoutes = require("./routes/supplierRoutes");

const app = express();
const PORT = process.env.PORT || 8003;

app.use(express.json());
app.use("/", supplierRoutes);

sequelize
  .sync()
  .then(() => console.log("Supplier DB connected"))
  .catch((err) => console.error("DB connection error:", err));

app.listen(PORT, () => {
  console.log(`Supplier service running on port ${PORT}`);
});
