import { Router } from "express"; // ✅ Changed from "router" to "express"
import {
  addProfileImage,
  getUserInfo,
  login,
  logout,
  removeProfileImage,
  signup,
  updateProfile,
} from "../controllers/AuthController.js";
import { verifyToken } from "../middlewares/AuthMiddle.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { getFileFromGridFS } from "../config/gridfs.js";

/**
 * Auth-related API routes
 */

const authRoutes = Router();

authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.get("/user-info", verifyToken, getUserInfo);
authRoutes.post("/update-profile", verifyToken, updateProfile);
authRoutes.post(
  "/add-profile-image",
  verifyToken,
  upload.single("profile-image"), // ✅ Use upload.single() instead of uploadAny
  addProfileImage
);
authRoutes.delete("/remove-profile-image", verifyToken, removeProfileImage);
authRoutes.post("/logout", logout);

// Route to serve files from GridFS
authRoutes.get("/files/:filename", async (req, res) => {
  try {
    const downloadStream = getFileFromGridFS(req.params.filename);

    downloadStream.on("error", (error) => {
      console.error("❌ GridFS download error:", error);
      res.status(404).send("File not found");
    });

    downloadStream.on("file", (file) => {
      // Set CORS headers
      res.set("Access-Control-Allow-Origin", req.headers.origin || "*");
      res.set("Access-Control-Allow-Credentials", "true");

      // Set content type from metadata
      res.set(
        "Content-Type",
        file.metadata?.contentType || "application/octet-stream"
      );
      res.set("Content-Disposition", `inline; filename="${file.filename}"`);

      // Set cache headers for better performance
      res.set("Cache-Control", "public, max-age=31536000");
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error("❌ Error retrieving file:", error);
    res.status(500).send("Error retrieving file");
  }
});

export default authRoutes;

