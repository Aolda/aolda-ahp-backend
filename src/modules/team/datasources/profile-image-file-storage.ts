import { createHash } from 'crypto';
import { mkdir, rename, writeFile, unlink } from 'fs/promises';
import { basename, extname, join } from 'path';
import { downloadPublicImage, MAX_PROFILE_IMAGE_BYTES } from './public-image-download';

const DEFAULT_EXTENSION = '.bin';
const DEFAULT_DOWNLOAD_TIMEOUT_MS = 10_000;
const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
  'image/svg+xml': '.svg',
};

export interface StoredProfileImage {
  publicUrl: string;
  localPath: string;
  contentType: string;
  contentHash: string;
  fileSize: number;
}

export class ProfileImageFileStorage {
  constructor(
    private readonly storageDir: string,
    private readonly publicBaseUrl: string,
    private readonly downloadTimeoutMs = DEFAULT_DOWNLOAD_TIMEOUT_MS,
    private readonly download = downloadPublicImage,
  ) {}

  async saveFromUrl(notionPageId: string, imageUrl: string): Promise<StoredProfileImage> {
    const bytes = await this.download(imageUrl, this.downloadTimeoutMs);
    if (!bytes.length || bytes.length > MAX_PROFILE_IMAGE_BYTES) throw new Error('Invalid profile image size');
    const contentType = this.detectImageContentType(bytes);
    // SVG/XML and unrecognized response types must not execute on the administrator's origin.
    if (!contentType || contentType === 'image/svg+xml') throw new Error('Only JPEG, PNG, WEBP, GIF or AVIF images are supported');

    const contentHash = createHash('sha256').update(bytes).digest('hex');
    const extension = this.resolveExtension(contentType, imageUrl);
    const fileName = `${this.safeFileStem(notionPageId)}-${contentHash.slice(0, 16)}${extension}`;
    const localPath = join(this.storageDir, fileName);
    const tmpPath = `${localPath}.tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    await mkdir(this.storageDir, { recursive: true });
    try {
      await writeFile(tmpPath, bytes, { flag: 'wx' });
      await rename(tmpPath, localPath);
    } catch (error) {
      await unlink(tmpPath).catch(() => undefined);
      throw error;
    }

    return {
      publicUrl: this.toPublicUrl(fileName),
      localPath,
      contentType,
      contentHash,
      fileSize: bytes.length,
    };
  }

  private detectImageContentType(bytes: Buffer): string | null {
    if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
      return 'image/jpeg';
    }

    if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
      return 'image/png';
    }

    if (
      bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
      bytes.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return 'image/webp';
    }

    const gifSignature = bytes.subarray(0, 6).toString('ascii');
    if (gifSignature === 'GIF87a' || gifSignature === 'GIF89a') {
      return 'image/gif';
    }

    if (bytes.subarray(4, 12).toString('ascii') === 'ftypavif') {
      return 'image/avif';
    }

    const textStart = bytes.subarray(0, 512).toString('utf8').trimStart().toLowerCase();
    if (textStart.startsWith('<svg') || textStart.startsWith('<?xml')) {
      return 'image/svg+xml';
    }

    return null;
  }

  private resolveExtension(contentType: string, imageUrl: string): string {
    const contentTypeExtension = CONTENT_TYPE_EXTENSIONS[contentType];
    if (contentTypeExtension) {
      return contentTypeExtension;
    }

    try {
      const parsed = new URL(imageUrl);
      const sourceExtension = extname(basename(parsed.pathname)).toLowerCase();
      return sourceExtension || DEFAULT_EXTENSION;
    } catch {
      return DEFAULT_EXTENSION;
    }
  }

  private safeFileStem(value: string): string {
    return value.replace(/[^a-zA-Z0-9_-]/g, '');
  }

  private toPublicUrl(fileName: string): string {
    return `${this.publicBaseUrl.replace(/\/$/, '')}/${fileName}`;
  }
}
