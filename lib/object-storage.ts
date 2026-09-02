import {
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { mediaPublicBaseUrl } from "./media";

type ObjectStorageConfig = {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  forcePathStyle: boolean;
  publicBaseUrl: string;
};

let cachedClient: S3Client | null = null;
let cachedConfigKey = "";

function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getObjectStorageConfig(): ObjectStorageConfig | null {
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const bucket = process.env.S3_BUCKET?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY?.trim();
  const secretAccessKey = process.env.S3_SECRET_KEY?.trim();
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null;

  const publicBaseUrl = trimSlash(
    process.env.S3_PUBLIC_URL?.trim() ||
      mediaPublicBaseUrl() ||
      endpoint,
  );

  return {
    endpoint: trimSlash(endpoint),
    bucket,
    accessKeyId,
    secretAccessKey,
    region: process.env.S3_REGION?.trim() || "us-east-1",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "0",
    publicBaseUrl,
  };
}

export function isObjectStorageConfigured(): boolean {
  return getObjectStorageConfig() !== null;
}

function getClient(config: ObjectStorageConfig): S3Client {
  const key = `${config.endpoint}|${config.region}|${config.forcePathStyle}|${config.accessKeyId}`;
  if (cachedClient && cachedConfigKey === key) return cachedClient;
  const opts: S3ClientConfig = {
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  };
  cachedClient = new S3Client(opts);
  cachedConfigKey = key;
  return cachedClient;
}

export function publicObjectUrl(key: string): string {
  const config = getObjectStorageConfig();
  if (!config) {
    throw new Error("فضای ابری پیکربندی نشده است");
  }
  const path = key.replace(/^\/+/, "");
  return `${config.publicBaseUrl}/${path}`;
}

/** Upload JPEG bytes to the configured S3-compatible bucket; returns public HTTPS URL. */
export async function putPublicJpeg(
  key: string,
  body: Buffer,
): Promise<string> {
  const config = getObjectStorageConfig();
  if (!config) {
    throw new Error("فضای ابری پیکربندی نشده است");
  }
  const client = getClient(config);
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key.replace(/^\/+/, ""),
      Body: body,
      ContentType: "image/jpeg",
      ACL: "public-read",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return publicObjectUrl(key);
}
