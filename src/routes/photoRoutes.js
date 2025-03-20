const express = require("express");
const { uploadPhoto, likePhoto, commentPhoto } = require("../controllers/photoController");
const { upload } = require("../config/azureBlob");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post('/upload/photo', authMiddleware, upload.single('photo'), uploadPhoto);
router.post('/:id/like', authMiddleware, likePhoto);
router.post('/:id/comment', authMiddleware, commentPhoto);

module.exports = router;
