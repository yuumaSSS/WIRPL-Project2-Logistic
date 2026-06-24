const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.post("/", paymentController.create);
router.get("/order/:orderId", paymentController.getByOrderId);
router.patch("/:id/status", paymentController.updateStatus);

module.exports = router;
