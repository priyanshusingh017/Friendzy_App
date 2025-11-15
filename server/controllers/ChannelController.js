import mongoose from "mongoose";
import Channel from "../models/channelModel.js";
import User from "../models/userModel.js";
import { Readable } from "stream";
import { getGridFSBucket } from "../config/gridfs.js";

/**
 * Create a new channel
 */
export const createChannel = async (request, response, next) => {
  try {
    const { name, members } = request.body;
    const userId = request.userId;

    const admin = await User.findById(userId);

    if (!admin) {
      return response.status(400).send("Admin user not found.");
    }

    const validMembers = await User.find({ _id: { $in: members } });

    if (validMembers.length !== members.length) {
      return response.status(400).send("Some members are not valid users.");
    }

    const newChannel = new Channel({
      name,
      members,
      admin: userId,
    });

    await newChannel.save();
    return response.status(201).json({ channel: newChannel });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error");
  }
};

/**
 * Update channel information (admin only)
 */
export const updateChannel = async (request, response, next) => {
  try {
    const { channelId } = request.params;
    const userId = request.userId;

    console.log("📝 Raw request body:", request.body);
    console.log("📝 Request file:", request.file);
    console.log("📝 Channel ID:", channelId);
    console.log("📝 User ID:", userId);

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return response.status(400).send("Invalid channel ID.");
    }

    const channel = await Channel.findById(channelId);

    if (!channel) {
      return response.status(404).send("Channel not found.");
    }

    if (channel.admin.toString() !== userId) {
      return response.status(403).send("You are not authorized to update this channel.");
    }

    const { name, description } = request.body;
    
    let members = [];
    if (request.body.members) {
      try {
        members = typeof request.body.members === 'string' 
          ? JSON.parse(request.body.members) 
          : request.body.members;
      } catch (e) {
        console.error("Failed to parse members:", e);
      }
    }

    console.log("📝 Parsed data:", { name, description, members, hasFile: !!request.file });

    if (name !== undefined && name !== null && name.trim() !== '') {
      channel.name = name.trim();
      console.log("✅ Updated name to:", channel.name);
    }

    if (description !== undefined) {
      channel.description = description;
      console.log("✅ Updated description to:", channel.description);
    }

    if (members && Array.isArray(members) && members.length > 0) {
      const validMembers = await User.find({ _id: { $in: members } });
      if (validMembers.length !== members.length) {
        return response.status(400).send("Some members are not valid users.");
      }
      channel.members = members;
      console.log("✅ Updated members count:", members.length);
    }

    if (request.file) {
      try {
        const bucket = getGridFSBucket();
        
        if (channel.image) {
          const oldFileName = channel.image.split('/').pop();
          const oldFiles = await bucket.find({ filename: oldFileName }).toArray();
          if (oldFiles.length > 0) {
            await bucket.delete(oldFiles[0]._id);
            console.log("🗑️ Deleted old channel image");
          }
        }

        const timestamp = Date.now();
        const filename = `channel_${channelId}_${timestamp}_${request.file.originalname}`;
        
        const uploadStream = bucket.openUploadStream(filename, {
          contentType: request.file.mimetype,
          metadata: {
            channelId: channelId,
            uploadedBy: userId,
            uploadedAt: new Date()
          }
        });

        const readableStream = Readable.from(request.file.buffer);
        
        await new Promise((resolve, reject) => {
          readableStream.pipe(uploadStream)
            .on('finish', resolve)
            .on('error', reject);
        });

        channel.image = `/api/auth/files/${filename}`;
        console.log("✅ Uploaded new channel image:", filename);
        console.log("✅ Channel image URL:", channel.image);
      } catch (error) {
        console.error("❌ Failed to upload image:", error);
        return response.status(500).send("Failed to upload image");
      }
    }

    await channel.save();
    console.log("✅ Channel saved to database");

    const updatedChannel = await Channel.findById(channelId)
      .populate("members", "firstName lastName email _id image color")
      .populate("admin", "firstName lastName email _id image color");

    console.log("✅ Channel updated successfully");
    console.log("✅ Updated channel data:", {
      _id: updatedChannel._id,
      name: updatedChannel.name,
      image: updatedChannel.image,
      description: updatedChannel.description
    });
    
    return response.status(200).json({ 
      success: true,
      channel: updatedChannel 
    });
  } catch (error) {
    console.error("❌ Update channel error:", error);
    console.error("❌ Error stack:", error.stack);
    return response.status(500).send("Internal Server Error");
  }
};

/**
 * Get all channels where user is a member
 */
export const getUserChannels = async (request, response, next) => {
  try {
    const userId = request.userId;
    
    const channels = await Channel.find({
      $or: [{ admin: userId }, { members: userId }],
    })
      .populate("members", "firstName lastName email _id image color")
      .populate("admin", "firstName lastName email _id image color")
      .populate({
        path: "messages",
        populate: {
          path: "sender",
          select: "firstName lastName email _id image color",
        },
      })
      .sort({ updatedAt: -1 });

    return response.status(200).json({ channels });
  } catch (error) {
    console.log("getUserChannels error:", error);
    return response.status(500).send("Internal Server Error");
  }
};

