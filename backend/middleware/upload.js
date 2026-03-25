const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* ===============================
   ENSURE UPLOAD DIRECTORY EXISTS
=============================== */

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* ===============================
   STORAGE CONFIGURATION
=============================== */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

/* ===============================
   FILE TYPE VALIDATION
=============================== */

const fileFilter = (req, file, cb) => {

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only PDF, JPG, and PNG files are allowed"),
      false
    );
  }
};

/* ===============================
   MULTER CONFIGURATION
=============================== */

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter
});

module.exports = upload;