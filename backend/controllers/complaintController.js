const Complaint = require("../models/Complaint");
const Bus = require("../models/Bus");

// Create a new complaint (User)
exports.createComplaint = async (req, res, next) => {
  try {
    const { busNumber, description, rating } = req.body;

    // Try to find if a driver is currently assigned to this bus
    const bus = await Bus.findOne({ busNumber, status: "active" });
    let driverId = null;
    if (bus) {
      driverId = bus.driverId;
    }

    const complaint = new Complaint({
      userId: req.userId,
      busNumber,
      driverId,
      description,
      rating
    });

    await complaint.save();

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      complaint
    });
  } catch (error) {
    next(error);
  }
};

// Get all complaints (Admin)
exports.getAllComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find()
      .populate("userId", "firstName lastName email phone")
      .populate("driverId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    next(error);
  }
};

// Update complaint status (Admin)
exports.updateComplaintStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    // Status validation based on schema enum
    if (!["open", "investigating", "resolved", "dismissed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Complaint status updated",
      complaint
    });
  } catch (error) {
    next(error);
  }
};
