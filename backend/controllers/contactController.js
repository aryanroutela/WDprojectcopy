const Contact = require("../models/Contact");

const submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    // For now, just log and send response
    // Later you can add email sending functionality
    console.log("Contact Form Submission:", {
      name,
      email,
      subject,
      message,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: "Thank you for contacting us! We'll get back to you soon. 📧"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitContact };