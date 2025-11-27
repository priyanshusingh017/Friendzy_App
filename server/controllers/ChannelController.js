import mongoose from "mongoose";
import Channel from "../models/channelModel.js";
import User from "../models/userModel.js";
import { uploadToGridFS, deleteFromGridFS } from "../config/gridfs.js"; // ✅ Use helper functions
import { generateFilename, processImage } from "../middlewares/uploadMiddleware.js"; // ✅ Import helpers

/**
 * Create a new channel
 */
export const createChannel = async (request, response, next) => {
  try {
    const { name, members } = request.body;
    const userId = request.userId;

    console.log("📝 Creating channel:", { name, membersCount: members?.length });

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
    console.log("✅ Channel created successfully:", newChannel._id);
    
    // ✅ Populate members and admin before returning
    const populatedChannel = await Channel.findById(newChannel._id)
      .populate("members", "firstName lastName email _id image color")
      .populate("admin", "firstName lastName email _id image color");
    
    console.log("✅ Populated channel data:", {
      _id: populatedChannel._id,
      name: populatedChannel.name,
      membersCount: populatedChannel.members?.length,
      members: populatedChannel.members?.map(m => ({
        id: m._id,
        name: `${m.firstName} ${m.lastName}`
      }))
    });
    
    return response.status(201).json({ 
      success: true,
      channel: populatedChannel 
    });
  } catch (error) {
    console.error("❌ Create channel error:", error);
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

    console.log("📝 Updating channel:", channelId);
    console.log("📝 Request body:", request.body);
    console.log("📝 Request file:", request.file ? "Yes" : "No");

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

    // Update basic fields
    if (name !== undefined && name !== null && name.trim() !== '') {
      channel.name = name.trim();
      console.log("✅ Updated name to:", channel.name);
    }

    if (description !== undefined) {
      channel.description = description;
      console.log("✅ Updated description");
    }

    if (members && Array.isArray(members) && members.length > 0) {
      const validMembers = await User.find({ _id: { $in: members } });
      if (validMembers.length !== members.length) {
        return response.status(400).send("Some members are not valid users.");
      }
      channel.members = members;
      console.log("✅ Updated members count:", members.length);
    }

    // Handle image upload
    if (request.file) {
      try {
        console.log("📸 Processing channel image...");
        
        // Delete old channel image if exists
        if (channel.image) {
          const oldFilename = channel.image.split('/').pop();
          await deleteFromGridFS(oldFilename);
          console.log("🗑️ Deleted old channel image");
        }

        // Process image (if Sharp is available, otherwise use original)
        let fileBuffer = request.file.buffer;
        let contentType = request.file.mimetype;

        try {
          // Try to process image with Sharp
          if (request.file.mimetype.startsWith('image/')) {
            fileBuffer = await processImage(request.file.buffer, request.file.mimetype);
            contentType = 'image/jpeg';
            console.log("✅ Image processed with Sharp");
          }
        } catch (sharpError) {
          console.warn("⚠️ Sharp processing failed, using original image:", sharpError.message);
          // Continue with original buffer if Sharp fails
        }

        // Generate unique filename
        const filename = generateFilename(request.file.originalname);

        // Create metadata
        const plainMetadata = {
          channelId: String(channelId),
          uploadedBy: String(userId),
          uploadDate: new Date().toISOString(),
          contentType: String(contentType),
          fileType: "channel-image"
        };

        // Upload to GridFS
        await uploadToGridFS(filename, fileBuffer, plainMetadata);
        
        channel.image = `/api/auth/files/${filename}`;
        console.log("✅ Uploaded new channel image:", filename);
      } catch (error) {
        console.error("❌ Failed to upload image:", error);
        // Don't fail the entire update if image upload fails
        console.warn("⚠️ Continuing without image update");
      }
    }

    await channel.save();
    console.log("✅ Channel saved to database");

    // ✅ Always populate members and admin
    const updatedChannel = await Channel.findById(channelId)
      .populate("members", "firstName lastName email _id image color")
      .populate("admin", "firstName lastName email _id image color");

    console.log("✅ Channel updated successfully");
    console.log("✅ Populated members:", updatedChannel.members?.map(m => ({
      id: m._id,
      name: `${m.firstName} ${m.lastName}`
    })));
    
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
        const filename = channel.image.split('/').pop();
        await deleteFromGridFS(filename);
        console.log("🗑️ Deleted channel image from GridFS");
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