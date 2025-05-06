const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Remove useNewUrlParser as it's no longer required
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true, useUnifiedTopology: true    });
    console.log("MongoDB Connected ❤️🔥");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
