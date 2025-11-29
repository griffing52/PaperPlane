import multer from "multer";
import { PrismaClient } from "@prisma/client";

export const PORT = process.env.PORT || 3002;

// TODO: Replace with actual auth-based emailHash lookup once authentication is implemented
export const emailHash = "1c61d3af9e95de4b161dc5c7d5d7e0cbc6de90f884defcfe6d49a5e8bce62806";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (_req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export const prisma = new PrismaClient();
