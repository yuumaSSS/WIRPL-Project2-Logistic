const express = require("express");
const router = express.Router();
const logisticsController = require("../controllers/logisticsController");

router.post("/", logisticsController.create);
router.get("/track/:resi", logisticsController.trackByResi);
router.patch("/:id/status", logisticsController.updateStatus);

module.exports = router;
