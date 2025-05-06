const { uploadToBlob } = require("../config/azureBlob");
const Photo = require("../models/PhotoModel");
const fs = require("fs");
const path = require("path");

// Ensure local storage directory exists
const LOCAL_UPLOAD_DIR = path.join(__dirname, '../uploads/photos');
if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
}

exports.uploadPhoto = async (req, res) => {
  const filePath = req.file.path;
  const fileName = req.file.filename;
  const localFilePath = path.join(LOCAL_UPLOAD_DIR, fileName);

  try {
    let imageUrl;
    let storageMethod = 'azure';

    try {
      // Attempt to upload to Azure Blob Storage
      imageUrl = await uploadToBlob(filePath, fileName, "photo");
    } catch (azureError) {
      console.error("Azure upload failed:", azureError);
      
      // Fallback to local storage
      try {
        // Copy file to local upload directory
        fs.copyFileSync(filePath, localFilePath);
        imageUrl = `/uploads/photos/${fileName}`;
        storageMethod = 'local';
        console.log("File saved locally as backup");
      } catch (localSaveError) {
        console.error("Local file save failed:", localSaveError);
        throw new Error("Both Azure and local storage upload failed");
      }
    }

    // Create a new photo document and save it to the database
    const newPhoto = new Photo({
      creator: req.user.id,
      imageUrl: imageUrl,
      title: req.body.title || "",
      caption: req.body.caption || "",
      location: req.body.location || "",
      tags: req.body.tags ? req.body.tags.split(",") : [],
      storageMethod: storageMethod // New field to track storage method
    });

    await newPhoto.save();

    // Clean up the temporary file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(201).json({
      message: `Photo uploaded successfully via ${storageMethod} storage`,
      photo: newPhoto,
      storageMethod: storageMethod
    });

  } catch (error) {
    console.error("Upload error:", error);

    // Clean up temporary and potentially copied files
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    res.status(500).json({
      error: "Photo upload failed",
      details: error.message,
    });
  }
};


// get all photos with pagination and filtering and search

exports.getPhotos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'latest';

    // Build search query
    const searchQuery = search 
      ? { 
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { caption: { $regex: search, $options: 'i' } }
          ] 
        } 
      : {};

    // Determine sort order
    const sortOptions = sortBy === 'latest' 
      ? { createdAt: -1 } 
      : { createdAt: 1 };

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Fetch total count of documents
    const totalPhotos = await Photo.countDocuments(searchQuery);

    // Fetch paginated photos
    const photos = await Photo.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('creator', 'email') // Optional: populate creator details
      .lean(); // Convert to plain JavaScript object for flexibility

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalPhotos / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      photos,
      pagination: {
        currentPage: page,
        totalPages,
        totalPhotos,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });
  } catch (error) {
    console.error("Get photos error:", error);
    res.status(500).json({ 
      error: "Failed to fetch photos", 
      details: error.message 
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
