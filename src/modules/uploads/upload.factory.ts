import { CloudinaryUploadProvider } from "./providers/cloudinary.provider";
import { LocalUploadProvider } from "./providers/local.provider";
import { UploadKind, UploadProvider, UploadProviderName } from "./upload.types";

const normalizeProviderName = (value?: string): UploadProviderName => {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "cloudinary") {
    return "cloudinary";
  }

  return "local";
};

const resolveProviderName = (kind: UploadKind): UploadProviderName => {
  if (kind === "avatar") {
    return normalizeProviderName(process.env.AVATAR_UPLOAD_PROVIDER ?? process.env.UPLOAD_PROVIDER);
  }

  return normalizeProviderName(process.env.ATTACHMENT_UPLOAD_PROVIDER ?? process.env.UPLOAD_PROVIDER);
};

export const getUploadProvider = (kind: UploadKind): UploadProvider => {
  const providerName = resolveProviderName(kind);

  return getUploadProviderByName(providerName);
};

export const getUploadProviderByName = (providerName: UploadProviderName): UploadProvider => {

  if (providerName === "cloudinary") {
    return new CloudinaryUploadProvider();
  }

  return new LocalUploadProvider();
};
