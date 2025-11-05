import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getMessages, uploadFile, uploadChannelFile } from "../controllers/MessageController.js";
import { verifyToken } from "../middlewares/AuthMiddle.js";

const messageRoutes = Router();

// Create the upload directory if it doesn't exist
const uploadDir = path.join(process.cwd(), "uploads/files");
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
} catch (error) {
    console.error("Failed to create upload directory:", error);
    process.exit(1); // Exit the process if the directory cannot be created
}

// Updated file filter to allow more image types and other files
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// Get messages for a conversation
messageRoutes.post("/get-message", verifyToken, (req, res, next) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ error: "Recipient ID is required." });
    }
    next();
}, getMessages);

// Upload a file in direct message chat
messageRoutes.post("/upload-file", verifyToken, upload.single("file"), (req, res, next) => {
    if (!req.body.recipientId) {
        return res.status(400).json({ error: "Recipient ID is required." });
    }
    next();
}, uploadFile);

// Upload a file in channel chat
messageRoutes.post("/upload-channel-file", verifyToken, upload.single("file"), (req, res, next) => {
    if (!req.body.channelId) {
        return res.status(400).json({ error: "Channel ID is required." });
    }
    next();
}, uploadChannelFile);

// Error handler for file uploads
messageRoutes.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
    }
    if (err.message.includes("Invalid file type")) {
        return res.status(400).json({ error: err.message });
    }
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
});

export default messageRoutes;
