import { Router } from "express";
import multer from "multer";
import { verifyToken } from "../middlewares/AuthMiddle.js";
import {
  createChannel,
  getUserChannels,
  getChannelMessages,
  updateChannel,
  deleteChannel,
  addMembersToChannel,
  removeMemberFromChannel,
} from "../controllers/ChannelController.js";

const channelRoutes = Router();

// ✅ Configure multer for memory storage to handle image uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Create a new channel
channelRoutes.post("/create-channel", verifyToken, createChannel);

// Get all channels where user is a member
channelRoutes.get("/get-user-channel", verifyToken, getUserChannels);

// Get messages for a specific channel
channelRoutes.get("/get-channel-messages/:channelId", verifyToken, getChannelMessages);

// ✅ Update channel - accept single image file + text fields
channelRoutes.put("/:channelId", verifyToken, upload.single('image'), updateChannel);

// Delete channel
channelRoutes.delete("/:channelId", verifyToken, deleteChannel);

// Add members to channel
channelRoutes.post("/:channelId/add-members", verifyToken, addMembersToChannel);

// Remove member from channel
channelRoutes.delete("/:channelId/remove-member", verifyToken, removeMemberFromChannel);

export default channelRoutes;