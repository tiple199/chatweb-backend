import path from "path";
import fs from "fs/promises";
import { UploadArtifact, UploadFile, UploadOptions, UploadProvider } from "../upload.types";
import { buildStorageKey, toPublicUrl } from "../upload.naming";

const localUploadRoot = process.env.LOCAL_UPLOAD_ROOT ?? "uploads";

export class LocalUploadProvider implements UploadProvider {
  async upload(file: UploadFile, options: UploadOptions): Promise<UploadArtifact> {
    await fs.mkdir(localUploadRoot, { recursive: true });

    const storageKey = buildStorageKey(options.folder, file.originalname);
    const absolutePath = path.join(localUploadRoot, ...storageKey.split("/"));
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });

    const buffer = file.buffer;
    if (!buffer) {
      throw new Error("Uploaded file is missing buffer data.");
    }

    await fs.writeFile(absolutePath, buffer);

    return {
      provider: "local",
      url: toPublicUrl(storageKey),
      storageKey,
      folder: options.folder,
      resourceType: options.resourceType,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async delete(artifact: UploadArtifact): Promise<void> {
    const absolutePath = path.join(localUploadRoot, ...artifact.storageKey.split("/"));
    await fs.unlink(absolutePath).catch(() => undefined);
  }
}
