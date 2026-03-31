import Bus from '../models/Bus.js';
import Route from '../models/Route.js';
import { calculateDistance, calculateETA, findNearestStop } from '../utils/geolocation.js';
import { NotFoundError } from '../utils/errors.js';

export class ETAService {
  /**
   * Calculate ETA for all upcoming stops of a bus
   */
  static async calculateBusETA(busId) {
    const bus = await Bus.findById(busId);
    if (!bus) {
      throw new NotFoundError('Bus not found');
    }

    const route = await Route.findById(bus.route_id);
    const stops = await Route.getStops(bus.route_id);

    if (!stops.length) {
      return { message: 'No stops found for this route' };
    }

    // Get bus current location
    const busLat = bus.current_lat;
    const busLng = bus.current_lng;
    const busSpeed = bus.avg_speed || 25; // Default 25 km/h

    // Calculate ETA for each stop
    const etaList = stops.map((stop) => {
      const distance = calculateDistance(busLat, busLng, stop.lat, stop.lng);
      const eta = calculateETA(distance, busSpeed);

      return {
        stopId: stop.id,
        stopName: stop.name,
        stopOrder: stop.order || stop.stop_order,
        location: {
          lat: stop.lat,
          lng: stop.lng,
        },
        distanceMeters: Math.round(distance),
        distanceKm: (distance / 1000).toFixed(2),
        etaSeconds: eta,
        etaMinutes: Math.round(eta / 60),
        etaTime: this._formatETA(eta),
      };
    });

    // Find nearest stop
    const nearestStop = findNearestStop(busLat, busLng, stops);

    return {
      busId,
      busLocation: {
        lat: busLat,
        lng: busLng,
      },
      busSpeed: busSpeed,
      route: {
        id: route.id,
        name: route.name,
        number: route.number,
      },
      nearestStop: {
        stopId: nearestStop.id,
        stopName: nearestStop.name,
        distanceMeters: Math.round(nearestStop.distance),
      },
      upcomingStops: etaList.slice(0, 5), // Next 5 stops
      allStops: etaList,
    };
  }

  /**
   * Get ETA for specific stop
   */
  static async calculateETAToStop(busId, stopId) {
    const bus = await Bus.findById(busId);
    if (!bus) {
      throw new NotFoundError('Bus not found');
    }

    const route = await Route.findById(bus.route_id);
    const stops = await Route.getStops(bus.route_id);

    const targetStop = stops.find((s) => s.id === stopId);
    if (!targetStop) {
      throw new NotFoundError('Stop not found on this route');
    }

    const distance = calculateDistance(
      bus.current_lat,
      bus.current_lng,
      targetStop.lat,
      targetStop.lng
    );

    const busSpeed = bus.avg_speed || 25;
    const eta = calculateETA(distance, busSpeed);

    return {
      busId,
      stopId,
      stopName: targetStop.name,
      distanceMeters: Math.round(distance),
      distanceKm: (distance / 1000).toFixed(2),
      etaSeconds: eta,
      etaMinutes: Math.round(eta / 60),
      etaTime: this._formatETA(eta),
    };
  }

  /**
   * Format ETA in human-readable format
   */
  static _formatETA(etaSeconds) {
    if (etaSeconds === Infinity) return 'Unknown';

    const hours = Math.floor(etaSeconds / 3600);
    const minutes = Math.floor((etaSeconds % 3600) / 60);
    const seconds = Math.floor(etaSeconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Update average speed for a bus (used for better ETA accuracy)
   */
  static async updateBusSpeed(busId, speed) {
    // This would be called from location updates
    // The Bus model already handles this in updateLocation
  }
}

export default ETAService;
