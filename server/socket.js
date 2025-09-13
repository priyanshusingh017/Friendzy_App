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
            const senderSocketId = userSocketMap.get(message.sender);
            const recipientSocketId = userSocketMap.get(message.recipient);

            // Create the message in the database
            const messagePayload = {
                sender: message.sender,
                recipient: message.recipient,
                messageType: message.messageType || "text",
            };

            if (message.messageType === "text" || !message.messageType) {
                messagePayload.content = message.content;
            }
            if (message.messageType === "file") {
                messagePayload.fileUrl = message.fileUrl;
                messagePayload.fileName = message.fileName;
                messagePayload.fileSize = message.fileSize;
            }

            const createMessage = await Message.create(messagePayload);

            let messageData = await Message.findById(createMessage._id)
                .populate("sender", "id email firstName lastName image color")
                .populate("recipient", "id email firstName lastName image color");

            // Add status field for socket event only
            messageData = messageData.toObject();
            messageData.status = "delivered";

            // Emit the message to the recipient and sender
            if (recipientSocketId) {
                io.to(recipientSocketId).emit("receiveMessage", messageData);
            }
            if (senderSocketId) {
                io.to(senderSocketId).emit("receiveMessage", messageData);
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const sendChannelMessage = async (data) => {
        try {
            const { channelId, message, optimisticId } = data;

            // Validate required fields
            if (!channelId || !message || !message.sender) {
                console.error("Invalid channel message data:", data);
                return;
            }

            // Verify channel exists and sender is a member
            const channel = await Channel.findById(channelId);
            if (!channel || !channel.members.includes(message.sender)) {
                return;
            }

            // Check for duplicate file message in last 10 seconds
            let duplicate = null;
            if (message.messageType === "file") {
                duplicate = await Message.findOne({
                    sender: message.sender,
                    channel: channelId,
                    messageType: "file",
                    fileUrl: message.fileUrl,
                    fileName: message.fileName,
                    fileSize: message.fileSize,
                    timestamp: { $gte: new Date(Date.now() - 10000) },
                });
            }

            if (duplicate) {
                // Already exists, just emit to OTHER clients (not sender)
                let messageData = await Message.findById(duplicate._id)
                    .populate("sender", "id email firstName lastName image color");
                messageData = messageData.toObject();
                messageData.status = "delivered";
                
                channel.members.forEach((memberId) => {
                    // Don't emit to the sender to avoid duplicates
                    if (memberId.toString() !== message.sender.toString()) {
                        const memberSocketId = userSocketMap.get(memberId.toString());
                        if (memberSocketId) {
                            io.to(memberSocketId).emit("receiveChannelMessage", {
                                ...messageData,
                                channelId,
                                optimisticId,
                            });
                        }
                    }
                });
                return;
            }

            // Create the message in the database
            const messagePayload = {
                sender: message.sender,
                channel: channelId,
                messageType: message.messageType || "text",
            };

            if (message.messageType === "text" || !message.messageType) {
                messagePayload.content = message.content;
            }
            if (message.messageType === "file") {
                messagePayload.fileUrl = message.fileUrl;
                messagePayload.fileName = message.fileName;
                messagePayload.fileSize = message.fileSize;
            }

            const createMessage = await Message.create(messagePayload);

            await Channel.findByIdAndUpdate(channelId, {
                lastActivity: new Date(),
                lastMessage: createMessage._id,
            });

            let messageData = await Message.findById(createMessage._id)
                .populate("sender", "id email firstName lastName image color");

            messageData = messageData.toObject();
            messageData.status = "delivered";

            // Emit to all channel members EXCEPT the sender to prevent duplicates
            channel.members.forEach((memberId) => {
                // Don't emit to the sender to avoid duplicates
                if (memberId.toString() !== message.sender.toString()) {
                    const memberSocketId = userSocketMap.get(memberId.toString());
                    if (memberSocketId) {
                        io.to(memberSocketId).emit("receiveChannelMessage", {
                            ...messageData,
                            channelId,
                            optimisticId,
                        });
                    }
                }
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