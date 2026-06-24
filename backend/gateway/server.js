require("dotenv").config();
const express = require("express");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 8000;

app.use("/", routes);

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});
