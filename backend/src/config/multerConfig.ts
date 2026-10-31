import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

const UPLOAD_BASE_PATH = path.join(__dirname, "../../uploads");

// Ensure system upload directory parameters exist securely
if (!fs.existsSync(UPLOAD_BASE_PATH)) {
  fs.mkdirSync(UPLOAD_BASE_PATH, { recursive: true });
}

// Low-overhead Disk Storage Engine configuration strategy
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: Function) => {
    cb(null, UPLOAD_BASE_PATH);
  },
  filename: (req: Request, file: Express.Multer.File, cb: Function) => {
    // Distinct prefix tracking layout to categorize incoming files cleanly
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileExtension = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${fileExtension}`);
  },
});

// Structural security whitelist validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true); // Safe to stream
  } else {
    cb(
      new Error(
        "Invalid File Type: Only PDF documents are authorized for upload in eLTS.",
      ),
      false,
    );
  }
};

export const uploadEngine = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // Strict 20MB ceiling restriction to prevent memory flooding
  },
});
