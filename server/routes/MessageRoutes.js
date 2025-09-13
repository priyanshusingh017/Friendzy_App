import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { verifyToken } from "../middlewares/AuthMiddle.js";
import { getMessages, uploadFile, uploadChannelFile } from "../controllers/MessageController.js";

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
const upload = multer({
    dest: uploadDir,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
    fileFilter: (req, file, cb) => {
        // Allow images, documents, and other common file types
        const allowedTypes = [
            "image/jpeg", "image/jpg", "image/png", "image/gif", 
            "image/webp", "image/svg+xml", "image/bmp",
            "application/pdf", "application/msword", 
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain", "application/zip"
        ];
        
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Invalid file type. Please upload a valid file."));
        }
        cb(null, true);
    },
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
