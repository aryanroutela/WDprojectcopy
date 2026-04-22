/**
 * Smart ETA Prediction Engine
 * 
 * Uses a simple multiple linear regression approach:
 *   travelTime = w0 + w1*distance + w2*hourOfDay + w3*dayOfWeek + w4*isPeakHour
 * 
 * This is intentionally kept simple for a student project while still being
 * a genuine machine-learning approach (not just fixed speed calculations).
 */

const TripHistory = require("../models/TripHistory");
const { haversineDistance, calculateETA } = require("./etaCalculator");

// ─── Peak hour definitions ────────────────────────────────────────
const PEAK_MORNING = { start: 7, end: 10 };   // 7am - 10am
const PEAK_EVENING = { start: 17, end: 20 };   // 5pm - 8pm

/**
 * Check whether the given hour falls in peak traffic time
 */
const isPeakHour = (hour) => {
  return (hour >= PEAK_MORNING.start && hour < PEAK_MORNING.end) ||
         (hour >= PEAK_EVENING.start && hour < PEAK_EVENING.end);
};

// ─── Linear Regression (Ordinary Least Squares) ───────────────────
/**
 * Train a linear regression model from trip history data.
 * Features: [1(bias), distance, hourOfDay, dayOfWeek, isPeakHour]
 * Target:   travelTimeMinutes
 * 
 * Returns coefficients array [w0, w1, w2, w3, w4] or null if insufficient data.
 */
const trainModel = (tripData) => {
  if (!tripData || tripData.length < 5) return null; // Need at least 5 samples

  const n = tripData.length;
  const numFeatures = 5; // bias + 4 features

  // Build feature matrix X and target vector Y
  const X = tripData.map(t => [
    1,                          // bias term
    t.distanceKm,               // distance
    t.hourOfDay / 23,           // normalize hour to 0-1
    t.dayOfWeek / 6,            // normalize day to 0-1
    t.isPeakHour ? 1 : 0        // binary peak hour flag
  ]);
  const Y = tripData.map(t => t.travelTimeMinutes);

  // Normal equation: w = (X^T * X)^-1 * X^T * Y
  // Step 1: X^T * X (numFeatures x numFeatures)
  const XtX = Array.from({ length: numFeatures }, () => 
    Array(numFeatures).fill(0)
  );
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < numFeatures; j++) {
      for (let k = 0; k < numFeatures; k++) {
        XtX[j][k] += X[i][j] * X[i][k];
      }
    }
  }

  // Step 2: X^T * Y (numFeatures x 1)
  const XtY = Array(numFeatures).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < numFeatures; j++) {
      XtY[j] += X[i][j] * Y[i];
    }
  }

  // Step 3: Solve using Gauss-Jordan elimination
  const augmented = XtX.map((row, i) => [...row, XtY[i]]);
  const weights = gaussJordan(augmented, numFeatures);

  return weights;
};

/**
 * Gauss-Jordan elimination to solve a system of linear equations.
 * @param {number[][]} matrix - Augmented matrix [A|b]
 * @param {number} n - number of variables
 * @returns {number[]|null} solution vector or null if singular
 */
const gaussJordan = (matrix, n) => {
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(matrix[row][col]) > Math.abs(matrix[maxRow][col])) {
        maxRow = row;
      }
    }
    [matrix[col], matrix[maxRow]] = [matrix[maxRow], matrix[col]];

    if (Math.abs(matrix[col][col]) < 1e-10) return null; // Singular

    // Scale pivot row
    const pivot = matrix[col][col];
    for (let j = col; j <= n; j++) {
      matrix[col][j] /= pivot;
    }

    // Eliminate column
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = matrix[row][col];
      for (let j = col; j <= n; j++) {
        matrix[row][j] -= factor * matrix[col][j];
      }
    }
  }

  return matrix.map(row => row[n]);
};

/**
 * Predict ETA using learned model.
 * @param {number[]} weights - Model coefficients [w0, w1, w2, w3, w4]
 * @param {number} distanceKm 
 * @param {number} hourOfDay (0-23)
 * @param {number} dayOfWeek (0-6)
 * @returns {number} predicted travel time in minutes
 */
const predictWithModel = (weights, distanceKm, hourOfDay, dayOfWeek) => {
  const features = [
    1,                        // bias
    distanceKm,               // distance
    hourOfDay / 23,           // normalized hour
    dayOfWeek / 6,            // normalized day
    isPeakHour(hourOfDay) ? 1 : 0  // peak hour flag
  ];

  let prediction = 0;
  for (let i = 0; i < weights.length; i++) {
    prediction += weights[i] * features[i];
  }

  // Ensure positive and reasonable ETA
  return Math.max(1, Math.ceil(prediction));
};

// ─── Main API: Smart ETA Prediction ───────────────────────────────

/**
 * Predict ETA from a bus's current position to a target checkpoint.
 * Uses AI model if enough historical data exists, otherwise falls back
 * to the standard Haversine-based calculation.
 * 
 * @param {Object} bus - Bus document with currentLocation, routeId
 * @param {Object} targetCheckpoint - { latitude, longitude, name }
 * @returns {Object} { etaMinutes, method, confidence }
 */
