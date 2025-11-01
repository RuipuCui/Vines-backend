const mediaModel = require('../models/mediaModel');
const { parseS3Url, deleteObject, getObjectFromUrl} = require('../utils/s3Utils');

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
      const fileBuffer = await getObjectFromUrl(mediaUrls.media_url);
      const contentType = mime.lookup(mediaUrls.media_url) || 'application/octet-stream';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'inline; filename="media_' + uploadId + '"' + mime.extension(contentType));
      return res.send(fileBuffer);
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
    const {bucket, key, region} = parseS3Url(mediaDelete.media_url);
    await deleteObject(key)
    console.log('deleted s3 object', bucket, key, region);
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
    const mediaDeletes = await mediaModel.deleteMediaByUserId(userId);
    for(media of mediaDeletes){
      const {bucket, key, region} = parseS3Url(media.media_url);
      console.log('start deleteing s3 object with ', bucket, key, region);
      await deleteObject(key)
      console.log('deleted s3 object', bucket, key, region);
    }

    return res.status(200).json(mediaDeletes);
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
