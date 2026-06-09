import AppError from "@/utils/appError";
import { getUploadProvider } from "./upload.factory";
import { getAttachmentFolder } from "./upload.naming";
import { AttachmentKind, UploadArtifact, UploadFile } from "./upload.types";

const detectAttachmentKind = (mimeType: string): AttachmentKind => {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  return "file";
};

export const attachmentUploadService = {
  uploadAttachment: async (conversationId: string, file: UploadFile): Promise<UploadArtifact & { attachmentKind: AttachmentKind }> => {
    if (!file) {
      throw new AppError("Message content is required", 400);
    }

    const attachmentKind = detectAttachmentKind(file.mimetype);
    const provider = getUploadProvider("attachment");
    const artifact = await provider.upload(file, {
      folder: getAttachmentFolder(conversationId, `${attachmentKind}s`),
      resourceType: attachmentKind === "file" ? "raw" : attachmentKind,
      publicIdPrefix: `${attachmentKind}-${Date.now()}`,
    });

    return {
      ...artifact,
      attachmentKind,
    };
  },
};
