import Route from '../models/Route.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export class RouteController {
  /**
   * Get all routes
   * GET /api/routes
   */
  static async getAllRoutes(req, res, next) {
    try {
      const activeOnly = req.query.active !== 'false';
      const routes = await Route.getAll(activeOnly);

      res.status(200).json({
        success: true,
        data: routes,
        count: routes.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get specific route details
   * GET /api/routes/:id
   */
  static async getRouteDetails(req, res, next) {
    try {
      const { id } = req.params;

      const route = await Route.findById(id);
      if (!route) {
        throw new NotFoundError('Route not found');
      }

      const stops = await Route.getStops(id);

      res.status(200).json({
        success: true,
        data: {
          ...route,
          waypoints: typeof route.waypoints === 'string'
            ? JSON.parse(route.waypoints)
            : route.waypoints,
          stops,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get stops for a route
   * GET /api/stops/:routeId
   */
  static async getRouteStops(req, res, next) {
    try {
      const { routeId } = req.params;

      // Verify route exists
      const route = await Route.findById(routeId);
      if (!route) {
        throw new NotFoundError('Route not found');
      }

      const stops = await Route.getStops(routeId);

      res.status(200).json({
        success: true,
        route: {
          id: route.id,
          name: route.name,
          number: route.number,
        },
        data: stops,
        count: stops.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new route (admin only)
   * POST /api/routes
   */
  static async createRoute(req, res, next) {
    try {
      const { name, number, description, waypoints } = req.body;

      // Validate input
      if (!name || !number || !waypoints) {
        throw new ValidationError(
          'Missing required fields: name, number, waypoints'
        );
      }

      if (!Array.isArray(waypoints) || waypoints.length < 2) {
        throw new ValidationError('Waypoints must be an array with at least 2 points');
      }

      const route = await Route.create(name, number, description, waypoints);

      res.status(201).json({
        success: true,
        message: 'Route created successfully',
        data: route,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update route
   * PATCH /api/routes/:id
   */
  static async updateRoute(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, is_active } = req.body;

      // Verify route exists
      const route = await Route.findById(id);
      if (!route) {
        throw new NotFoundError('Route not found');
      }

      const updated = await Route.update(id, {
        name,
        description,
        is_active,
      });

      res.status(200).json({
        success: true,
        message: 'Route updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default RouteController;
