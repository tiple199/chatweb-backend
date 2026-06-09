import path from "path";

const safeSegment = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const stripExt = (fileName: string) => {
  const extension = path.extname(fileName);
  return path.basename(fileName, extension);
};

export const buildStorageKey = (folder: string, originalName: string) => {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const baseName = safeSegment(stripExt(originalName)) || "file";
  const extension = path.extname(originalName).toLowerCase();
  const normalizedFolder = folder
    .split(path.sep)
    .join("/")
    .replace(/^\/+|\/+$/g, "");

  return `${normalizedFolder}/${baseName}-${uniqueSuffix}${extension}`;
};

export const toPublicUrl = (storageKey: string) =>
  `/uploads/${storageKey.split(path.sep).join("/")}`;

export const getAvatarFolder = (userId: string) => `users/${userId}/avatar`;

export const getAttachmentFolder = (conversationId: string, kind: string) =>
  `conversations/${conversationId}/${kind}`;
