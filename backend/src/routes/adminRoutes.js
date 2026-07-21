// src/routes/adminRoutes.js
const { Router } = require("express");
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = Router();

// All admin routes require auth + admin role
router.use(authMiddleware);
router.use(roleMiddleware("admin"));

// Dashboard
router.get("/dashboard", adminController.getDashboard);

// User management
router.get("/users", adminController.getUsers);
router.get("/users/:id", adminController.getUserById);
router.patch("/users/:id/status", adminController.updateUserStatus);

// Activity logs
router.get("/logs/user", adminController.getUserLogs);
router.get("/logs/admin", adminController.getAdminLogs);

// Admin profile
router.get("/profile", adminController.getProfile);
router.put("/profile", adminController.updateProfile);

module.exports = router;
