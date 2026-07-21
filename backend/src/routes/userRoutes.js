// src/routes/userRoutes.js
const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads/avatars");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `avatar-${req.user.id}-${Date.now()}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, WEBP, GIF allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// All user routes require auth
router.use(authMiddleware);

// Profile update
router.put("/profile", userController.updateProfile);

// Avatar upload
router.post("/avatar", upload.single("avatar"), userController.uploadAvatar);

module.exports = router;
