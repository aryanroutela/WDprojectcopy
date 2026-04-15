const Registration = require("../models/registerSchema");

const createRegistration = async (req, res, next) => {
  try {
    const { firstName, lastName, email, school, grade, referral } = req.body;

    // Check for duplicates
    const existingReg = await Registration.findOne({ email });
    if (existingReg) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered"
      });
    }

    const newRegistration = new Registration({
      firstName,
      lastName,
      email,
      school,
      grade,
      referral
    });

    await newRegistration.save();

    res.status(201).json({
      success: true,
      message: "Registration successful! 🎉",
      registration: {
        id: newRegistration._id,
        email: newRegistration.email,
        status: newRegistration.status
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAllRegistrations = async (req, res, next) => {
  try {
    const registrations = await Registration.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      registrations
    });
  } catch (error) {
    next(error);
  }
};

const getRegistrationById = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found"
      });
    }

    res.status(200).json({
      success: true,
      registration
    });
  } catch (error) {
    next(error);
  }
};

const updateRegistrationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Registration status updated",
      registration
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRegistration,
  getAllRegistrations,
  getRegistrationById,
  updateRegistrationStatus
};