const smartPredictETA = async (bus, targetCheckpoint) => {
  if (!bus?.currentLocation?.latitude || !targetCheckpoint?.latitude) {
    return { etaMinutes: null, method: "unavailable", confidence: 0 };
  }

  const distanceKm = haversineDistance(
    bus.currentLocation.latitude,
    bus.currentLocation.longitude,
    targetCheckpoint.latitude,
    targetCheckpoint.longitude
  );

  const now = new Date();
  const hourOfDay = now.getHours();
  const dayOfWeek = now.getDay();

  // Try to get historical data for this route
  const query = {};
  if (bus.routeId) {
    query.routeId = bus.routeId;
  } else {
    query.busId = bus._id;
  }

  try {
    const tripData = await TripHistory.find(query)
      .sort({ timestamp: -1 })
      .limit(200)    // Use last 200 trips for training
      .lean();

    const weights = trainModel(tripData);

    if (weights) {
      const aiEta = predictWithModel(weights, distanceKm, hourOfDay, dayOfWeek);
      
      // Calculate confidence based on data quantity and recency
      const dataPoints = tripData.length;
      const confidence = Math.min(95, 40 + (dataPoints / 200) * 55);

      return {
        etaMinutes: aiEta,
        method: "ai_linear_regression",
        confidence: Math.round(confidence),
        modelInfo: {
          dataPoints,
          features: ["distance", "hourOfDay", "dayOfWeek", "isPeakHour"],
          distanceKm: +distanceKm.toFixed(2)
        }
      };
    }
  } catch (err) {
    console.error("Smart ETA model error, falling back:", err.message);
  }

  // Fallback: standard Haversine ETA with traffic multiplier
  const baseSpeed = 30; // km/h
  const trafficMultiplier = isPeakHour(hourOfDay) ? 1.4 : 1.0;
  const adjustedSpeed = baseSpeed / trafficMultiplier;
  const fallbackEta = Math.ceil((distanceKm / adjustedSpeed) * 60);

  return {
    etaMinutes: Math.max(1, fallbackEta),
    method: "haversine_with_traffic",
    confidence: 30,
    modelInfo: {
      dataPoints: 0,
      distanceKm: +distanceKm.toFixed(2),
      isPeakHour: isPeakHour(hourOfDay),
      adjustedSpeedKmh: +adjustedSpeed.toFixed(1)
    }
  };
};

/**
 * Record a trip segment to the database for future model training.
 * Called when a bus passes a checkpoint.
 */
const recordTripSegment = async ({
  busId, routeId, fromCheckpoint, toCheckpoint, travelTimeMinutes
}) => {
  if (!fromCheckpoint?.latitude || !toCheckpoint?.latitude) return null;

  const distanceKm = haversineDistance(
    fromCheckpoint.latitude, fromCheckpoint.longitude,
    toCheckpoint.latitude, toCheckpoint.longitude
  );

  if (distanceKm < 0.01 || travelTimeMinutes < 0.1) return null; // Skip negligible segments

  const now = new Date();
  const hourOfDay = now.getHours();
  const dayOfWeek = now.getDay();
  const avgSpeedKmh = distanceKm / (travelTimeMinutes / 60);

  const tripRecord = new TripHistory({
    busId,
    routeId: routeId || null,
    fromCheckpoint: {
      name: fromCheckpoint.name,
      sequence: fromCheckpoint.sequence,
      latitude: fromCheckpoint.latitude,
      longitude: fromCheckpoint.longitude
    },
    toCheckpoint: {
      name: toCheckpoint.name,
      sequence: toCheckpoint.sequence,
      latitude: toCheckpoint.latitude,
      longitude: toCheckpoint.longitude
    },
    distanceKm: +distanceKm.toFixed(2),
    travelTimeMinutes: +travelTimeMinutes.toFixed(1),
    avgSpeedKmh: +avgSpeedKmh.toFixed(1),
    hourOfDay,
    dayOfWeek,
    isPeakHour: isPeakHour(hourOfDay)
  });

  await tripRecord.save();
  return tripRecord;
};

/**
 * Seed sample trip history data for demo/testing purposes.
 * Generates realistic training data for the ML model.
 */
const seedTripHistory = async (routeId, busId, checkpoints) => {
  if (!checkpoints || checkpoints.length < 2) return 0;

  const records = [];
  const now = Date.now();

  // Generate 60 simulated trips over the past 7 days
  for (let trip = 0; trip < 60; trip++) {
    const tripTime = new Date(now - Math.random() * 7 * 24 * 3600000);
    const hour = Math.floor(Math.random() * 24);
    const day = Math.floor(Math.random() * 7);
    const peak = isPeakHour(hour);

    for (let i = 0; i < checkpoints.length - 1; i++) {
      const from = checkpoints[i];
      const to = checkpoints[i + 1];

      if (!from.latitude || !to.latitude) continue;

      const dist = haversineDistance(
        from.latitude, from.longitude,
        to.latitude, to.longitude
      );

      // Simulate realistic travel time with variations
      const baseSpeed = peak ? 18 + Math.random() * 8 : 25 + Math.random() * 15;
      const travelTime = (dist / baseSpeed) * 60;

      // Add some noise (±20%)
      const noise = 1 + (Math.random() - 0.5) * 0.4;
      const finalTime = travelTime * noise;

      records.push({
        busId,
        routeId: routeId || null,
        fromCheckpoint: {
          name: from.name,
          sequence: from.sequence,
          latitude: from.latitude,
          longitude: from.longitude
        },
        toCheckpoint: {
          name: to.name,
          sequence: to.sequence,
          latitude: to.latitude,
          longitude: to.longitude
        },
        distanceKm: +dist.toFixed(2),
        travelTimeMinutes: +Math.max(0.5, finalTime).toFixed(1),
        avgSpeedKmh: +(dist / (finalTime / 60)).toFixed(1),
        hourOfDay: hour,
        dayOfWeek: day,
        isPeakHour: peak,
        timestamp: tripTime
      });
    }
  }

  if (records.length > 0) {
    await TripHistory.insertMany(records);
  }

  return records.length;
};

module.exports = {
  isPeakHour,
  trainModel,
  predictWithModel,
  smartPredictETA,
  recordTripSegment,
  seedTripHistory
};
