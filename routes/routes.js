const express = require('express');
const router = express.Router();

const backend = require("../controllers/backendController");

router.post("/api/findRoutes", backend.findRoutes, backend.sortRoutes);

router.post("/api/findDirectRoutes", backend.findDirectRoutes);

router.post("/api/timeToMinutes", backend.timeToMinutes);

module.exports = router;