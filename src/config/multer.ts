import multer from "multer";

const memoryStorage = multer.memoryStorage();

const imageOnlyFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!file.mimetype.startsWith("image/")) {
    cb(new Error("Only image formats are supported for avatars."));
    return;
  }

  cb(null, true);
};

const anyFileFilter = (_req: Express.Request, _file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  cb(null, true);
};

export const avatarUpload = multer({
  storage: memoryStorage,
  fileFilter: imageOnlyFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const attachmentUpload = multer({
  storage: memoryStorage,
  fileFilter: anyFileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
});