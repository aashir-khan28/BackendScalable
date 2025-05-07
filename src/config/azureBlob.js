const { BlobServiceClient } = require("@azure/storage-blob");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

/** 
 * Initialize Azure Blob Storage client and container 
 */
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_CONTAINER_NAME;
if (!connectionString || !containerName) {
  throw new Error("Azure Storage connection string or container name is not set in environment variables.");
}

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

/** 
 * Create a temporary directory for local file uploads 
 */
const tempDir = path.join(__dirname, "../temp-uploads");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/** 
 * Configure Multer for temporary local file storage 
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

/**
 * Generate a fresh SAS token with a reasonable expiration time
 * @returns {Promise<string>} - The generated SAS token
 */
async function generateSasToken() {
  try {
    // Calculate expiration time (30 days from now)
    const expiryTime = new Date();
    expiryTime.setDate(expiryTime.getDate() + 30);
    
    // Define the SAS token permissions and properties
    const sasOptions = {
      containerName: containerName,
      permissions: {
        read: true,  // Read permission
        add: false,
        create: false, 
        write: false,
        delete: false,
        list: false
      },
      expiresOn: expiryTime
    };
    
    // Generate the SAS token
    const sasToken = await containerClient.generateSasUrl(sasOptions);
    
    // Extract just the token part (remove the URL)
    const tokenPart = sasToken.split('?')[1];
    return tokenPart;
  } catch (error) {
    console.error("Error generating SAS token:", error);
    throw error;
  }
}

/** 
 * Upload a file (photo or video) to Azure Blob Storage 
 * @param {string} filePath - Path to the file on local storage
 * @param {string} fileName - Name to be used for the file in Azure Blob Storage
 * @param {string} fileType - Either 'photo' or 'video' to determine folder structure
 * @returns {string} - Public URL of the uploaded file with SAS token
 */
async function uploadToBlob(filePath, fileName, fileType) {
  try {
    const folder = fileType === "video" ? "videos" : "photos";
    const blobName = `${folder}/${fileName}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const uploadOptions = {
      blobHTTPHeaders: { blobContentType: getContentType(fileName) }
    };

    // Upload the file
    await blockBlobClient.uploadFile(filePath, uploadOptions);

    // Generate a fresh SAS token instead of using a static one
    const sasToken = await generateSasToken();
    const fileUrl = `${blockBlobClient.url}?${sasToken}`;

    // Clean up the temporary file after upload
    fs.unlinkSync(filePath);

    return fileUrl;
  } catch (error) {
    console.error("Error uploading to Azure Blob:", error);
    throw new Error(`Failed to upload file to Azure Blob Storage: ${error.message}`);
  }
}

/** 
 * Determine the content type of a file based on its extension 
 * @param {string} filename - Name of the file
 * @returns {string} - MIME type of the file
 */
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".avi": "video/x-msvideo",
    ".mov": "video/quicktime",
    ".mkv": "video/x-matroska"
  };

  return mimeTypes[ext] || "application/octet-stream";
}

module.exports = { upload, uploadToBlob, containerClient, generateSasToken };