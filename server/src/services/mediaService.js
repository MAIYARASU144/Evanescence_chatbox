const {
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { getR2Client, getBucketName } = require('../config/storage');
const Media = require('../models/Media');
const { generateStorageKey } = require('../utils/tokenGenerator');

const MAX_IMAGE_BYTES = parseInt(process.env.MAX_IMAGE_SIZE_MB || '10', 10) * 1024 * 1024;
const MAX_VIDEO_BYTES = parseInt(process.env.MAX_VIDEO_SIZE_MB || '100', 10) * 1024 * 1024;
const SIGNED_URL_EXPIRY = parseInt(process.env.SIGNED_URL_EXPIRY_SECONDS || '300', 10);

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

/**
 * Validate file info and generate a presigned PUT URL for direct browser upload to R2.
 * The browser uploads directly — the Node server never buffers the file.
 */
const generateUploadUrl = async ({ sessionId, participantId, originalName, mimeType, size }) => {
  const r2 = getR2Client();
  if (!r2) throw Object.assign(new Error('Media storage is not configured.'), { code: 'STORAGE_UNAVAILABLE' });

  // Validate MIME type
  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw Object.assign(new Error(`File type not allowed: ${mimeType}`), { code: 'INVALID_TYPE' });
  }

  const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(mimeType);
  const mediaType = isImage ? 'image' : 'video';

  // Validate size
  const maxSize = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (size > maxSize) {
    const maxMB = isImage
      ? process.env.MAX_IMAGE_SIZE_MB || '10'
      : process.env.MAX_VIDEO_SIZE_MB || '100';
    throw Object.assign(
      new Error(`File too large. Maximum size for ${mediaType}: ${maxMB}MB`),
      { code: 'TOO_LARGE' }
    );
  }

  // Validate file extension matches MIME type
  const ext = originalName.split('.').pop()?.toLowerCase();
  const validExtensions = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'video/mp4': ['mp4'],
    'video/webm': ['webm'],
    'video/ogg': ['ogg', 'ogv'],
    'video/quicktime': ['mov'],
  };

  if (!ext || !validExtensions[mimeType]?.includes(ext)) {
    throw Object.assign(
      new Error(`File extension does not match MIME type.`),
      { code: 'EXTENSION_MISMATCH' }
    );
  }

  const storageKey = generateStorageKey(sessionId);
  const bucket = getBucketName();

  // Create a placeholder Media record (unconfirmed) before generating the URL
  const media = new Media({
    sessionId,
    uploaderParticipantId: participantId,
    type: mediaType,
    originalName: originalName.substring(0, 255),
    mimeType,
    size,
    storageKey,
    confirmed: false,
  });
  await media.save();

  // Generate presigned PUT URL — browser uploads directly to R2
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    ContentType: mimeType,
    ContentLength: size,
  });

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 900 }); // 15 min to complete upload

  return {
    uploadUrl,
    mediaId: media._id.toString(),
    storageKey,
  };
};

/**
 * Confirm that the browser has completed uploading a file to R2.
 * Verifies the object exists in R2 before marking confirmed.
 */
const confirmUpload = async ({ mediaId, sessionId, participantId }) => {
  const r2 = getR2Client();
  if (!r2) throw new Error('Media storage is not configured.');

  const media = await Media.findOne({
    _id: mediaId,
    sessionId,
    uploaderParticipantId: participantId,
    confirmed: false,
  });

  if (!media) throw Object.assign(new Error('Media not found or already confirmed.'), { code: 'NOT_FOUND' });

  // Verify the object actually exists in R2
  try {
    await r2.send(new HeadObjectCommand({ Bucket: getBucketName(), Key: media.storageKey }));
  } catch (err) {
    throw Object.assign(new Error('Upload not found in storage. Please try again.'), { code: 'UPLOAD_MISSING' });
  }

  media.confirmed = true;
  await media.save();

  return media;
};

/**
 * Generate a short-lived presigned GET URL for downloading media.
 * Verifies participant belongs to the session and media belongs to session.
 */
const generateDownloadUrl = async ({ mediaId, sessionId }) => {
  const r2 = getR2Client();
  if (!r2) throw new Error('Media storage is not configured.');

  const media = await Media.findOne({ _id: mediaId, sessionId, confirmed: true });
  if (!media) throw Object.assign(new Error('Media not found.'), { code: 'NOT_FOUND' });

  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: media.storageKey,
  });

  // Use GetObjectCommand for download
  const { GetObjectCommand } = require('@aws-sdk/client-s3');
  const getCommand = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: media.storageKey,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(media.originalName)}"`,
  });

  const downloadUrl = await getSignedUrl(r2, getCommand, { expiresIn: SIGNED_URL_EXPIRY });

  return { downloadUrl, expiresIn: SIGNED_URL_EXPIRY };
};

/**
 * Delete all media for a session from both R2 and MongoDB.
 * Idempotent — safe to call multiple times.
 */
const deleteSessionMedia = async (sessionId) => {
  const r2 = getR2Client();
  const mediaRecords = await Media.find({ sessionId });

  if (mediaRecords.length === 0) {
    console.log(`[MediaService] No media to delete for session ${sessionId}`);
    return 0;
  }

  let deletedCount = 0;
  const failedKeys = [];

  if (r2) {
    const bucket = getBucketName();

    // Batch delete from R2 (max 1000 per request)
    const chunkSize = 1000;
    for (let i = 0; i < mediaRecords.length; i += chunkSize) {
      const chunk = mediaRecords.slice(i, i + chunkSize);
      const objects = chunk.map((m) => ({ Key: m.storageKey }));

      try {
        await r2.send(new DeleteObjectsCommand({ Bucket: bucket, Objects: objects }));
        deletedCount += chunk.length;
      } catch (err) {
        console.error(`[MediaService] Failed to batch-delete R2 objects:`, err.message);
        // Track failures for retry
        failedKeys.push(...objects.map((o) => o.Key));
      }
    }

    // Retry failed individual deletions
    for (const key of failedKeys) {
      try {
        await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
        deletedCount++;
      } catch (err) {
        console.error(`[MediaService] Failed to delete R2 object ${key}:`, err.message);
      }
    }
  } else {
    console.warn('[MediaService] R2 not configured — skipping R2 deletion.');
  }

  // Delete all media metadata from MongoDB (even if R2 deletion partially failed)
  await Media.deleteMany({ sessionId });
  console.log(`[MediaService] Deleted ${mediaRecords.length} media records for session ${sessionId}`);

  return mediaRecords.length;
};

module.exports = {
  generateUploadUrl,
  confirmUpload,
  generateDownloadUrl,
  deleteSessionMedia,
};
