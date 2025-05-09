if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const photoRoutes = require("./src/routes/photoRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_ORIGIN || "http://localhost:3000",
    "https://frontendscalable-ekazg9bgauhqa8bm.canadacentral-01.azurewebsites.net"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  preflightContinue: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to DB
connectDB();

// Routes
app.get('/', (req, res) => {
  res.send('Share it running');
});
app.use("/api/auth", authRoutes);
app.use("/api/upload", photoRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
