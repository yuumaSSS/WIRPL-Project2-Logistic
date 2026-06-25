const WebhookSubscriber = require("../models/WebhookSubscriber");

/**
 * Kirim notifikasi HTTP POST ke semua mitra e-commerce yang aktif
 * saat status pengiriman berubah.
 *
 * Payload yang dikirim:
 * {
 *   event: "shipment.status_updated",
 *   resi: "WIRPL-20240625-ABCDEF",
 *   orderId: 123,
 *   status: "delivered",
 *   updatedAt: "2024-06-25T12:00:00.000Z"
 * }
 *
 * Menggunakan global fetch (Node.js 18+).
 * Fire-and-forget: error tidak menghentikan response ke client.
 */
const notifySubscribers = async (shipment) => {
  try {
    const subscribers = await WebhookSubscriber.findAll({
      where: { isActive: true },
    });

    if (subscribers.length === 0) return;

    const payload = JSON.stringify({
      event: "shipment.status_updated",
      resi: shipment.resi,
      orderId: shipment.orderId,
      status: shipment.status,
      updatedAt: new Date().toISOString(),
    });

    const sendTo = async (subscriber) => {
      try {
        const response = await fetch(subscriber.callbackUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Sertakan API key subscriber agar e-commerce bisa verifikasi asal notifikasi
            "x-wirpl-api-key": subscriber.apiKey,
          },
          body: payload,
          signal: AbortSignal.timeout(5000), // timeout 5 detik per mitra
        });

        console.log(
          `[Webhook] Notified ${subscriber.companyName} (${subscriber.callbackUrl}) → ${response.status}`
        );
      } catch (err) {
        console.error(
          `[Webhook] Failed to notify ${subscriber.companyName} (${subscriber.callbackUrl}):`,
          err.message
        );
      }
    };

    // Kirim ke semua subscriber secara paralel (fire-and-forget)
    Promise.all(subscribers.map(sendTo));
  } catch (error) {
    console.error("[Webhook] Error fetching subscribers:", error.message);
  }
};

module.exports = { notifySubscribers };
