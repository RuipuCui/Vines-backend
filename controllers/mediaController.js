const mediaModel = require('../models/mediaModel');

const uploadMedia = async (req, res) => {
  console.log("--- start upload media ---")
  const userId = req.user && (req.user.user_id || req.user.id || req.user.uid);
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
    return res.status(201).json(media);
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Failed to upload media' });
  }
};

const getUserMedia = async(req, res) => {
  console.log(`start getting media posted`)
  const userId = req.user && (req.user.user_id || req.user.id || req.user.uid);
  const date = req.query?.date ?? null
  const uploadId = req.query?.uploadId ?? null
  try {
    if(uploadId){
      const mediaUrls = await mediaModel.getMediaByUploadId(uploadId);
      return res.status(200).json(mediaUrls)
    }
    const mediaUrls = await mediaModel.getMediaByUser(userId, date);
    return res.status(200).json(mediaUrls)
  } catch(err){
    console.log("get media error ", err);
    return res.status(500).json({ error: 'Failed to get media'});
  }
    
};

const deleteMediaByUploadId = async(req, res) => {
  console.log( `start delete user ${req.user}'s media` );
  const uploadId = req.query?.uploadId ?? null;
  if(!uploadId){
    return res.status(500).json({ error: 'Failed to delete by upload id'})
  }
  try{
    const mediaDelete = await mediaModel.deleteMediaByUploadId(uploadId);
    return res.status(200).json(mediaDelete);
  }catch(err){
    console.log('delete media error', err);
    return res.status(500).json({ error: 'Failed to delete medias'})
  }
}

const deleteMediaByUserId = async(req, res) => {
  console.log( `start delete user ${req.user}'s media` );
  const userId = req.user && (req.user.user_id || req.user.id || req.user.uid);
  try {
    const mediaDelete = await mediaModel.deleteMediaByUserId(userId);
    return res.status(200).json(mediaDelete);
  }catch(err){
    console.log('delete media error', err);
    return res.status(500).json({ error: 'Failed to delete medias'})
  }
}

module.exports = {
  uploadMedia, 
  getUserMedia,
  deleteMediaByUploadId,
  deleteMediaByUserId,
}