/**
 * Get channel messages with pagination
 */
export const getChannelMessages = async (request, response, next) => {
  try {
    const { channelId } = request.params;
    
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return response.status(400).send("Invalid channel ID.");
    }

    const channel = await Channel.findById(channelId).populate({
      path: "messages",
      populate: {
        path: "sender",
        select: "_id id firstName lastName email image color",
      },
    });

    if (!channel) {
      return response.status(404).send("Channel not found.");
    }

    const messages = channel.messages || [];
    
    console.log("✅ Retrieved channel messages with sender info");
    
    return response.status(200).json({ messages });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error");
  }
};

/**
 * Delete a channel (admin only)
 */
export const deleteChannel = async (request, response, next) => {
  try {
    const { channelId } = request.params;
    const userId = request.userId;

    const channel = await Channel.findById(channelId);

    if (!channel) {
      return response.status(404).send("Channel not found.");
    }

    if (channel.admin.toString() !== userId) {
      return response.status(403).send("You are not authorized to delete this channel.");
    }

    // Delete channel image from GridFS if exists
    if (channel.image) {
      try {
        const bucket = getGridFSBucket();
        const filename = channel.image.split('/').pop();
        const files = await bucket.find({ filename }).toArray();
        if (files.length > 0) {
          await bucket.delete(files[0]._id);
          console.log("🗑️ Deleted channel image from GridFS");
        }
      } catch (error) {
        console.error("Failed to delete channel image:", error);
      }
    }

    await Channel.findByIdAndDelete(channelId);

    return response.status(200).send("Channel deleted successfully.");
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error");
  }
};

/**
 * Add members to channel (admin only)
 */
export const addMembersToChannel = async (request, response, next) => {
  try {
    const { channelId } = request.params;
    const { members } = request.body;
    const userId = request.userId;

    console.log("📝 Add members request:", { channelId, members, userId });

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return response.status(400).send("Invalid channel ID.");
    }

    if (!members || !Array.isArray(members) || members.length === 0) {
      return response.status(400).send("Members array is required.");
    }

    const channel = await Channel.findById(channelId);

    if (!channel) {
      return response.status(404).send("Channel not found.");
    }

    // Check if user is admin
    if (channel.admin.toString() !== userId) {
      return response.status(403).send("You are not authorized to add members to this channel.");
    }

    // Validate all members exist
    const validMembers = await User.find({ _id: { $in: members } });
    if (validMembers.length !== members.length) {
      return response.status(400).send("Some members are not valid users.");
    }

    // Filter out members who are already in the channel
    const newMembers = members.filter(
      (memberId) => !channel.members.some((m) => m.toString() === memberId)
    );

    if (newMembers.length === 0) {
      return response.status(400).send("All users are already members of this channel.");
    }

    // Add new members
    channel.members.push(...newMembers);
    await channel.save();

    console.log("✅ Members added successfully:", newMembers);

    // Populate and return updated channel
    const updatedChannel = await Channel.findById(channelId)
      .populate("members", "firstName lastName email _id image color")
      .populate("admin", "firstName lastName email _id image color");

    return response.status(200).json({
      success: true,
      channel: updatedChannel,
      addedMembers: newMembers,
    });
  } catch (error) {
    console.error("❌ Add members error:", error);
    return response.status(500).send("Internal Server Error");
  }
};

/**
 * Remove member from channel (admin only)
 */
export const removeMemberFromChannel = async (request, response, next) => {
  try {
    const { channelId, memberId } = request.params;
    const userId = request.userId;

    console.log("📝 Remove member request:", { channelId, memberId, userId });

    if (!mongoose.Types.ObjectId.isValid(channelId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return response.status(400).send("Invalid ID.");
    }

    const channel = await Channel.findById(channelId);

    if (!channel) {
      return response.status(404).send("Channel not found.");
    }

    // Check if user is admin
    if (channel.admin.toString() !== userId) {
      return response.status(403).send("You are not authorized to remove members from this channel.");
    }

    // Cannot remove admin
    if (channel.admin.toString() === memberId) {
      return response.status(400).send("Cannot remove channel admin.");
    }

    // Check if member exists in channel
    const memberIndex = channel.members.findIndex((m) => m.toString() === memberId);
    if (memberIndex === -1) {
      return response.status(400).send("User is not a member of this channel.");
    }

    // Remove member
    channel.members.splice(memberIndex, 1);
    await channel.save();

    console.log("✅ Member removed successfully:", memberId);

    // Populate and return updated channel
    const updatedChannel = await Channel.findById(channelId)
      .populate("members", "firstName lastName email _id image color")
      .populate("admin", "firstName lastName email _id image color");

    return response.status(200).json({
      success: true,
      channel: updatedChannel,
      removedMemberId: memberId,
    });
  } catch (error) {
    console.error("❌ Remove member error:", error);
    return response.status(500).send("Internal Server Error");
  }
};