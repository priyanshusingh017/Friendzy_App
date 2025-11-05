import Message from "../models/MessagesModel.js";
import Channel from "../models/channelModel.js";
import { mkdirSync, renameSync } from 'fs';
import path from 'path';

export const getMessages = async (request, response, next) => {
    try {
        const user1 = request.userId;
        const user2 = request.body.id;

        if (!user1 || !user2) {
            return response.status(400).json({ error: "Both user IDs are required." });
        }

        const messages = await Message.find({
            $or: [
                { sender: user1, recipient: user2 },
                { sender: user2, recipient: user1 }
            ]
        }).sort({ timestamp: 1 });

        return response.status(200).json({ messages });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { recipientId } = req.body;
    const senderId = req.userId;

    if (!recipientId) {
      return res.status(400).json({ error: "Recipient ID is required" });
    }

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: "Invalid file type" });
    }
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: "File size exceeds the limit of 10MB" });
    }

    const date = Date.now();
    const fileDir = path.join("uploads", "files", String(date));
    const fileName = path.join(fileDir, req.file.originalname);

    try {
      mkdirSync(fileDir, { recursive: true });
      renameSync(req.file.path, fileName);
    } catch (error) {
      console.error("Error saving file:", error);
      return res.status(500).json({ error: "Failed to save file" });
    }

    // Fix: Store relative path instead of full URL
    const fileUrl = `uploads/files/${date}/${req.file.originalname}`;

    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      messageType: "file",
      fileUrl: fileUrl, // Store relative path
      fileName: req.file.originalname,
      fileSize: req.file.size,
      content: req.file.originalname,
    });
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'firstName lastName email image color')
      .populate('recipient', 'firstName lastName email image color');

    return res.status(200).json({
      filePath: fileUrl,
      message: populatedMessage,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const uploadChannelFile = async (request, response, next) => {
    try {
        if (!request.file) {
            return response.status(400).json({ error: "File is required" });
        }

        const { channelId } = request.body;
        const userId = request.userId;

        if (!channelId) {
            return response.status(400).json({ error: "Channel ID is required" });
        }

        const channel = await Channel.findById(channelId);
        if (!channel) {
            return response.status(404).json({ error: "Channel not found" });
        }

        if (!channel.members.includes(userId)) {
            return response.status(403).json({ error: "Access denied. You are not a member of this channel." });
        }

        const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
        if (!allowedTypes.includes(request.file.mimetype)) {
            return response.status(400).json({ error: "Invalid file type" });
        }
        if (request.file.size > 10 * 1024 * 1024) {
            return response.status(400).json({ error: "File size exceeds the limit of 10MB" });
        }

        const date = Date.now();
        const fileDir = path.join("uploads", "files", String(date));
        const fileName = path.join(fileDir, request.file.originalname);

        try {
            mkdirSync(fileDir, { recursive: true });
            renameSync(request.file.path, fileName);
        } catch (error) {
            console.error("Error saving file:", error);
            return response.status(500).json({ error: "Failed to save file" });
        }

        // Fix: Store relative path instead of full URL
        const fileUrl = `uploads/files/${date}/${request.file.originalname}`;

        const message = new Message({
            sender: userId,
            channel: channelId,
            messageType: "file",
            fileUrl: fileUrl, // Store relative path
            fileName: request.file.originalname,
            fileSize: request.file.size,
            content: request.file.originalname,
        });
        await message.save();

        await Channel.findByIdAndUpdate(channelId, {
            lastActivity: new Date(),
            lastMessage: message._id,
        });

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'firstName lastName email image color');

        return response.status(200).json({ 
            filePath: fileUrl, 
            message: populatedMessage 
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};