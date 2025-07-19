import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { randomBytes } from 'crypto';
import { AuthRequest } from '../types/express';
const UPLOADS_DIR: string = process.env.UPLOADS_DIR || 'uploads';
const ALLOWED_FILE_TYPES: string[] = process.env.ALLOWED_FILE_TYPES
  ? process.env.ALLOWED_FILE_TYPES.split(',')
  : ['image/jpeg', 'image/png', 'image/jpg'];
const MAX_FILE_SIZE: number = parseInt(
  process.env.MAX_FILE_SIZE || '5242880',
  10
);
const ensureUploadDir = async (): Promise<void> => {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
};
ensureUploadDir().catch((err) =>
  console.error('Failed to create uploads directory:', err)
);
const storage = multer.diskStorage({
  destination: (
    _req: AuthRequest,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (
    _req: AuthRequest,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueSuffix = randomBytes(8).toString('hex');
    const sanitizedName = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9]/g, '-');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${uniqueSuffix}-${sanitizedName}${ext}`);
  },
});
const fileFilter = async (
  req: AuthRequest,
  file: Express.Multer.File,
  cb: FileFilterCallback
): Promise<void> => {
  try {
    console.log(file.mimetype);
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      return cb(
        new Error(
          `Invalid file type. Only ${ALLOWED_FILE_TYPES.join(
            ', '
          )} are allowed.`
        )
      );
    }
    cb(null, true);
  } catch (error: any) {
    cb(new Error(`Error validating file: ${error.message}`));
  }
};
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});
