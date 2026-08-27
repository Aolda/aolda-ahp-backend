import { lookup } from 'node:dns/promises';
import { get } from 'node:https';
import { BlockList, isIP } from 'node:net';

export const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
const blocked = new BlockList();
for (const [network, prefix] of [['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16],
  ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4]] as const) blocked.addSubnet(network, prefix);

export function isPublicImageAddress(address: string): boolean {
  // Only public IPv4 is used. IPv6-only hosts fail closed, including mapped IPv4/metadata addresses.
  return isIP(address) === 4 && !blocked.check(address);
}
export function validateImageUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || url.hostname.includes(':')) throw new Error('Only public HTTPS image URLs are supported');
  if (isIP(url.hostname) && !isPublicImageAddress(url.hostname)) throw new Error('Private image addresses are not allowed');
  return url;
}

export async function downloadPublicImage(value: string, timeoutMs: number): Promise<Buffer> {
  const deadline = Date.now() + timeoutMs;
  let url = validateImageUrl(value);
  for (let redirect = 0; redirect <= 3; redirect++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error('Image download timed out');
    let timer: NodeJS.Timeout | undefined;
    const addresses = await Promise.race([
      lookup(url.hostname, { family: 4, all: true }),
      new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error('Image lookup timed out')), remaining); }),
    ]).finally(() => clearTimeout(timer));
    if (!addresses.length || addresses.some((x) => !isPublicImageAddress(x.address))) throw new Error('Private image addresses are not allowed');
    if (Date.now() >= deadline) throw new Error('Image download timed out');
    const response = await new Promise<import('node:http').IncomingMessage>((resolve, reject) => {
      const request = get(url, {
        signal: AbortSignal.timeout(Math.max(1, deadline - Date.now())),
        // Pin the validated DNS answer; never resolve again at connection time (DNS rebinding).
        lookup: (_hostname, options, callback) => {
          const pinned = addresses[0];
          if ((options as { all?: boolean }).all) (callback as Function)(null, [pinned]);
          else callback(null, pinned.address, 4);
        },
        headers: { accept: 'image/jpeg,image/png,image/webp,image/gif,image/avif' },
      }, resolve);
      request.on('error', reject);
    });
    if ([301, 302, 303, 307, 308].includes(response.statusCode ?? 0)) {
      response.destroy();
      if (!response.headers.location) throw new Error('Image redirect has no destination');
      url = validateImageUrl(new URL(response.headers.location, url).href);
      continue;
    }
    if (response.statusCode !== 200 || Number(response.headers['content-length']) > MAX_PROFILE_IMAGE_BYTES) {
      response.destroy(); throw new Error('Image download rejected');
    }
    let size = 0;
    const chunks: Buffer[] = [];
    for await (const chunk of response) {
      size += chunk.length;
      if (size > MAX_PROFILE_IMAGE_BYTES) { response.destroy(); throw new Error('Profile image exceeds 5MB'); }
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
  throw new Error('Too many image redirects');
}
