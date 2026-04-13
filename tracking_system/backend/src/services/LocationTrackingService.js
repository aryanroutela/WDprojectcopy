import { v4 as uuidv4 } from 'uuid';
import Route from '../models/Route.js';
import Bus from '../models/Bus.js';
import PassengerSession from '../models/PassengerSession.js';
import {
  calculateDistance,
  isCloseToRoute,
  isBusDetected,
  findClosestRoute,
} from '../utils/geolocation.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export class LocationTrackingService {
  /**
   * Process location update from user and assign to bus
   */
  static async updateUserLocation(userId, lat, lng, speed) {
    // Get all active routes
    const routes = await Route.getAll(true);
    if (!routes.length) {
      throw new NotFoundError('No active routes found');
    }

    // Find closest route to user
    const closestRouteData = findClosestRoute(lat, lng, routes);
    if (!closestRouteData || closestRouteData.distance > 500) {
      // User is not on any route
      return {
        busId: null,
        routeId: null,
        message: 'User location not matching any route',
      };
    }

    const closestRoute = closestRouteData.route;

    // Check if user is moving (bus detected)
    const speedThreshold = parseInt(process.env.USER_SPEED_THRESHOLD || 15);
    const distanceThreshold = parseInt(
      process.env.USER_ASSIGNMENT_DISTANCE_THRESHOLD || 500
    );

    const busOnRoute = isBusDetected(speed, closestRouteData.distance, speedThreshold);

    if (!busOnRoute) {
      // User not moving fast enough or too far from route
      return {
        busId: null,
        routeId: closestRoute.id,
        message: 'User not detected as on a bus',
      };
    }

    // Check if there's an existing active bus on this route
    let bus = await this._findOrCreateBus(closestRoute.id, lat, lng);

    // Check if user is already on this bus
    const isAlreadyOnBus = await PassengerSession.isUserOnBus(userId, bus.id);

    if (!isAlreadyOnBus) {
      // Add user to bus
      await PassengerSession.create(userId, bus.id);
    }

    // Update bus location
    await Bus.updateLocation(bus.id, lat, lng, speed);

    return {
      busId: bus.id,
      routeId: closestRoute.id,
      message: 'User assigned to bus',
    };
  }

  /**
   * Find or create a bus session for a route
   */
  static async _findOrCreateBus(routeId, lat, lng) {
    // Get existing active buses on this route
    const existingBuses = await Bus.getByRouteId(routeId);

    if (existingBuses.length > 0) {
      // Return the most recently updated bus
      const mostRecentBus = existingBuses.reduce((prev, current) => {
        return new Date(current.last_updated) > new Date(prev.last_updated)
          ? current
          : prev;
      });

      return mostRecentBus;
    }

    // Create new bus session
    const sessionId = `BUS_${routeId.substring(0, 8)}_${Date.now()}_${uuidv4().substring(0, 8)}`;
    const newBus = await Bus.create(routeId, sessionId, lat, lng);

    return newBus;
  }

  /**
   * Get all active buses with details
   */
  static async getAllActiveBuses() {
    const buses = await Bus.getAllActive();

    // Enrich with passenger and destination info
    const enrichedBuses = await Promise.all(
      buses.map(async (bus) => {
        const passengerCount = await Bus.getPassengerCount(bus.id);
        const route = await Route.findById(bus.route_id);
        const stops = await Route.getStops(bus.route_id);

        return {
          ...bus,
          passengerCount,
          route: {
            id: route.id,
            name: route.name,
            number: route.number,
          },
          stops,
        };
      })
    );

    return enrichedBuses;
  }

  /**
   * Get details for a specific bus
   */
  static async getBusDetails(busId) {
    const bus = await Bus.findById(busId);
    if (!bus) {
      throw new NotFoundError('Bus not found');
    }

    const route = await Route.findById(bus.route_id);
    const stops = await Route.getStops(bus.route_id);
    const passengers = await PassengerSession.findByBusId(busId);
    const passengerCount = await Bus.getPassengerCount(busId);

    return {
      id: bus.id,
      sessionId: bus.session_id,
      location: {
        lat: bus.current_lat,
        lng: bus.current_lng,
      },
      speed: bus.avg_speed,
      lastUpdated: bus.last_updated,
      route: {
        id: route.id,
        name: route.name,
        number: route.number,
        description: route.description,
      },
      stops,
      passengers: passengers.map((p) => ({
        id: p.user_id,
        name: p.name,
        role: p.role,
        joinedAt: p.joined_at,
      })),
      passengerCount,
    };
  }

  /**
   * End a bus session (when bus completes route)
   */
  static async endBusSession(busId) {
    const bus = await Bus.closeSession(busId);
    return {
      message: 'Bus session ended',
      bus,
    };
  }

  /**
   * Get user's current bus assignment
   */
  static async getUserCurrentBus(userId) {
    const session = await PassengerSession.findActiveSession(userId);
    if (!session) {
      return null;
    }

    return this.getBusDetails(session.bus_id);
  }

  /**
   * Remove user from all buses
   */
  static async removeUserFromBuses(userId) {
    const session = await PassengerSession.findActiveSession(userId);
    if (session) {
      await PassengerSession.endSession(session.id);
    }
  }
}

export default LocationTrackingService;
