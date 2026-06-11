export type UploadProviderName = "local" | "cloudinary";
export type UploadResourceType = "image" | "video" | "raw";
export type UploadKind = "avatar" | "attachment";
export type AttachmentKind = "image" | "video" | "file";

export interface UploadFile extends Express.Multer.File {
  buffer: Buffer;
}

export interface UploadRequestContext {
  kind: UploadKind;
  ownerId: string;
  conversationId?: string;
  attachmentKind?: AttachmentKind;
}

export interface UploadOptions {
  folder: string;
  resourceType: UploadResourceType;
  publicIdPrefix: string;
}

export interface UploadArtifact {
  provider: UploadProviderName;
  url: string;
  storageKey: string;
  folder: string;
  resourceType: UploadResourceType;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface UploadProvider {
  upload(file: UploadFile, options: UploadOptions): Promise<UploadArtifact>;
  delete?(artifact: UploadArtifact): Promise<void>;
}
