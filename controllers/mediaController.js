const mediaModel = require('../models/mediaModel');

const uploadMedia = async (req, res) => {
  const { userId } = req.user;  // from auth middleware
  const { mediaType, localDate } = req.body;
  const mediaUrl = req.file.location;  // assuming uploaded to S3 via multer

  try {
    const media = await mediaModel.createMedia({
      userId,
      mediaType,
      mediaUrl,
      localDate
    });
    res.status(201).json(media);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload media' });
  }
};

const getUserMedia = async(req, res) => {
    
};

module.exports = {
  uploadMedia, 
  getUserMedia
}
