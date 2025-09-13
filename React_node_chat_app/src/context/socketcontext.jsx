import { useAppStore } from "@/store";
import { HOST } from "@/utils/constants";
import { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const socket = useRef(null);
    const { userInfo } = useAppStore();

    useEffect(() => {
        if (userInfo) {
            socket.current = io(HOST, {
                withCredentials: true,
                query: { userId: userInfo.id },
            });

            socket.current.on("connect", () => {
                console.log("Connected to socket server");
            });

            // Handle direct messages
            const handleReceiveMessage = (message) => {
                const state = useAppStore.getState();
                const { selectedChatData, selectedChatType, addMessage } = state;

                if (
                    selectedChatType === "contact" &&
                    (
                        selectedChatData._id === message.sender._id ||
                        selectedChatData._id === message.recipient._id
                    )
                ) {
                    console.log("Direct message received:", message);
                    addMessage(message);
                }
            };

            // Handle channel messages - Fixed to prevent duplicates
            const handleReceiveChannelMessage = (data) => {
                const state = useAppStore.getState();
                const { selectedChatData, selectedChatType, addMessage, userInfo } = state;
                
                console.log("Channel message received:", data);
                
                // Only add message if we're in the correct channel
                if (
                    selectedChatType === "channel" &&
                    selectedChatData &&
                    selectedChatData._id === data.channelId
                ) {
                    // Don't add our own messages (they're already added optimistically)
                    const isOwnMessage = data.sender === userInfo.id || 
                                       (data.sender && data.sender._id === userInfo.id);
                    
                    if (!isOwnMessage) {
                        console.log("Adding channel message to chat:", data);
                        addMessage({
                            ...data,
                            recipient: data.channelId
                        });
                    }
                }
            };

            socket.current.on("receiveMessage", handleReceiveMessage);
            socket.current.on("receiveChannelMessage", handleReceiveChannelMessage);

            return () => {
                if (socket.current) {
                    socket.current.off("receiveMessage", handleReceiveMessage);
                    socket.current.off("receiveChannelMessage", handleReceiveChannelMessage);
                    socket.current.disconnect();
                }
            };
        }
    }, [userInfo]);

    return (
        <SocketContext.Provider value={socket.current}>
            {children}
        </SocketContext.Provider>
    );
};

