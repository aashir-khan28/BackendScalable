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

app.use(helmet());  // Adds security-related HTTP headers
app.use(compression());  // Compress response bodies for all requests
app.use(morgan("dev"));  // Log HTTP requests to the console

// Middleware
app.use(cors(

  {
    origin: "http://localhost:3000",  // Allow requests from this origin
    methods: ["GET", "POST", "PUT", "DELETE"],  // Allowed HTTP methods
    credentials: true,  // Allow credentials (cookies, authorization headers, etc.)
  preflightContinue: false,  // Preflight requests are automatically handled by the browser
  }

));  // Enable cross-origin requests

// Built-in middleware for parsing JSON and URL-encoded data
app.use(express.json());  // For parsing application/json
app.use(express.urlencoded({ extended: true }));  // For parsing application/x-www-form-urlencoded

// Connect to DB
connectDB();

// Routes
app.get('/', (req, res) => {
  res.send('Photo Sharing App is running successfully!');
});
app.use("/api/auth", authRoutes);
app.use("/api/upload", photoRoutes);

// Error handling middleware for catching errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
