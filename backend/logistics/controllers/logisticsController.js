const Shipment = require("../models/Shipment");
const TrackingLog = require("../models/TrackingLog");
const WebhookSubscriber = require("../models/WebhookSubscriber");
const { notifySubscribers } = require("../services/webhookService");
const { Op } = require("sequelize");
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
 * GET /stats
 * Ringkasan jumlah shipment per status — dipakai dashboard frontend.
 * Response: { total, active, delivered, failed }
 */
exports.getStats = async (req, res) => {
  try {
    const [total, delivered, failed] = await Promise.all([
      Shipment.count(),
      Shipment.count({ where: { status: "delivered" } }),
      Shipment.count({ where: { status: { [Op.in]: ["returned", "cancelled"] } } }),
    ]);

    // "active" = semua yang belum selesai (bukan delivered/returned/cancelled)
    const active = total - delivered - failed;

    return res.json({ data: { total, active, delivered, failed } });
  } catch (error) {
    return sendServerError(res, error);
  }
};

/**
 * GET /
 * List semua shipment. Support query params:
 *   ?limit=4          → batasi jumlah hasil (default semua)
 *   ?sort=createdAt:desc  → urutan (default createdAt DESC)
 * Dipakai dashboard frontend untuk menampilkan pengiriman terbaru.
 */
exports.getAll = async (req, res) => {
  try {
    const { limit, sort } = req.query;

    // Parse sort: "createdAt:desc" → [["createdAt", "DESC"]]
    let order = [["createdAt", "DESC"]];
    if (sort) {
      const [field, direction] = sort.split(":");
      const allowedFields = ["createdAt", "updatedAt", "status", "resi"];
      const allowedDirs   = ["asc", "desc"];
      if (allowedFields.includes(field) && allowedDirs.includes(direction?.toLowerCase())) {
        order = [[field, direction.toUpperCase()]];
      }
    }

    const options = { order };
    if (limit) {
      const parsed = parseInt(limit, 10);
      if (!isNaN(parsed) && parsed > 0) options.limit = parsed;
    }

    const shipments = await Shipment.findAll(options);
    return res.json({ data: shipments });
  } catch (error) {
    return sendServerError(res, error);
  }
};

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

    return res.json({ data: { shipment, history: logs } });
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
 * Update status pengiriman + catat log + kirim webhook.
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

    shipment.status = status;
    if (description !== undefined) shipment.notes = description;
    if (status === "picked_up" || status === "in_transit") {
      shipment.shippedAt = shipment.shippedAt || new Date();
    }
    if (status === "delivered") {
      shipment.deliveredAt = shipment.deliveredAt || new Date();
    }
    await shipment.save();

    await TrackingLog.create({
      shipmentId: shipment.id,
      resi: shipment.resi,
      status,
      description: description || STATUS_DESCRIPTIONS[status] || "",
      changedAt: new Date(),
    });

    notifySubscribers(shipment);

    return res.json({ message: "Shipment status updated", data: shipment });
  } catch (error) {
    return sendServerError(res, error);
  }
};

// ─── Webhook Subscriber Endpoints ─────────────────────────────────────────────

/**
 * POST /webhooks/register
 */
exports.registerWebhook = async (req, res) => {
  try {
    const { companyName, callbackUrl } = req.body;

    if (!companyName) return res.status(400).json({ message: "companyName is required" });
    if (!callbackUrl) return res.status(400).json({ message: "callbackUrl is required" });

    try { new URL(callbackUrl); } catch {
      return res.status(400).json({ message: "callbackUrl must be a valid URL" });
    }

    const apiKey = crypto.randomBytes(32).toString("hex");
    const subscriber = await WebhookSubscriber.create({
      companyName, callbackUrl, apiKey, isActive: true,
    });

    return res.status(201).json({
      message: "Webhook subscriber registered",
      data: {
        id: subscriber.id,
        companyName: subscriber.companyName,
        callbackUrl: subscriber.callbackUrl,
        apiKey: subscriber.apiKey,
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