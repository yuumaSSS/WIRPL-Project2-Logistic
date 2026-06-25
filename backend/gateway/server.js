require("dotenv").config();
const express = require("express");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 8000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

app.use("/", routes);

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});
