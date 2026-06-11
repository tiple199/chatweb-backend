import AppError from "@/utils/appError";
import { UserModel } from "../users/user.model";
import { getUploadProvider, getUploadProviderByName } from "./upload.factory";
import { getAvatarFolder } from "./upload.naming";
import { UploadArtifact, UploadFile } from "./upload.types";

const buildFallbackArtifact = (avatarUrl: string): UploadArtifact | undefined => {
  if (!avatarUrl) {
    return undefined;
  }

  if (avatarUrl.startsWith("/uploads/")) {
    const storageKey = avatarUrl.replace("/uploads/", "");

    return {
      provider: "local",
      url: avatarUrl,
      storageKey,
      folder: storageKey.split("/").slice(0, -1).join("/"),
      resourceType: "image",
      originalName: storageKey.split("/").pop() ?? "avatar",
      mimeType: "",
      size: 0,
    };
  }

  return undefined;
};

export const avatarUploadService = {
  uploadAvatar: async (userId: string, file: UploadFile) => {
    if (!file) {
      throw new AppError("Vui lòng chọn ảnh để tải lên.", 400);
    }

    const existingUser = await UserModel.findById(userId);
    if (!existingUser) {
      throw new AppError("Không tìm thấy người dùng.", 404);
    }

    const provider = getUploadProvider("avatar");
    const artifact = await provider.upload(file, {
      folder: getAvatarFolder(userId),
      resourceType: "image",
      publicIdPrefix: `avatar-${Date.now()}`,
    });

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        avatar: artifact.url,
        avatarProvider: artifact.provider,
        avatarPublicId: artifact.storageKey,
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      throw new AppError("Không tìm thấy người dùng.", 404);
    }

    const oldArtifact = buildFallbackArtifact(existingUser.avatar) ?? {
      provider: (existingUser.avatarProvider as "local" | "cloudinary" | undefined) ?? "local",
      url: existingUser.avatar ?? "",
      storageKey: existingUser.avatarPublicId ?? "",
      folder: getAvatarFolder(userId),
      resourceType: "image" as const,
      originalName: "",
      mimeType: "",
      size: 0,
    };

    if (oldArtifact.storageKey && oldArtifact.storageKey !== artifact.storageKey) {
      try {
        const cleanupProvider = getUploadProviderByName(oldArtifact.provider ?? "local");
        await cleanupProvider.delete?.(oldArtifact);
      } catch (error) {
        console.error("Error deleting old avatar:", error);
      }
    }

    return {
      user: updatedUser,
      upload: artifact,
    };
  },
};
