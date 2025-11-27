import { useAppStore } from "@/store";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ContactContainer from "./components/contact-container";
import EmptyChatContainer from "./components/empty-chat-container";
import ChatContainer from "./components/chat-container";
import { useSocket } from "@/context/socketcontext";

const Chat = () => {
    const {
        userInfo,
        selectedChatType,
        selectedChatData,
        isUploading,
        isDownloading,
        fileUploadProgress,
        fileDownloadProgress,
        addMessage,
        addContactsInDMContacts, // ✅ Make sure this is imported
    } = useAppStore();
    const navigate = useNavigate();
    const socket = useSocket();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userInfo) {
            setLoading(false);
            return;
        }
        if (!userInfo.profileSetup) {
            toast("Please setup your profile to continue.");
            navigate("/profile");
            return;
        }
        setLoading(false);
    }, [userInfo]);

    // ✅ Socket listeners for real-time messages
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (message) => {
            console.log("📨 Received direct message:", message);
            
            if (
                selectedChatType === "contact" &&
                (selectedChatData?._id === message.sender._id ||
                    selectedChatData?._id === message.recipient._id)
            ) {
                addMessage(message);
            }
            
            // ✅ Only call if function exists
            if (typeof addContactsInDMContacts === 'function') {
                addContactsInDMContacts(message);
            }
        };

        const handleReceiveChannelMessage = (message) => {
            console.log("📨 Received channel message:", message);

            // ✅ Don't add if this is our own message (already added optimistically)
            if (selectedChatType === "channel" && message.sender?._id !== userInfo?.id) {
                addMessage(message);
            }
        };

        socket.on("receiveMessage", handleReceiveMessage);
        socket.on("receive-channel-message", handleReceiveChannelMessage);

        return () => {
            socket.off("receiveMessage", handleReceiveMessage);
            socket.off("receive-channel-message", handleReceiveChannelMessage);
        };
    }, [socket, selectedChatType, selectedChatData, userInfo, addMessage, addContactsInDMContacts]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen text-white text-lg">
                Loading chat...
            </div>
        );
    }

    return (
        <main className="flex h-[100vh] text-white overflow-hidden" aria-label="Chat Page">
            <ContactContainer />
            {selectedChatType === undefined ? <EmptyChatContainer /> : <ChatContainer />}
        </main>
    );
};

export default Chat;