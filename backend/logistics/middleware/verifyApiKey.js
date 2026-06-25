const WebhookSubscriber = require("../models/WebhookSubscriber");

/**
 * Middleware: verifikasi API key yang dikirim oleh e-commerce mitra.
 * API key dikirim melalui header: x-api-key
 *
 * Jika valid → lanjut ke controller berikutnya dan pasang req.subscriber
 * Jika tidak valid → tolak dengan 401/403
 */
const verifyApiKey = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      message: "Unauthorized: x-api-key header is required",
    });
  }

  try {
    const subscriber = await WebhookSubscriber.findOne({
      where: { apiKey, isActive: true },
    });

    if (!subscriber) {
      return res.status(403).json({
        message: "Forbidden: invalid or inactive API key",
      });
    }

    // Pasang data subscriber ke request supaya bisa dipakai controller
    req.subscriber = subscriber;
    return next();
  } catch (error) {
    console.error("verifyApiKey error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = verifyApiKey;
