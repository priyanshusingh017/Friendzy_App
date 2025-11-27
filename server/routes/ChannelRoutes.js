import { Router } from "express";
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
import { upload } from "../middlewares/uploadMiddleware.js";

const channelRoutes = Router();

// Create a new channel
channelRoutes.post("/create-channel", verifyToken, createChannel);

// Get all channels where user is a member
channelRoutes.get("/get-user-channel", verifyToken, getUserChannels);

// Get channel messages
channelRoutes.get("/get-channel-messages/:channelId", verifyToken, getChannelMessages);

// Update channel (with optional image upload)
channelRoutes.put(
  "/update-channel/:channelId",
  verifyToken,
  upload.single("image"),
  updateChannel
);

// Delete channel
channelRoutes.delete("/delete-channel/:channelId", verifyToken, deleteChannel);

// Add members to channel
channelRoutes.post("/:channelId/members", verifyToken, addMembersToChannel);

// Remove member from channel - ✅ FIX: Add memberId parameter
channelRoutes.delete("/:channelId/members/:memberId", verifyToken, removeMemberFromChannel);

export default channelRoutes;