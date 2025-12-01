import multer from "multer";
import { PrismaClient } from "@prisma/client";
import firebase from "firebase-admin";
import serviceAccount from "./../../serviceAccountKey.json";

export const PORT = process.env.PORT || 3002;

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

// if to prevent re-initialization
if (!firebase.apps.length) {
  firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
  });
}
export const firebaseAuth = firebase.auth();

export const prisma = new PrismaClient();
