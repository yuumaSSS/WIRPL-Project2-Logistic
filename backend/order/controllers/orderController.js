const Order = require("../models/Order");

const ORDER_STATUSES = [
  "pending",
  "waiting_payment",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
];

const sendServerError = (res, error) => {
  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
};

const isPositiveNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0;

const calculateTotal = (items) => {
  return items.reduce((total, item) => {
    const price = Number(item.price);
    const quantity = Number(item.quantity);
    return total + price * quantity;
  }, 0);
};

const validateItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "items must be a non-empty array";
  }

  const invalidItem = items.find((item) => {
    return !item.productId || !isPositiveNumber(item.price) || !isPositiveNumber(item.quantity);
  });

  if (invalidItem) {
    return "each item must contain productId, positive price, and positive quantity";
  }

  return null;
};

const hasShippingAddressText = (shippingAddress) => {
  if (!shippingAddress || typeof shippingAddress !== "object") {
    return false;
  }

  return Boolean(shippingAddress.address || shippingAddress.fullAddress);
};

const findOrder = async (id, res) => {
  const order = await Order.findByPk(id);

  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return null;
  }

  return order;
};

exports.getAll = async (req, res) => {
  try {
    const where = {};

    if (req.query.userId) where.userId = req.query.userId;
    if (req.query.status) where.status = req.query.status;

    const orders = await Order.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    return res.json({ data: orders });
  } catch (error) {
    return sendServerError(res, error);
  }
};

exports.getById = async (req, res) => {
  try {
    const order = await findOrder(req.params.id, res);
    if (!order) return null;

    return res.json({ data: order });
  } catch (error) {
    return sendServerError(res, error);
  }
};

exports.create = async (req, res) => {
  try {
    const { userId, items, shippingAddress, totalPrice } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const itemError = validateItems(items);
    if (itemError) {
      return res.status(400).json({ message: itemError });
    }

    if (!hasShippingAddressText(shippingAddress)) {
      return res.status(400).json({
        message: "shippingAddress must contain address or fullAddress",
      });
    }

    const computedTotal = calculateTotal(items);
    const finalTotal = totalPrice ? Number(totalPrice) : computedTotal;

    if (!isPositiveNumber(finalTotal)) {
      return res.status(400).json({ message: "totalPrice must be a positive number" });
    }

    const order = await Order.create({
      userId,
      items,
      shippingAddress,
      totalPrice: finalTotal,
      status: "waiting_payment",
    });

    return res.status(201).json({ message: "Order created", data: order });
  } catch (error) {
    return sendServerError(res, error);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
        allowedStatuses: ORDER_STATUSES,
      });
    }

    const order = await findOrder(req.params.id, res);
    if (!order) return null;

    order.status = status;
    await order.save();

    return res.json({ message: "Order status updated", data: order });
  } catch (error) {
    return sendServerError(res, error);
  }
};
