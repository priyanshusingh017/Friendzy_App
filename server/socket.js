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
            const newMessage = new Message(data);
            await newMessage.save();

            // Emit to all channel members
            io.to(`channel-${data.channelId}`).emit("receiveChannelMessage", newMessage);
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
        socket.on("sendChannelMessage", sendChannelMessage);

        socket.on("joinChannel", (channelId) => {
            socket.join(channelId);
        });

        socket.on("leaveChannel", (channelId) => {
            socket.leave(channelId);
        });
    });
};

export default setupSocket;