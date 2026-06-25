const Payment = require("../models/Payment");

const PAYMENT_METHODS = ["bank_transfer", "ewallet", "cod", "credit_card"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "expired", "refunded"];

const sendServerError = (res, error) => {
  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
};

const isPositiveNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0;

const findPayment = async (id, res) => {
  const payment = await Payment.findByPk(id);

  if (!payment) {
    res.status(404).json({ message: "Payment not found" });
    return null;
  }

  return payment;
};

exports.create = async (req, res) => {
  try {
    const { orderId, amount, method, status = "pending" } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }

    if (!isPositiveNumber(amount)) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }

    if (!PAYMENT_METHODS.includes(method)) {
      return res.status(400).json({
        message: "Invalid payment method",
        allowedMethods: PAYMENT_METHODS,
      });
    }

    if (!PAYMENT_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid payment status",
        allowedStatuses: PAYMENT_STATUSES,
      });
    }

    const payment = await Payment.create({
      orderId,
      amount,
      method,
      status,
      paidAt: status === "paid" ? new Date() : null,
    });

    return res.status(201).json({ message: "Payment created", data: payment });
  } catch (error) {
    return sendServerError(res, error);
  }
};

exports.getByOrderId = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { orderId: req.params.orderId },
      order: [["createdAt", "DESC"]],
    });

    return res.json({ data: payments });
  } catch (error) {
    return sendServerError(res, error);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!PAYMENT_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid payment status",
        allowedStatuses: PAYMENT_STATUSES,
      });
    }

    const payment = await findPayment(req.params.id, res);
    if (!payment) return null;

    payment.status = status;
    payment.paidAt = status === "paid" ? payment.paidAt || new Date() : null;
    await payment.save();

    return res.json({ message: "Payment status updated", data: payment });
  } catch (error) {
    return sendServerError(res, error);
  }
};
