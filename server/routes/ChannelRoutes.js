import { Router } from "express";
import { verifyToken } from "../middlewares/AuthMiddle.js";
import multer from "multer";
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

// Get channel messages
channelRoutes.get("/get-channel-messages/:channelId", verifyToken, getChannelMessages);

// Update channel (admin only)
channelRoutes.patch("/update-channel/:channelId", verifyToken, upload.single("image"), updateChannel);

// Delete channel (admin only)
channelRoutes.delete("/delete-channel/:channelId", verifyToken, deleteChannel);

// ✅ Add members to channel (admin only)
channelRoutes.post("/:channelId/members", verifyToken, addMembersToChannel);

// ✅ Remove member from channel (admin only)
channelRoutes.delete("/:channelId/members/:memberId", verifyToken, removeMemberFromChannel);

export default channelRoutes;