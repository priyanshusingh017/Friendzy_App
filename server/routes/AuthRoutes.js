/**
 * Auth-related API routes
 */
import { Router } from "express";
import { signup, login, getUserInfo, updateProfile, addProfileImage, removeProfileImage, logout } from "../controllers/AuthController.js";
import { verifyToken } from "../middlewares/AuthMiddle.js";
import multer from "multer";
import fs from "fs";
import path from "path";

const authRoutes = Router();

const uploadDir = path.join(process.cwd(), "uploads/profiles");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

// POST /signup - Register new user
authRoutes.post("/signup", signup);
// POST /login - User login
authRoutes.post("/login", login);
// GET /user-info - Get user info (protected)
authRoutes.get("/user-info", verifyToken, getUserInfo);
// POST /update-profile - Update user profile (protected)
authRoutes.post("/update-profile", verifyToken, updateProfile);
// POST /add-profile-image - Add profile image (protected)
authRoutes.post("/add-profile-image", verifyToken, upload.single("profile_image"), addProfileImage);
// DELETE /remove-profile-image - Remove profile image (protected)
authRoutes.delete("/remove-profile-image", verifyToken, removeProfileImage);
// POST /logout - User logout
authRoutes.post("/logout", logout);

export default authRoutes;

