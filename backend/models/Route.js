const mongoose = require("mongoose");

/**
 * Route Model
 * Stores route definitions with ordered checkpoints/stations.
 * Each bus references a route by routeId.
 */
const checkpointSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sequence: { type: Number, required: true },      // 0-indexed order along the route
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  // Cumulative distance (km) from route start to this checkpoint
  distanceFromStart: { type: Number, default: 0 }
}, { _id: false });

const routeSchema = new mongoose.Schema({
  routeName: {
    type: String,
    required: [true, "Route name is required"],
    unique: true,
    trim: true
  },
  // Source = checkpoints[0].name, Destination = checkpoints[last].name
  checkpoints: {
    type: [checkpointSchema],
    validate: {
      validator: (v) => v.length >= 2,
      message: "A route must have at least 2 checkpoints (source & destination)"
    }
  },
  // Total route distance in km
  totalDistance: { type: Number, default: 0 },

  isActive: { type: Boolean, default: true },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

routeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  // Auto-sort checkpoints by sequence
  this.checkpoints.sort((a, b) => a.sequence - b.sequence);
  next();
});

// Virtual: source name
routeSchema.virtual("source").get(function () {
  return this.checkpoints?.[0]?.name || "";
});

// Virtual: destination name
routeSchema.virtual("destination").get(function () {
  return this.checkpoints?.[this.checkpoints.length - 1]?.name || "";
});

routeSchema.set("toJSON", { virtuals: true });
routeSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Route", routeSchema);
