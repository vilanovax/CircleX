/** Shared user-photo pipeline for listings, chat, and later uploads. */

/** Longest edge after resize (listing gallery + chat bubble). */
export const PHOTO_MAX_EDGE = 1280;

/** JPEG bytes written to disk / accepted after encode. */
export const PHOTO_MAX_BYTES = 900_000;

/** Raw camera file before encode (iPhone HEIC/JPEG). */
export const PHOTO_UPLOAD_MAX_BYTES = 12_000_000;

export const LISTING_PHOTO_MAX_COUNT = 5;

export const UPLOAD_PATH_RE = /^\/api\/uploads\/[a-zA-Z0-9._-]+\.jpe?g$/i;
