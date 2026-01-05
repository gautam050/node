const express = require("express");
const router = express.Router();
const controller = require("../controllers/vehicle.controller");


router.post("/vehicles", controller.createVehicle);
router.get("/vehicles", controller.getVehicles);
router.put("/vehicles/:id", controller.updateVehicle);
router.delete("/vehicles/:id", controller.deleteVehicle);


router.post("/vehicles/:vehicleId/trips", controller.addTrip);
router.put("/vehicles/:vehicleId/trips/:tripId", controller.updateTrip);
router.delete("/vehicles/:vehicleId/trips/:tripId", controller.deleteTrip);


router.get("/query/trip-distance", controller.tripLongerThan200);
router.get("/query/start-location", controller.tripsFromCities);
router.get("/query/start-date", controller.tripsAfterDate);
router.get("/query/type", controller.carOrTruck);

module.exports = router;
