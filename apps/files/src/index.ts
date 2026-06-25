import express from 'express';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const app = express();
app.use(express.json());

// In production, this would upload to S3/R2
const mockS3Upload = async (filename: string, data: Buffer) => {
  console.log(`[S3 Mock] Uploaded ${filename} (${data.length} bytes)`);
  return `https://s3.mock.logger.bot/${filename}`;
};

app.post('/api/v1/files/upload', async (req, res) => {
  const { guildId, channelId, fileId, fileUrl } = req.body;

  if (!guildId || !channelId || !fileId || !fileUrl) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Download file
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uncompressedSize = buffer.length;

    // 2. Gzip Compress
    const compressed = await gzip(buffer);

    // 3. AES-256-GCM Encrypt
    // Key derivation matching the SKILL.md specification
    const keyMaterial = `${guildId}${channelId}${fileId}${uncompressedSize}`;
    const encryptionKey = crypto.createHash('sha256').update(keyMaterial).digest();
    
    // GCM requires a 12-byte initialization vector
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
    
    const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // We store the IV + AuthTag + Encrypted data together
    const finalBlob = Buffer.concat([iv, authTag, encrypted]);

    // 4. Upload to Storage
    const storageUrl = await mockS3Upload(`${fileId}.enc`, finalBlob);

    res.json({ success: true, storageUrl, size: finalBlob.length });
  } catch (error) {
    console.error('File upload failed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Run on a fixed internal port so it doesn't conflict with Next.js grabbing Railway's public process.env.PORT
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Files microservice running internally on port ${PORT}`);
});
