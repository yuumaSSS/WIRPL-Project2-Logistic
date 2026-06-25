const Shipment = require("../models/Shipment");

const SHIPMENT_STATUSES = [
  "processing",
  "picked_up",
  "in_transit",
  "delivered",
  "returned",
  "cancelled",
];

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

    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }

    if (!recipientName) {
      return res.status(400).json({ message: "recipientName is required" });
    }

    if (!address) {
      return res.status(400).json({ message: "address is required" });
    }

    const shipment = await Shipment.create({
      orderId,
      resi: generateResi(),
      recipientName,
      phone,
      address,
      courier,
      service,
      status: "processing",
      estimasi: estimasi ? new Date(estimasi) : addDays(new Date(), 3),
      notes,
    });

    return res.status(201).json({ message: "Shipment created", data: shipment });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Generated resi already exists, please retry" });
    }

    return sendServerError(res, error);
  }
};

exports.trackByResi = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      where: { resi: req.params.resi },
    });

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    return res.json({ data: shipment });
  } catch (error) {
    return sendServerError(res, error);
  }
};

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

exports.updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!SHIPMENT_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid shipment status",
        allowedStatuses: SHIPMENT_STATUSES,
      });
    }

    const shipment = await findShipment(req.params.id, res);
    if (!shipment) return null;

    shipment.status = status;
    if (notes !== undefined) shipment.notes = notes;
    if (status === "picked_up" || status === "in_transit") {
      shipment.shippedAt = shipment.shippedAt || new Date();
    }
    if (status === "delivered") {
      shipment.deliveredAt = shipment.deliveredAt || new Date();
    }

    await shipment.save();

    return res.json({ message: "Shipment status updated", data: shipment });
  } catch (error) {
    return sendServerError(res, error);
  }
};
