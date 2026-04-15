require("dotenv").config();
const mongoose = require("mongoose");
const Bus = require("../models/Bus");
const User = require("../models/User");
const connectDB = require("../config/db");

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Bus.deleteMany({});
    await User.deleteMany({});

    console.log("🧹 Cleared existing data");

    // Create admin user
    const admin = new User({
      firstName: "Admin",
      lastName: "User",
      email: "admin@routeflow.com",
      password: "admin123",
      role: "admin"
    });

    await admin.save();
    console.log("👤 Admin user created");

    // Seed buses
    const buses = [
      {
        busNumber: "RB-001",
        routeName: "City Center - Airport",
        capacity: 50,
        seatsAvailable: 35,
        status: "active"
      },
      {
        busNumber: "RB-002",
        routeName: "Railway Station - Mall",
        capacity: 50,
        seatsAvailable: 12,
        status: "active"
      },
      {
        busNumber: "RB-003",
        routeName: "Hospital - University",
        capacity: 45,
        seatsAvailable: 5,
        status: "active"
      },
      {
        busNumber: "RB-004",
        routeName: "Downtown - Suburbs",
        capacity: 50,
        seatsAvailable: 0,
        status: "active"
      },
      {
        busNumber: "RB-005",
        routeName: "Market - Residential",
        capacity: 40,
        seatsAvailable: 28,
        status: "active"
      }
    ];

    await Bus.insertMany(buses);
    console.log("🚌 5 buses seeded successfully");

    console.log(`
✅ Database seeding complete!

Admin Credentials:
📧 Email: admin@routeflow.com
🔐 Password: admin123

Buses Created: 5
    `);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

seedData();