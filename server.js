require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const photoRoutes = require("./src/routes/photoRoutes");

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());  // Enable cross-origin requests
app.use(helmet());  // Adds security-related HTTP headers
app.use(compression());  // Compresses responses
app.use(morgan("dev"));  // Logging requests in development mode

// Built-in middleware for parsing JSON and URL-encoded data
app.use(express.json());  // For parsing application/json
app.use(express.urlencoded({ extended: true }));  // For parsing application/x-www-form-urlencoded

// Connect to DB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/photos", photoRoutes);

// Error handling middleware for catching errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
