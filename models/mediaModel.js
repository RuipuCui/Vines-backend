// CREATE TABLE media_uploads (
//     upload_id SERIAL PRIMARY KEY,
//     user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
//     uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     media_type VARCHAR(10) CHECK (media_type IN ('image', 'video')),
//     media_url TEXT NOT NULL,
//     local_date DATE NOT NULL
// );

const pool = require('../config/db');

// Create a new media upload record
const createMedia = async ({ userId, mediaType, mediaUrl, localDate }) => {
  console.log("start posting media")
  const query = `
    INSERT INTO media_uploads (user_id, media_type, media_url, local_date)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [userId, mediaType, mediaUrl, localDate];
  const res = await pool.query(query, values);
  return res.rows[0];
};

// Get all media uploads for a user, optionally by date
const getMediaByUser = async (userId, date = null) => {
  let query = `
    SELECT * FROM media_uploads
    WHERE user_id = $1
  `;
  const values = [userId];

  if (date) {
    query += ` AND local_date = $2`;
    values.push(date);
  }

  query += ` ORDER BY uploaded_at DESC`;

  const res = await pool.query(query, values);
  return res.rows;
};

const getMediaByUploadId = async (uploadId) => {
  const query = `
    SELECT * FROM media_uploads
    WHERE upload_id = $1
  `;
  const res = await pool.query(query, [uploadId]);
  return res.rows[0];
}

// Delete a media record by ID
const deleteMediaByUploadId = async (uploadId) => {
  const query = `
    DELETE FROM media_uploads
    WHERE upload_id = $1
    RETURNING *;
  `;
  const res = await pool.query(query, [uploadId]);
  return res.rows[0];
};

const deleteMediaByUserId = async (userId) => {
  const query =  `
    DELETE FROM media_uploads
    WHERE user_id = $1
    RETURNING *;
  `;
  const res = await pool.query(query, [userId]);
  return res.rows[0];
}

module.exports = {
  createMedia,
  getMediaByUser,
  deleteMediaByUploadId,
  deleteMediaByUserId,
  getMediaByUploadId
};
