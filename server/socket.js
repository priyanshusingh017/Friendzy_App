import { Server as SocketIOServer } from "socket.io";
import Message from "./models/MessagesModel.js";
import Channel from "./models/channelModel.js";

const setupSocket = (server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const userSocketMap = new Map();

  const disconnect = (socket) => {
    console.log(`Client Disconnected: ${socket.id}`);
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
  };

  const sendMessage = async (message) => {
    const senderSocketId = userSocketMap.get(message.sender);
    const recipientSocketId = userSocketMap.get(message.recipient);

    const createdMessage = await Message.create(message);

    const messageData = await Message.findById(createdMessage._id)
      .populate("sender", "id email firstName lastName image color")
      .populate("recipient", "id email firstName lastName image color");

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receiveMessage", messageData);
    }
    if (senderSocketId) {
      io.to(senderSocketId).emit("receiveMessage", messageData);
    }
  };

  const sendChannelMessage = async (data) => {
    try {
      console.log("📩 Received channel message data:", data);

      // Validate required fields
      if (!data || !data.channelId || !data.sender) {
        console.error("❌ Missing required fields:", { data });
        return;
      }

      const { channelId, sender, content, messageType, fileUrl, optimisticId } = data;

      // Create message in database
      const createdMessage = await Message.create({
        sender,
        recipient: null,
        content,
        messageType,
        timestamp: new Date(),
        fileUrl,
      });

      console.log("✅ Message created in DB:", createdMessage._id);

      // Populate sender information with all required fields
      const messageData = await Message.findById(createdMessage._id)
        .populate("sender", "_id id email firstName lastName image color")
        .exec();

      console.log("✅ Populated message sender:", messageData.sender);

      // Add message to channel
      const channel = await Channel.findById(channelId);
      if (channel) {
        channel.messages.push(createdMessage._id);
        await channel.save();
        console.log("✅ Message added to channel");

        // Emit to all channel members
        channel.members.forEach((memberId) => {
          const memberSocketId = userSocketMap.get(memberId.toString());
          if (memberSocketId) {
            io.to(memberSocketId).emit("receive-channel-message", messageData);
          }
        });
      }
    } catch (error) {
      console.error("❌ Error in sendChannelMessage:", error);
    }
  };

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
    } else {
      console.log("User ID not provided during connection.");
    }

    socket.on("sendMessage", sendMessage);
    socket.on("send-channel-message", sendChannelMessage);
    socket.on("sendChannelMessage", sendChannelMessage); // Alternative event name
    socket.on("disconnect", () => disconnect(socket));
  });
};

export default setupSocket;