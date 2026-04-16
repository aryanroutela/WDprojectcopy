const Joi = require("joi");

// Validation schemas
const schemas = {
  // User registration/login
  user: Joi.object({
    firstName: Joi.string().trim().required(),
    lastName: Joi.string().trim().allow(""),
    email: Joi.string()
      .email()
      .lowercase()
      .required()
      .messages({ "string.email": "Invalid email format" }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({ "string.min": "Password must be at least 6 characters" }),
    phone: Joi.string().allow(""),
    role: Joi.string().valid("user", "driver", "admin").default("user"),
  }),

  // Login only
  login: Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().required(),
  }),

  // Bus registration/update (for drivers)
  bus: Joi.object({
    busNumber: Joi.string().trim().required()
      .messages({ "string.empty": "Bus number is required" }),
    routeName: Joi.string().trim().required()
      .messages({ "string.empty": "Route name is required" }),
    source: Joi.string().trim().required()
      .messages({ "string.empty": "Source is required" }),
    destination: Joi.string().trim().required()
      .messages({ "string.empty": "Destination is required" }),
    capacity: Joi.number().integer().min(1).required()
      .messages({ "number.min": "Capacity must be at least 1" }),
    stops: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        sequence: Joi.number().required(),
        arrivalTime: Joi.date().allow(null)
      })
    ).optional(),
  }),

  // Location update (for drivers)
  location: Joi.object({
    busId: Joi.string().required()
      .messages({ "string.empty": "Bus ID is required" }),
    latitude: Joi.number().required()
      .messages({ "number.base": "Latitude must be a number" }),
    longitude: Joi.number().required()
      .messages({ "number.base": "Longitude must be a number" }),
    eta: Joi.number().allow(null),
  }),

  // Contact form
  contact: Joi.object({
    name: Joi.string().trim().required(),
    email: Joi.string().email().lowercase().required(),
    subject: Joi.string().trim().required(),
    message: Joi.string().trim().required(),
  }),

  // Registration pre-registration
  registration: Joi.object({
    firstName: Joi.string().trim().required(),
    lastName: Joi.string().trim().allow(""),
    email: Joi.string().email().lowercase().required(),
    school: Joi.string().trim().required(),
    grade: Joi.string().trim().required(),
    referral: Joi.string().trim().allow(""),
  }),
};

// Middleware factory
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];

    if (!schema) {
      return res.status(500).json({
        success: false,
        message: "Validation schema not found"
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const messages = error.details.map(d => d.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: messages
      });
    }

    // Replace req.body with validated data
    req.body = value;
    next();
  };
};

module.exports = { validate };