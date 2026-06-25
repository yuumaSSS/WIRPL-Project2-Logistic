const Shipment = require("../models/Shipment");
const TrackingLog = require("../models/TrackingLog");
const WebhookSubscriber = require("../models/WebhookSubscriber");
const { notifySubscribers } = require("../services/webhookService");
const crypto = require("crypto");

// ─── Konstanta ────────────────────────────────────────────────────────────────

const SHIPMENT_STATUSES = [
  "processing",
  "picked_up",
  "in_transit",
  "delivered",
  "returned",
  "cancelled",
];

// Deskripsi default per status (bisa di-override lewat body.description)
const STATUS_DESCRIPTIONS = {
  processing: "Pesanan sedang diproses oleh logistik",
  picked_up: "Paket telah diambil oleh kurir",
  in_transit: "Paket sedang dalam perjalanan",
  delivered: "Paket telah berhasil diterima",
  returned: "Paket dikembalikan ke pengirim",
  cancelled: "Pengiriman dibatalkan",
};

// ─── Helper ───────────────────────────────────────────────────────────────────

const sendServerError = (res, error) => {
  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const generateResi = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `WIRPL-${datePart}-${randomPart}`;
};

const findShipment = async (id, res) => {
  const shipment = await Shipment.findByPk(id);
  if (!shipment) {
    res.status(404).json({ message: "Shipment not found" });
    return null;
  }
  return shipment;
};

// ─── Shipment Endpoints ───────────────────────────────────────────────────────

/**
 * POST /
 * Buat pengiriman baru dari order e-commerce.
 * Dilindungi oleh verifyApiKey middleware.
 */
exports.create = async (req, res) => {
  try {
    const {
      orderId,
      recipientName,
      phone,
      address,
      courier = "WIRPL Express",
      service = "regular",
      estimasi,
      notes,
    } = req.body;

    if (!orderId) return res.status(400).json({ message: "orderId is required" });
    if (!recipientName) return res.status(400).json({ message: "recipientName is required" });
    if (!address) return res.status(400).json({ message: "address is required" });

    const resi = generateResi();

    const shipment = await Shipment.create({
      orderId,
      resi,
      recipientName,
      phone,
      address,
      courier,
      service,
      status: "processing",
      estimasi: estimasi ? new Date(estimasi) : addDays(new Date(), 3),
      notes,
    });

    // Catat log awal pembuatan shipment
    await TrackingLog.create({
      shipmentId: shipment.id,
      resi: shipment.resi,
      status: "processing",
      description: STATUS_DESCRIPTIONS["processing"],
      changedAt: new Date(),
    });

    return res.status(201).json({ message: "Shipment created", data: shipment });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Generated resi already exists, please retry" });
    }
    return sendServerError(res, error);
  }
};

/**
 * GET /track/:resi
 * Cek status terkini pengiriman berdasarkan nomor resi.
 * Endpoint publik (bisa dipakai e-commerce / pelanggan).
 */
exports.trackByResi = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ where: { resi: req.params.resi } });
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    return res.json({ data: shipment });
  } catch (error) {
    return sendServerError(res, error);
  }
};

/**
 * GET /track/:resi/history
 * Ambil seluruh histori perubahan status berdasarkan nomor resi.
 */
exports.trackHistoryByResi = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ where: { resi: req.params.resi } });
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    const logs = await TrackingLog.findAll({
      where: { resi: req.params.resi },
      order: [["changedAt", "ASC"]],
    });

    return res.json({
      data: {
        shipment,
        history: logs,
      },
    });
  } catch (error) {
    return sendServerError(res, error);
  }
};

/**
 * GET /order/:orderId
 * Ambil semua pengiriman milik sebuah order.
 */
exports.getByOrderId = async (req, res) => {
  try {
    const shipments = await Shipment.findAll({
      where: { orderId: req.params.orderId },
      order: [["createdAt", "DESC"]],
    });
    return res.json({ data: shipments });
  } catch (error) {
    return sendServerError(res, error);
  }
};

