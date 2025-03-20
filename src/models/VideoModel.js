const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  title: { type: String },
  caption: String,
  location: String,
  tags: [{ type: String }],
  duration: Number,
  resolution: String,
  format: String,
  createdAt: { type: Date, default: Date.now },
});

// Compound index on title, tags, and createdAt for optimized search and filtering
VideoSchema.index({ title: 1, tags: 1, createdAt: -1 });

module.exports = mongoose.model("Video", VideoSchema);
