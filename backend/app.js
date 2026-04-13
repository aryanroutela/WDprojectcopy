const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const registrationRoutes = require("./routes/registrationRoutes");

const app = express();

connectDB();

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
};
app.use(cors(corsOptions));
app.use(express.json());

app.use("/api", registrationRoutes);

app.get("/", (req, res) => {
  res.json({ message: "AI Debate Arena Backend chal raha hai!" });
});

module.exports = app;