/**
 * PATCH /:id/status
 * Update status pengiriman.
 * Setiap update akan:
 *  1. Simpan log baru ke TrackingLog
 *  2. Kirim notifikasi webhook ke semua mitra e-commerce aktif
 */
exports.updateStatus = async (req, res) => {
  try {
    const { status, description } = req.body;

    if (!SHIPMENT_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid shipment status",
        allowedStatuses: SHIPMENT_STATUSES,
      });
    }

    const shipment = await findShipment(req.params.id, res);
    if (!shipment) return null;

    // Update field shipment
    shipment.status = status;
    if (description !== undefined) shipment.notes = description;
    if (status === "picked_up" || status === "in_transit") {
      shipment.shippedAt = shipment.shippedAt || new Date();
    }
    if (status === "delivered") {
      shipment.deliveredAt = shipment.deliveredAt || new Date();
    }
    await shipment.save();

    // 1. Catat ke TrackingLog
    await TrackingLog.create({
      shipmentId: shipment.id,
      resi: shipment.resi,
      status,
      description: description || STATUS_DESCRIPTIONS[status] || "",
      changedAt: new Date(),
    });

    // 2. Kirim webhook (fire-and-forget, tidak blokir response)
    notifySubscribers(shipment);

    return res.json({ message: "Shipment status updated", data: shipment });
  } catch (error) {
    return sendServerError(res, error);
  }
};

// ─── Webhook Subscriber Endpoints ─────────────────────────────────────────────

/**
 * POST /webhooks/register
 * Daftarkan mitra e-commerce baru sebagai subscriber webhook.
 * Generate API key otomatis untuk mitra tersebut.
 */
exports.registerWebhook = async (req, res) => {
  try {
    const { companyName, callbackUrl } = req.body;

    if (!companyName) return res.status(400).json({ message: "companyName is required" });
    if (!callbackUrl) return res.status(400).json({ message: "callbackUrl is required" });

    // Validasi format URL sederhana
    try {
      new URL(callbackUrl);
    } catch {
      return res.status(400).json({ message: "callbackUrl must be a valid URL" });
    }

    // Generate API key unik (32 byte hex = 64 karakter)
    const apiKey = crypto.randomBytes(32).toString("hex");

    const subscriber = await WebhookSubscriber.create({
      companyName,
      callbackUrl,
      apiKey,
      isActive: true,
    });

    return res.status(201).json({
      message: "Webhook subscriber registered",
      data: {
        id: subscriber.id,
        companyName: subscriber.companyName,
        callbackUrl: subscriber.callbackUrl,
        apiKey: subscriber.apiKey, // tampilkan sekali saat register
        isActive: subscriber.isActive,
      },
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "API key collision, please retry" });
    }
    return sendServerError(res, error);
  }
};

/**
 * GET /webhooks
 * Daftar semua subscriber webhook (tanpa menampilkan apiKey penuh).
 */
exports.listWebhooks = async (req, res) => {
  try {
    const subscribers = await WebhookSubscriber.findAll({
      attributes: ["id", "companyName", "callbackUrl", "isActive", "createdAt"],
      order: [["createdAt", "DESC"]],
    });
    return res.json({ data: subscribers });
  } catch (error) {
    return sendServerError(res, error);
  }
};

/**
 * PATCH /webhooks/:id/toggle
 * Aktifkan / nonaktifkan subscriber webhook.
 */
exports.toggleWebhook = async (req, res) => {
  try {
    const subscriber = await WebhookSubscriber.findByPk(req.params.id);
    if (!subscriber) return res.status(404).json({ message: "Subscriber not found" });

    subscriber.isActive = !subscriber.isActive;
    await subscriber.save();

    return res.json({
      message: `Subscriber ${subscriber.isActive ? "activated" : "deactivated"}`,
      data: subscriber,
    });
  } catch (error) {
    return sendServerError(res, error);
  }
};
