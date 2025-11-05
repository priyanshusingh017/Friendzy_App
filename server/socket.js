import { Server as SocketIOServer } from "socket.io";
import Message from "./models/MessagesModel.js";
import Channel from "./models/channelModel.js";

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = [
          process.env.ORIGIN,
          'https://friendzy-app.vercel.app',
          /https:\/\/friendzy-.*\.vercel\.app$/
        ].filter(Boolean);

        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.some(allowed => {
          if (typeof allowed === 'string') return allowed === origin;
          if (allowed instanceof RegExp) return allowed.test(origin);
          return false;
        });
        
        callback(null, isAllowed);
      },
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
        try {
            // Save to DB
            const newMessage = new Message(message);
            await newMessage.save();

            // Emit to recipient (DM)
            if (message.recipient) {
                const recipientSocket = userSocketMap.get(message.recipient.toString());
                if (recipientSocket) {
                    io.to(recipientSocket).emit("receiveMessage", newMessage);
                }
            }

            // Emit to sender for confirmation
            const senderSocket = userSocketMap.get(message.sender.toString());
            if (senderSocket) {
                io.to(senderSocket).emit("receiveMessage", newMessage);
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const sendChannelMessage = async (data) => {
        try {
            // Save to DB
            const newMessage = new Message({
                channelId: data.channelId,
                sender: data.message.sender,
                messageType: data.message.messageType,
                fileUrl: data.message.fileUrl,
                fileName: data.message.fileName,
                fileType: data.message.fileType,
                content: data.message.content,
                timestamp: new Date(),
            });
            await newMessage.save();

            // Emit to all users in the channel room
            io.to(`channel-${data.channelId}`).emit("receiveChannelMessage", {
                ...newMessage.toObject(),
                optimisticId: data.optimisticId, // so frontend can replace optimistic message
            });
        } catch (error) {
            console.error("Error sending channel message:", error);
        }
    };

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;

        if (userId) {
            userSocketMap.set(userId, socket.id);
            console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
            
            // Join all channels that the user is a member of
            Channel.find({ members: { $in: [userId] } })
                .then(channels => {
                    channels.forEach(channel => {
                        socket.join(channel._id.toString());
                    });
                });
        } else {
            console.log("User ID not provided during connection.");
        }

        socket.on("disconnect", () => disconnect(socket));
        socket.on("sendMessage", sendMessage);

        // Join channel room when user opens a channel
        socket.on("joinChannel", (channelId) => {
            socket.join(`channel-${channelId}`);
        });

        // Listen for channel messages from frontend
        socket.on("sendChannelMessage", async (data) => {
            try {
                // Save to DB
                const newMessage = new Message({
                    channelId: data.channelId,
                    sender: data.message.sender,
                    messageType: data.message.messageType,
                    fileUrl: data.message.fileUrl,
                    fileName: data.message.fileName,
                    fileType: data.message.fileType,
                    content: data.message.content,
                    timestamp: new Date(),
                });
                await newMessage.save();

                // Emit to all users in the channel room
                io.to(`channel-${data.channelId}`).emit("receiveChannelMessage", {
                    ...newMessage.toObject(),
                    optimisticId: data.optimisticId, // so frontend can replace optimistic message
                });
            } catch (error) {
                console.error("Error sending channel message:", error);
            }
        });

        socket.on("leaveChannel", (channelId) => {
            socket.leave(channelId);
        });
    });
};

export default setupSocket;