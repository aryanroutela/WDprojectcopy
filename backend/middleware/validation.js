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
  }),

  // Login only
  login: Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().required(),
  }),

  // Bus data
  bus: Joi.object({
    busNumber: Joi.string().trim().required(),
    routeName: Joi.string().trim().required(),
    capacity: Joi.number().min(1).required(),
    seatsAvailable: Joi.number().min(0).required(),
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