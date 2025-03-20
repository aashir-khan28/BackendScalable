const fs = require("fs");
const { uploadToBlob } = require("../config/azureBlob");
const Photo = require("../models/PhotoModel.js");

exports.uploadPhoto = async (req, res) => {
  try {
    // Get file details
    const filePath = req.file.path;
    const fileName = req.file.filename;

    // Upload the file to Azure Blob Storage
    const blobUrl = await uploadToBlob(filePath, fileName, "photo");

    // Create new photo document
    const newPhoto = new Photo({
      creator: req.user.id,  // Assuming `req.user.id` comes from the auth middleware
      imageUrl: blobUrl,
      title: req.body.title || "",
      caption: req.body.caption || "",
      location: req.body.location || "",
      tags: req.body.tags ? req.body.tags.split(",") : [],
    });

    // Save photo to database
    await newPhoto.save();

    // Clean up temporary file
    fs.unlinkSync(filePath);

    // Respond with success message
    res.status(201).json({
      message: "Photo uploaded successfully",
      photo: newPhoto,
    });

  } catch (error) {
    console.error("Upload error:", error);

    // Clean up temporary file if it exists and there was an error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting temp file:", unlinkError);
      }
    }

    // Respond with error message
    res.status(500).json({
      error: "Photo upload failed",
      details: error.message,
    });
  }
};

exports.likePhoto = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    // Check if the user has already liked the photo
    if (photo.likes.includes(req.user.id)) {
      // Unlike the photo
      photo.likes = photo.likes.filter((userId) => userId.toString() !== req.user.id);
    } else {
      // Like the photo
      photo.likes.push(req.user.id);
    }

    await photo.save();
    res.status(200).json({ message: "Like updated", likes: photo.likes });
  } catch (error) {
    console.error("Like error:", error);
    res.status(500).json({ error: "Failed to update like", details: error.message });
  }
};

exports.commentPhoto = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    const newComment = {
      user: req.user.id,
      text: req.body.text,
    };

    photo.comments.push(newComment);
    await photo.save();

    res.status(201).json({ message: "Comment added", comments: photo.comments });
  } catch (error) {
    console.error("Comment error:", error);
    res.status(500).json({ error: "Failed to add comment", details: error.message });
  }
};
