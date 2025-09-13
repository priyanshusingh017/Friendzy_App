import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { verifyToken } from "../middlewares/AuthMiddle.js";
import {
    createChannel,
    updateChannel,
    getUserChannels,
    getChannelById,
    getChannelMessages,
    sendChannelMessage,
    addChannelMembers,
    removeChannelMembers,
    deleteChannel
} from "../controllers/ChannelController.js";

const channelRoutes = Router();

// Setup multer for channel image uploads
const channelUploadDir = path.join(process.cwd(), "uploads/channels");
if (!fs.existsSync(channelUploadDir)) {
    fs.mkdirSync(channelUploadDir, { recursive: true });
}

const channelStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, channelUploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadChannelImage = multer({
    storage: channelStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Create a new channel with optional image upload
channelRoutes.post("/create", verifyToken, uploadChannelImage.single('image'), createChannel);

// Update channel information (admin only)
channelRoutes.put("/:channelId", verifyToken, uploadChannelImage.single('image'), updateChannel);

// Get all channels where user is a member
channelRoutes.get("/", verifyToken, getUserChannels);

// Get channel details by ID
channelRoutes.get("/:channelId", verifyToken, getChannelById);

// Get messages for a specific channel
channelRoutes.get("/:channelId/messages", verifyToken, getChannelMessages);

// Send a message to a channel
channelRoutes.post("/:channelId/messages", verifyToken, sendChannelMessage);

// Add members to a channel (admin only)
channelRoutes.post("/:channelId/members", verifyToken, addChannelMembers);

// Remove members from a channel (admin only)
channelRoutes.delete("/:channelId/members", verifyToken, removeChannelMembers);

// Delete a channel (admin only)
channelRoutes.delete("/:channelId", verifyToken, deleteChannel);

export default channelRoutes;