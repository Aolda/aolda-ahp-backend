import { createHash } from 'crypto';
import { mkdir, rename, writeFile } from 'fs/promises';
import { basename, extname, join } from 'path';

const DEFAULT_EXTENSION = '.bin';
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
  ) {}

  async saveFromUrl(notionPageId: string, imageUrl: string): Promise<StoredProfileImage> {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to download profile image: ${response.status} ${response.statusText}`);
    }

    const responseContentType = this.normalizeContentType(response.headers.get('content-type'));
    const bytes = Buffer.from(await response.arrayBuffer());
    const detectedContentType = this.detectImageContentType(bytes);
    const contentType =
      detectedContentType ?? this.resolveTrustedResponseImageContentType(responseContentType);

    if (!contentType) {
      throw new Error(`Profile image response is not an image: ${responseContentType}`);
    }

    const contentHash = createHash('sha256').update(bytes).digest('hex');
    const extension = this.resolveExtension(contentType, imageUrl);
    const fileName = `${this.safeFileStem(notionPageId)}-${contentHash.slice(0, 16)}${extension}`;
    const localPath = join(this.storageDir, fileName);
    const tmpPath = `${localPath}.tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    await mkdir(this.storageDir, { recursive: true });
    await writeFile(tmpPath, bytes, { flag: 'wx' });
    await rename(tmpPath, localPath);

    return {
      publicUrl: this.toPublicUrl(fileName),
      localPath,
      contentType,
      contentHash,
      fileSize: bytes.length,
    };
  }

  private normalizeContentType(value: string | null): string {
    return value?.split(';')[0]?.trim().toLowerCase() || 'application/octet-stream';
  }

  private resolveTrustedResponseImageContentType(contentType: string): string | null {
    if (!contentType.startsWith('image/')) {
      return null;
    }

    return contentType;
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
