const { S3Client } = require('@aws-sdk/client-s3');

let r2Client = null;

const getR2Client = () => {
  if (r2Client) return r2Client;

  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_ENDPOINT,
  } = process.env;

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.warn('[Storage] R2 credentials not configured. Media features will be unavailable.');
    return null;
  }

  const endpoint = R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

  r2Client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  console.log('[Storage] Cloudflare R2 client initialized.');
  return r2Client;
};

const getBucketName = () => {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error('R2_BUCKET_NAME is not configured.');
  }
  return bucket;
};

module.exports = { getR2Client, getBucketName };
