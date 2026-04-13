/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate ETA between current location and destination
 * @param {number} distance - Distance in meters
 * @param {number} speed - Speed in km/h
 * @returns {number} ETA in seconds
 */
export function calculateETA(distance, speed) {
  if (speed === 0) return Infinity;
  const distanceKm = distance / 1000;
  const timeHours = distanceKm / speed;
  const timeSeconds = timeHours * 3600;
  return Math.round(timeSeconds);
}

/**
 * Find nearest stop on route
 */
export function findNearestStop(userLat, userLng, stops) {
  let nearest = null;
  let minDistance = Infinity;

  stops.forEach((stop) => {
    const distance = calculateDistance(userLat, userLng, stop.lat, stop.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { ...stop, distance };
    }
  });

  return nearest;
}

/**
 * Check if user is close to route
 */
export function isCloseToRoute(userLat, userLng, waypoints, threshold = 500) {
  const waypointArray = typeof waypoints === 'string' ? JSON.parse(waypoints) : waypoints;
  
  for (const waypoint of waypointArray) {
    const distance = calculateDistance(userLat, userLng, waypoint.lat, waypoint.lng);
    if (distance < threshold) {
      return true;
    }
  }
  return false;
}

/**
 * Check if user is on a bus based on speed and location
 */
export function isBusDetected(speed, distanceFromRoute, speedThreshold = 15) {
  return speed > speedThreshold && distanceFromRoute < 500;
}

/**
 * Haversine distance calculation for route matching
 */
export function findClosestRoute(lat, lng, routes) {
  let closest = null;
  let minDistance = Infinity;

  routes.forEach((route) => {
    const waypoints = typeof route.waypoints === 'string' ? JSON.parse(route.waypoints) : route.waypoints;
    
    for (const waypoint of waypoints) {
      const distance = calculateDistance(lat, lng, waypoint.lat, waypoint.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closest = { route, distance };
      }
    }
  });

  return closest;
}

/**
 * Convert MetersPerSecond to Kilometers Per Hour
 */
export function msToKmh(ms) {
  return ms * 3.6;
}

/**
 * Convert Kilometers Per Hour to Meters Per Second
 */
export function kmhToMs(kmh) {
  return kmh / 3.6;
}
