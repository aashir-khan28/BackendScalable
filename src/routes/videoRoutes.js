const express = require("express");
const { uploadVideo } = require("../controllers/videoController");
const { upload } = require("../config/azureBlob");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// POST endpoint for uploading videos
router.post('/upload/video', authMiddleware, upload.single('video'), uploadVideo);

module.exports = router;
