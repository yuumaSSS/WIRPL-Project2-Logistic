const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const router = express.Router();

const services = {
  "/auth": "http://localhost:8001",
  "/products": "http://localhost:8002",
  "/suppliers": "http://localhost:8003",
  "/orders": "http://localhost:8004",
  "/payments": "http://localhost:8005",
  "/logistics": "http://localhost:8006",
};

Object.entries(services).forEach(([path, target]) => {
  router.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
    })
  );
});

module.exports = router;
