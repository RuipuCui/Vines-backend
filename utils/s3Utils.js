// utils/s3Service.js
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} = require('@aws-sdk/client-s3');
const { createReadStream } = require('fs');
const path = require('path');
const mime = require('mime-types');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_BUCKET_NAME;

function parseS3Url(url) {
  try {
    const parsedUrl = new URL(url);

    // Example hostname: your-bucket-name.s3.ap-southeast-2.amazonaws.com
    const [bucket, , region] = parsedUrl.hostname.split('.');

    const key = decodeURIComponent(parsedUrl.pathname).substring(1); // remove leading "/"

    return {
      bucket,
      key,
      region
    };
  } catch (err) {
    throw new Error('Invalid S3 URL');
  }
}


/** Upload any buffer/stream/string to S3 */
async function putObject({ key, body, contentType}) {
  if (!key) throw new Error('putObject: key is required');
  if (!body) throw new Error('putObject: body is required');

  const ct =
    contentType ||
    mime.lookup(key) ||
    'application/octet-stream';

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: ct,
    })
  );

  const url = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  return { key, url };
}

/** Convenience: upload from a local file path */
async function putFile(filePath, key) {
  const finalKey =
    key || `uploads/${Date.now()}_${path.basename(filePath)}`;
  return putObject({
    key: finalKey,
    body: createReadStream(filePath),
    contentType: mime.lookup(filePath) || undefined,
  });
}

/** Delete a single S3 object */
async function deleteObject(key) {
  if (!key) throw new Error('deleteObject: key is required');
  await s3.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  );
  return { key, deleted: true };
}

/** Delete many objects in one call */
async function deleteObjects(keys = []) {
  if (!keys.length) return { deleted: 0, errors: [] };
  const res = await s3.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: keys.map((k) => ({ Key: k })) },
    })
  );
  return {
    deleted: (res.Deleted || []).length,
    errors: res.Errors || [],
  };
}

module.exports = { 
  putObject, 
  putFile, 
  deleteObject, 
  deleteObjects,
  parseS3Url, 
};
