const fs = require("fs");
const { uploadToBlob } = require("../config/azureBlob");
const Video = require("../models/VideoModel.js");

exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Get file details
    const filePath = req.file.path;
    const fileName = req.file.filename;

    // Upload the file to Azure Blob Storage
    const blobUrl = await uploadToBlob(filePath, fileName, "video");

    // Create new video document
    const newVideo = new Video({
      creator: req.user.id,  // Assuming `req.user.id` comes from the auth middleware
      videoUrl: blobUrl,
      title: req.body.title || "",
      caption: req.body.caption || "",
      location: req.body.location || "",
      tags: req.body.tags ? req.body.tags.split(",") : [],
      duration: req.body.duration || 0,  // Duration of the video in seconds
      resolution: req.body.resolution || "1080p",  // Default resolution
      format: req.body.format || "mp4",  // Default format
    });

    // Save to database
    await newVideo.save();

    // Clean up temporary file
    fs.unlinkSync(filePath);

    res.status(201).json({
      message: "Video uploaded successfully",
      video: newVideo,
    });

  } catch (error) {
    console.error("Upload error:", error);

    // Clean up file if it exists and there was an error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting temp file:", unlinkError);
      }
    }

    res.status(500).json({
      error: "Video upload failed",
      details: error.message,
    });
  }
};


exports.listVideos = asyncHandler(async (req, res) => {
    const {
      keyword,
      tags,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortDirection = -1,
    } = req.query;
  
    const _videoMatchStagePipeline = [
      {
        $match: {
          $or: [
            {
              title: {
                $regex: new RegExp(keyword, "i"), 
              },
            },
            {
              tags: {
                $in: tags ? tags.split(",") : [], 
              },
            },
          ],
        },
      },
    ];
  
    const videos = await Video.aggregate([
      {
        $facet: {
          data: [
            ..._videoMatchStagePipeline,
            { $sort: { [sortBy]: parseInt(sortDirection) } },
            { $skip: (parseInt(page) - 1) * parseInt(limit) },
            { $limit: parseInt(limit) },
          ],
          count: [..._videoMatchStagePipeline, { $count: "matched_videos" }],
        },
      },
    ]);
  
    const populatedVideos = await Video.populate(videos[0]?.data, [
      {
        path: "creator",
        select: "name email", 
      },
    ]);
  
    res.status(200).json({
      data: populatedVideos,
      totalItems: videos[0]?.count[0]?.matched_videos ?? 0,
    });
  });
