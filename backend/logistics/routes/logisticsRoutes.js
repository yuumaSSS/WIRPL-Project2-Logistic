const express = require("express");
const router = express.Router();
const verifyApiKey = require("../middleware/verifyApiKey");
const ctrl = require("../controllers/logisticsController");

// ─── Shipment Routes ──────────────────────────────────────────────────────────

// POST /          → buat pengiriman baru (wajib sertakan x-api-key di header)
router.post("/", verifyApiKey, ctrl.create);

// GET /track/:resi         → cek status terkini berdasarkan nomor resi (publik)
router.get("/track/:resi", ctrl.trackByResi);

// GET /track/:resi/history → histori lengkap perubahan status (publik)
router.get("/track/:resi/history", ctrl.trackHistoryByResi);

// GET /order/:orderId      → semua pengiriman milik suatu order
router.get("/order/:orderId", ctrl.getByOrderId);

// PATCH /:id/status        → update status pengiriman
router.patch("/:id/status", ctrl.updateStatus);

// ─── Webhook Routes ───────────────────────────────────────────────────────────

// POST /webhooks/register  → daftarkan mitra e-commerce, dapatkan apiKey
router.post("/webhooks/register", ctrl.registerWebhook);

// GET /webhooks            → daftar semua subscriber webhook
router.get("/webhooks", ctrl.listWebhooks);

// PATCH /webhooks/:id/toggle → aktifkan/nonaktifkan subscriber
router.patch("/webhooks/:id/toggle", ctrl.toggleWebhook);

module.exports = router;
