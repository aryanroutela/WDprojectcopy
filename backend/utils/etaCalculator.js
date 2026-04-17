/**
 * ETA Calculator Utility
 * Uses Haversine formula for accurate geo-distance calculations.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate the straight-line distance between two lat/lng points (in km).
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

/**
 * Determine which checkpoint the bus has most recently passed.
 * A checkpoint is considered "passed" when the bus is within THRESHOLD_KM of it
 * OR when the bus is closer to the next checkpoint than this one.
 * Returns the index of the last passed checkpoint (-1 = not started yet).
 */
const detectCurrentCheckpoint = (busLat, busLng, checkpoints) => {
  if (!checkpoints || checkpoints.length === 0) return -1;

  // Filter only checkpoints that have geo-coordinates
  const geoCheckpoints = checkpoints.filter(
    (cp) => cp.latitude !== null && cp.longitude !== null
  );
  if (geoCheckpoints.length === 0) return -1;

  let closestIdx = 0;
  let closestDist = Infinity;

  geoCheckpoints.forEach((cp, i) => {
    const dist = haversineDistance(busLat, busLng, cp.latitude, cp.longitude);
    if (dist < closestDist) {
      closestDist = dist;
      closestIdx = i;
    }
  });

  return closestIdx;
};

/**
 * Calculate ETA from bus's current position to a target checkpoint.
 * @param {number} busLat
 * @param {number} busLng
 * @param {number} busSpeedKmh - current speed (km/h), default 30 if 0
 * @param {Object} targetCheckpoint - { latitude, longitude }
 * @returns {number} etaMinutes (rounded up)
 */
const calculateETA = (busLat, busLng, busSpeedKmh, targetCheckpoint) => {
  if (!targetCheckpoint?.latitude || !targetCheckpoint?.longitude) return null;

  const speed = busSpeedKmh > 2 ? busSpeedKmh : 30; // fallback 30 km/h
  const distanceKm = haversineDistance(
    busLat,
    busLng,
    targetCheckpoint.latitude,
    targetCheckpoint.longitude
  );

  const etaHours = distanceKm / speed;
  return Math.ceil(etaHours * 60); // convert to minutes
};

/**
 * Build full ETA info for all upcoming stops from bus current position.
 * @param {number} busLat
 * @param {number} busLng
 * @param {number} speedKmh
 * @param {Array} checkpoints - sorted array of checkpoints
 * @returns {{ currentCheckpointIdx, nextCheckpointIdx, stopsETA, distanceToNext }}
 */
const buildStopsETA = (busLat, busLng, speedKmh, checkpoints) => {
  const currentIdx = detectCurrentCheckpoint(busLat, busLng, checkpoints);

  const stopsETA = checkpoints.map((cp, i) => {
    if (i <= currentIdx) {
      return { ...cp, status: "passed", eta: 0, distanceKm: 0 };
    }
    const eta = cp.latitude
      ? calculateETA(busLat, busLng, speedKmh, cp)
      : null;
    const distanceKm = cp.latitude
      ? +haversineDistance(busLat, busLng, cp.latitude, cp.longitude).toFixed(2)
      : null;
    return {
      ...cp,
      status: i === currentIdx + 1 ? "next" : "upcoming",
      eta,
      distanceKm
    };
  });

  const nextIdx = currentIdx + 1 < checkpoints.length ? currentIdx + 1 : null;
  const distanceToNext =
    nextIdx !== null && checkpoints[nextIdx]?.latitude
      ? +haversineDistance(
          busLat,
          busLng,
          checkpoints[nextIdx].latitude,
          checkpoints[nextIdx].longitude
        ).toFixed(2)
      : null;

  return {
    currentCheckpointIdx: currentIdx,
    nextCheckpointIdx: nextIdx,
    currentCheckpointName: currentIdx >= 0 ? checkpoints[currentIdx]?.name : null,
    nextCheckpointName: nextIdx !== null ? checkpoints[nextIdx]?.name : null,
    stopsETA,
    distanceToNext,
    etaToNextStop:
      nextIdx !== null && checkpoints[nextIdx]?.latitude
        ? calculateETA(busLat, busLng, speedKmh, checkpoints[nextIdx])
        : null
  };
};

/**
 * Smart route-match algorithm:
 * Given a source stop name, find all buses whose route includes that stop
 * (not necessarily as the starting point — can be any checkpoint).
 * @param {string} sourceName
 * @param {Array} buses - populated with route.checkpoints
 * @returns {Array} matched buses with matchedStop info
 */
const findBusesByStop = (sourceName, buses) => {
  if (!sourceName) return buses;
  const query = sourceName.trim().toLowerCase();

  return buses
    .map((bus) => {
      const checkpoints = bus.checkpoints || bus.route?.checkpoints || [];
      const matchedStop = checkpoints.find((cp) =>
        cp.name.toLowerCase().includes(query)
      );
      if (!matchedStop) return null;
      return {
        ...bus,
        matchedStop,
        matchedStopSequence: matchedStop.sequence,
        remainingStops: checkpoints.filter(
          (cp) => cp.sequence >= matchedStop.sequence
        )
      };
    })
    .filter(Boolean);
};

module.exports = {
  haversineDistance,
  calculateETA,
  detectCurrentCheckpoint,
  buildStopsETA,
  findBusesByStop
};
