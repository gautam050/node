const Vehicle = require("../models/vehicle.model");

exports.createVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (err) {
    next(err);
  }
};

exports.getVehicles = async (req, res) => {
  const vehicles = await Vehicle.find();
  res.json(vehicles);
};

exports.updateVehicle = async (req, res) => {
  const vehicle = await Vehicle.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(vehicle);
};

exports.deleteVehicle = async (req, res) => {
  await Vehicle.findByIdAndDelete(req.params.id);
  res.json({ message: "Vehicle deleted" });
};


exports.addTrip = async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.vehicleId);
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

  vehicle.trips.push(req.body);
  await vehicle.save();
  res.json(vehicle);
};

exports.updateTrip = async (req, res) => {
  const { vehicleId, tripId } = req.params;

  const vehicle = await Vehicle.findById(vehicleId);
  const trip = vehicle.trips.id(tripId);

  if (!trip) return res.status(404).json({ message: "Trip not found" });

  Object.assign(trip, req.body);
  await vehicle.save();
  res.json(vehicle);
};

exports.deleteTrip = async (req, res) => {
  await Vehicle.findByIdAndUpdate(
    req.params.vehicleId,
    { $pull: { trips: { _id: req.params.tripId } } },
    { new: true }
  );
  res.json({ message: "Trip deleted" });
};



exports.tripLongerThan200 = async (req, res) => {
  const vehicles = await Vehicle.find({
    "trips.distance": { $gt: 200 }
  });
  res.json(vehicles);
};


exports.tripsFromCities = async (req, res) => {
  const vehicles = await Vehicle.find({
    "trips.startLocation": { $in: ["Delhi", "Mumbai", "Bangalore"] }
  });
  res.json(vehicles);
};

exports.tripsAfterDate = async (req, res) => {
  const vehicles = await Vehicle.find({
    "trips.startTime": { $gte: new Date("2024-01-01") }
  });
  res.json(vehicles);
};


exports.carOrTruck = async (req, res) => {
  const vehicles = await Vehicle.find({
    type: { $in: ["car", "truck"] }
  });
  res.json(vehicles);
};
