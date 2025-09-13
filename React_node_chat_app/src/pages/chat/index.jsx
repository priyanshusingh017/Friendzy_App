import { useAppStore } from "@/store";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ContactContainer from "./components/contact-container";
import EmptyChatContainer from "./components/empty-chat-container";
import ChatContainer from "./components/chat-container";

const Chat = () => {
    const {
        userInfo,
        selectedChatType,
        isUploading,
        isDownloading,
        fileUploadProgress,
        fileDownloadProgress,
    } = useAppStore();
    const navigate = useNavigate();
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