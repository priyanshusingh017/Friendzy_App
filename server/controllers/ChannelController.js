import mongoose from "mongoose";
import Channel from "../models/channelModel.js";
import Message from "../models/MessagesModel.js";
import User from "../models/userModel.js";

/**
 * Create a new channel
 */
export const createChannel = async (request, response, next) => {
    try {
        const { name, description, isPrivate } = request.body;
        let { members } = request.body;
        
        if (!name) {
            return response.status(400).json({ error: "Channel name is required." });
        }
        
        // Parse members if it's a JSON string (from FormData)
        if (typeof members === 'string') {
            try {
                members = JSON.parse(members);
            } catch (parseError) {
                return response.status(400).json({ error: "Invalid members format." });
            }
        }
        
        if (!members || !Array.isArray(members) || members.length === 0) {
            return response.status(400).json({ error: "Channel must have at least one member." });
        }
        
        // Validate that all member IDs are valid ObjectIds
        const validMembers = members.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validMembers.length !== members.length) {
            return response.status(400).json({ error: "Invalid member IDs provided." });
        }
        
        // Add current user as admin and member
        const allMembers = [...new Set([...validMembers, request.userId])];
        
        const newChannel = new Channel({
            name: name.trim(),
            members: allMembers,
            admin: request.userId,
            description: description || "",
            isPrivate: isPrivate || false,
            image: request.file ? `uploads/channels/${request.file.filename}` : null,
        });
        
        await newChannel.save();
        
        // Populate the channel with member details
        const populatedChannel = await Channel.findById(newChannel._id)
            .populate('members', 'firstName lastName email image color')
            .populate('admin', 'firstName lastName email');
        
        return response.status(201).json({ 
            success: true, 
            channel: populatedChannel
        });
    } catch (error) {
        console.error("createChannel error:", error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};

/**
 * Update channel information (admin only)
 */
export const updateChannel = async (request, response, next) => {
    try {
        const { channelId } = request.params;
        const { name, description } = request.body;
        const userId = request.userId;
        
        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            return response.status(400).json({ error: "Invalid channel ID." });
        }
        
        // Find the channel
        const channel = await Channel.findById(channelId);
        
        if (!channel) {
            return response.status(404).json({ error: "Channel not found." });
        }
        
        // Check if user is admin
        if (channel.admin.toString() !== userId) {
            return response.status(403).json({ error: "Only channel admin can update channel." });
        }
        
        // Update fields
        if (name) channel.name = name.trim();
        if (description !== undefined) channel.description = description.trim();
        if (request.file) {
            channel.image = `uploads/channels/${request.file.filename}`;
        }
        
        await channel.save();
        
        // Populate and return updated channel
        const updatedChannel = await Channel.findById(channelId)
            .populate('members', 'firstName lastName email image color')
            .populate('admin', 'firstName lastName email');
        
        return response.status(200).json({ 
            success: true, 
            channel: updatedChannel 
        });
    } catch (error) {
        console.error("updateChannel error:", error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};

/**
 * Get all channels where user is a member
 */
export const getUserChannels = async (request, response, next) => {
    try {
        const userId = request.userId;
        
        const channels = await Channel.find({
            members: { $in: [userId] }
        })
        .populate('members', 'firstName lastName email image color')
        .populate('admin', 'firstName lastName email')
        .populate('lastMessage', 'content messageType timestamp sender')
        .sort({ lastActivity: -1 });
        
        return response.status(200).json({ channels });
    } catch (error) {
        console.error("getUserChannels error:", error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};

/**
 * Get channel details by ID
 */
export const getChannelById = async (request, response, next) => {
    try {
        const { channelId } = request.params;
        const userId = request.userId;
        
        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            return response.status(400).json({ error: "Invalid channel ID." });
        }
        
        const channel = await Channel.findById(channelId)
            .populate('members', 'firstName lastName email image color')
            .populate('admin', 'firstName lastName email');
        
        if (!channel) {
            return response.status(404).json({ error: "Channel not found." });
        }
        
        // Check if user is a member of this channel
        const isMember = channel.members.some(member => member._id.toString() === userId);
        if (!isMember) {
            return response.status(403).json({ error: "Access denied. You are not a member of this channel." });
        }
        
        return response.status(200).json({ channel });
    } catch (error) {
        console.error("getChannelById error:", error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};

/**
 * Get channel messages with pagination
 */
export const getChannelMessages = async (request, response, next) => {
    try {
        const { channelId } = request.params;
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 50;
        const userId = request.userId;
        
        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            return response.status(400).json({ error: "Invalid channel ID." });
        }
        
        // Check if user is a member of the channel
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return response.status(404).json({ error: "Channel not found." });
        }
        
        const isMember = channel.members.includes(userId);
        if (!isMember) {
            return response.status(403).json({ error: "Access denied. You are not a member of this channel." });
        }
        
        const skip = (page - 1) * limit;
        
        const messages = await Message.find({ channel: channelId })
            .populate('sender', 'firstName lastName email image color')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalMessages = await Message.countDocuments({ channel: channelId });
        const totalPages = Math.ceil(totalMessages / limit);
        
        return response.status(200).json({
            messages: messages.reverse(), // Reverse to get chronological order
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalMessages: totalMessages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error("getChannelMessages error:", error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};

/**
 * Send a message to a channel
 */
export const sendChannelMessage = async (request, response, next) => {
    try {
        const { channelId } = request.params;
        const { content, messageType } = request.body;
        const userId = request.userId;
        
        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            return response.status(400).json({ error: "Invalid channel ID." });
        }
        
        // Check if user is a member of the channel
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return response.status(404).json({ error: "Channel not found." });
        }
        
        const isMember = channel.members.includes(userId);
        if (!isMember) {
            return response.status(403).json({ error: "Access denied. You are not a member of this channel." });
        }
        
        let fileUrl = null;
        let fileName = null;
        
        if (messageType === "file" && request.file) {
            fileUrl = `uploads/files/${request.file.filename}`;
            fileName = request.file.originalname;
        }
        
        const message = new Message({
            sender: userId,
            content: content || fileName || "File",
            messageType: messageType || "text",
            timestamp: new Date(),
            fileUrl: fileUrl,
            fileName: fileName,
            channelId: channelId
        });
        
        await message.save();
        
        // Update channel's last activity
        channel.lastActivity = new Date();
        channel.lastMessage = message._id;
        await channel.save();
        
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'firstName lastName email image color');
        
        return response.status(201).json({ 
            success: true, 
            message: populatedMessage
        });
    } catch (error) {
        console.error("sendChannelMessage error:", error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};

/**
 * Add members to channel (admin only)
 */
export const addChannelMembers = async (request, response, next) => {
    try {
        const { channelId } = request.params;
        const { members } = request.body;
        const userId = request.userId;
        
        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            return response.status(400).json({ error: "Invalid channel ID." });
        }
        
        if (!members || !Array.isArray(members) || members.length === 0) {
            return response.status(400).json({ error: "Members array is required." });
        }
        
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return response.status(404).json({ error: "Channel not found." });
        }
        
        // Check if user is admin of this channel
        if (channel.admin.toString() !== userId) {
            return response.status(403).json({ error: "Access denied. Only channel admin can add members." });
        }
        
        // Validate member IDs and filter out existing members
        const validMembers = members.filter(memberId => 
            mongoose.Types.ObjectId.isValid(memberId) && 
            !channel.members.includes(memberId)
        );
        
        if (validMembers.length === 0) {
            return response.status(400).json({ error: "No valid new members to add." });
        }
        
        // Add new members
        channel.members.push(...validMembers);
        await channel.save();
        
        const updatedChannel = await Channel.findById(channelId)
            .populate('members', 'firstName lastName email image color')
            .populate('admin', 'firstName lastName email');
        
        return response.status(200).json({ 
            success: true, 
            channel: updatedChannel 
        });
    } catch (error) {
        console.error("addChannelMembers error:", error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};

/**
 * Remove members from channel (admin only)
 */
export const removeChannelMembers = async (request, response, next) => {
    try {
        const { channelId } = request.params;
        const { members } = request.body;
        const userId = request.userId;
        
        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            return response.status(400).json({ error: "Invalid channel ID." });
        }
        
        if (!members || !Array.isArray(members) || members.length === 0) {
            return response.status(400).json({ error: "Members array is required." });
        }
        
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return response.status(404).json({ error: "Channel not found." });
        }
        
        // Check if user is admin of this channel
        if (channel.admin.toString() !== userId) {
            return response.status(403).json({ error: "Access denied. Only channel admin can remove members." });
        }
        
        // Don't allow removing the admin
        if (members.includes(channel.admin.toString())) {
            return response.status(400).json({ error: "Cannot remove channel admin from the channel." });
        }
        
        // Remove members
        channel.members = channel.members.filter(memberId => 
            !members.includes(memberId.toString())
        );
        
        await channel.save();
        
        const updatedChannel = await Channel.findById(channelId)
            .populate('members', 'firstName lastName email image color')
            .populate('admin', 'firstName lastName email');
        
        return response.status(200).json({ 
            success: true, 
            channel: updatedChannel 
        });
    } catch (error) {
        console.error("removeChannelMembers error:", error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};

/**
 * Delete a channel (admin only)
 */
export const deleteChannel = async (request, response, next) => {
    try {
        const { channelId } = request.params;
        const userId = request.userId;
        
        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            return response.status(400).json({ error: "Invalid channel ID." });
        }
        
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return response.status(404).json({ error: "Channel not found." });
        }
        
        // Check if user is admin of this channel
        if (channel.admin.toString() !== userId) {
            return response.status(403).json({ error: "Access denied. Only channel admin can delete the channel." });
        }
        
        // Delete all messages in this channel
        await Message.deleteMany({ channelId: channelId });
        
        // Delete the channel
        await Channel.findByIdAndDelete(channelId);
        
        return response.status(200).json({ 
            success: true, 
            message: "Channel deleted successfully" 
        });
    } catch (error) {
        console.error("deleteChannel error:", error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};