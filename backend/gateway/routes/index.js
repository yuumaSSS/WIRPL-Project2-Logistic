const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const router = express.Router();

const serviceTargets = {
  auth: process.env.AUTH_SERVICE_URL || "http://localhost:8001",
  products: process.env.PRODUCT_SERVICE_URL || "http://localhost:8002",
  suppliers: process.env.SUPPLIER_SERVICE_URL || "http://localhost:8003",
  orders: process.env.ORDER_SERVICE_URL || "http://localhost:8004",
  payments: process.env.PAYMENT_SERVICE_URL || "http://localhost:8005",
  logistics: process.env.LOGISTICS_SERVICE_URL || "http://localhost:8006",
};

const services = {
  "/auth": serviceTargets.auth,
  "/api/auth": serviceTargets.auth,
  "/products": serviceTargets.products,
  "/api/products": serviceTargets.products,
  "/suppliers": serviceTargets.suppliers,
  "/api/suppliers": serviceTargets.suppliers,
  "/orders": serviceTargets.orders,
  "/api/orders": serviceTargets.orders,
  "/payments": serviceTargets.payments,
  "/api/payments": serviceTargets.payments,
  "/logistics": serviceTargets.logistics,
  "/api/logistics": serviceTargets.logistics,
};

const requestJson = async (url, options = {}) => {
  if (typeof fetch !== "function") {
    throw new Error("Global fetch is not available. Please use Node.js 18 or newer.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

const normalizeAddress = (shippingAddress) => {
  if (!shippingAddress) {
    return {
      recipientName: "Customer",
      phone: null,
      address: "",
    };
  }

  if (typeof shippingAddress === "string") {
    return {
      recipientName: "Customer",
      phone: null,
      address: shippingAddress,
    };
  }

  return {
    recipientName: shippingAddress.recipientName || shippingAddress.name || "Customer",
    phone: shippingAddress.phone || null,
    address: shippingAddress.address || shippingAddress.fullAddress || "",
  };
};

router.get("/health", (req, res) => {
  res.json({
    service: "gateway",
    status: "ok",
    services: serviceTargets,
  });
});

router.post(["/checkout", "/api/checkout"], express.json(), async (req, res) => {
  const created = {};

  try {
    const {
      userId,
      items,
      shippingAddress,
      paymentMethod = "bank_transfer",
      paymentStatus = "paid",
      courier = "WIRPL Express",
      service = "regular",
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items must be a non-empty array" });
    }

    const normalizedAddress = normalizeAddress(shippingAddress);

    if (!normalizedAddress.address) {
      return res.status(400).json({
        message: "shippingAddress must contain address or fullAddress",
      });
    }

    const orderPayload = await requestJson(`${serviceTargets.orders}/`, {
      method: "POST",
      body: JSON.stringify({
        userId,
        items,
        shippingAddress: {
          recipientName: normalizedAddress.recipientName,
          phone: normalizedAddress.phone,
          address: normalizedAddress.address,
        },
      }),
    });
    created.order = orderPayload.data;

    const paymentPayload = await requestJson(`${serviceTargets.payments}/`, {
      method: "POST",
      body: JSON.stringify({
        orderId: created.order.id,
        amount: created.order.totalPrice,
        method: paymentMethod,
        status: paymentStatus,
      }),
    });
    created.payment = paymentPayload.data;

    const orderStatus = created.payment.status === "paid" ? "processing" : "waiting_payment";
    const updatedOrderPayload = await requestJson(`${serviceTargets.orders}/${created.order.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: orderStatus }),
    });
    created.order = updatedOrderPayload.data;

    const shipmentPayload = await requestJson(`${serviceTargets.logistics}/`, {
      method: "POST",
      body: JSON.stringify({
        orderId: created.order.id,
        recipientName: normalizedAddress.recipientName,
        phone: normalizedAddress.phone,
        address: normalizedAddress.address,
        courier,
        service,
      }),
    });
    created.shipment = shipmentPayload.data;

    return res.status(201).json({
      message: "Checkout completed",
      data: created,
    });
  } catch (error) {
    console.error(error);

    return res.status(error.status || 502).json({
      message: "Checkout flow failed",
      error: error.payload || { message: error.message },
      data: created,
    });
  }
});

Object.entries(services).forEach(([path, target]) => {
  router.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      on: {
        error: (err, req, res) => {
          console.error(`Proxy error for ${path}:`, err.message);

          if (!res.headersSent) {
            res.status(502).json({
              message: "Service unavailable",
              service: path,
            });
          }
        },
      },
    })
  );
});

module.exports = router;
