const mediaModel = require('../models/mediaModel');

const uploadMedia = async (req, res) => {
  console.log("--- start upload media ---")
  const { userId } = req.user;
  const { mediaType, localDate } = req.body;
  const mediaUrl = req.file.location;

  try {
    const media = await mediaModel.createMedia({
      userId,
      mediaType,
      mediaUrl,
      localDate
    });
    console.log("media posted to database")
    res.status(201).json(media);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload media' });
  }
};

const getUserMedia = async(req, res) => {
  console.log(`start getting media posted`)
  const { userId } = req.user;
  const date = req.body?.date ?? null;
  console.log(date)
  try {
    const mediaUrls = await mediaModel.getMediaByUser(userId, date);
    res.status(201).json(mediaUrls)
  } catch(err){
    console.log("get media error ", err);
    res.status(500).json({ error: 'Failed to get media'});
  }
    
};

module.exports = {
  uploadMedia, 
  getUserMedia
}
