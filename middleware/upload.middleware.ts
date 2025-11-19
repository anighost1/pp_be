import multer from "multer";
import path from "path";
import fs from "fs";

// File filter (used for validation)
const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  const { docType } = req.body;

  if (docType && docType.toLowerCase() === "owner image") {
    // Owner image must be jpg/jpeg only
    const allowedTypes = ["image/jpeg", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg and .jpeg files are allowed for Owner Image") as any, false);
    }
  } else {

    cb(null, true)
  }
};

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { docType } = req.body;

    let uploadPath = "uploads/docs";
    if (docType && docType.toLowerCase() === "owner image") {
      uploadPath = "uploads/owner";
    }

    // Ensure folder exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const uploadTo = (pathToUse: string) => {
  const uploadPath = `uploads/${pathToUse}`;

  // Ensure the folder exists
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

  return multer({ storage, fileFilter });
};

export const upload = multer({ storage, fileFilter });
