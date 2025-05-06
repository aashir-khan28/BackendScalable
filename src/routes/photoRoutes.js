const express = require("express");
const { uploadPhoto,  getPhotos,likePhoto, commentPhoto } = require("../controllers/photoController");
const { upload } = require("../config/azureBlob");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post('/photo/share', upload.single('photo'), authMiddleware, uploadPhoto);
router.get('/photos', getPhotos);
router.post('/:id/like', authMiddleware, likePhoto);
router.post('/:id/comment', authMiddleware, commentPhoto);

module.exports = router;
