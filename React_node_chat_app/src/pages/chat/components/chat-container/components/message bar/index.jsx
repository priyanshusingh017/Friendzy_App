import { useEffect, useRef, useState } from "react";
import { RiEmojiStickerLine } from "react-icons/ri";
import { GrAttachment } from "react-icons/gr";
import { IoSend } from "react-icons/io5";
import EmojiPicker from "emoji-picker-react";
import { useSocket } from "@/context/socketcontext";
import { useAppStore } from "@/store";
import apiClient from "@/lib/api_client";
import { UPLOAD_FILE_ROUTE } from "@/utils/constants";
import { toast } from "sonner";

const MessageBar = () => {
    const emojiRef = useRef();
    const fileInputRef = useRef();
    const socket = useSocket();
    const {
        selectedChatType,
        selectedChatData,
        userInfo,
        setUploading,
        setFileUploadingprogress,
        addMessage,
    } = useAppStore();
    const [message, setMessage] = useState("");
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

    useEffect(() => {
        function handleClickOutside(event) {
            if (emojiRef.current && !emojiRef.current.contains(event.target)) {
                setEmojiPickerOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleAddEmoji = (emoji) => {
        setMessage((msg) => msg + emoji.emoji);
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !socket || !userInfo || !selectedChatData) {
            console.log("❌ Cannot send message:", { 
                hasMessage: !!message.trim(), 
                hasSocket: !!socket, 
                hasUserInfo: !!userInfo, 
                hasSelectedChat: !!selectedChatData 
            });
            return;
        }

        if (selectedChatType === "contact") {
            socket.emit("sendMessage", {
                sender: userInfo.id,
                content: message,
                recipient: selectedChatData._id,
                messageType: "text",
                fileUrl: undefined,
            });
            setMessage("");
        } else if (selectedChatType === "channel") {
            const tempId = `optimistic_${userInfo.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const messageData = {
                channelId: selectedChatData._id,
                sender: userInfo.id, // Make sure this is included!
                content: message,
                messageType: "text",
                fileUrl: undefined,
                optimisticId: tempId,
            };

            console.log("📤 Sending channel message:", messageData);

            // Add optimistic message
            const optimisticMessage = {
                sender: { 
                    _id: userInfo.id, 
                    firstName: userInfo.firstName, 
                    lastName: userInfo.lastName,
                    email: userInfo.email,
                    image: userInfo.image,
                    color: userInfo.color,
                },
                content: message,
                messageType: "text",
                timestamp: new Date().toISOString(),
                channelId: selectedChatData._id,
                _id: tempId,
                optimisticId: tempId,
                isOptimistic: true,
            };
            
            addMessage(optimisticMessage);
            
            // Send to server
            socket.emit("send-channel-message", messageData);
            
            setMessage("");
        }
    };

    const handleAttachmentClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !socket || !userInfo || !selectedChatData) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            setUploading(true);
            const response = await apiClient.post(UPLOAD_FILE_ROUTE, formData, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true,
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setFileUploadingprogress(percentCompleted);
                },
            });
            
            setUploading(false);
            setFileUploadingprogress(0);

            if (response.status === 200 && response.data) {
                const fileUrl = response.data.filePath || response.data.message?.fileUrl;
                
                if (selectedChatType === "contact") {
                    socket.emit("sendMessage", {
                        sender: userInfo.id,
                        recipient: selectedChatData._id,
                        messageType: "file",
                        fileUrl: fileUrl,
                        content: undefined,
                    });
                } else if (selectedChatType === "channel") {
                    const tempId = `optimistic_${userInfo.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    
                    const messageData = {
                        channelId: selectedChatData._id,
                        sender: userInfo.id, // Make sure this is included!
                        messageType: "file",
                        fileUrl: fileUrl,
                        content: undefined,
                        optimisticId: tempId,
                    };

                    console.log("📤 Sending channel file message:", messageData);
                    
                    // Add optimistic file message
                    const optimisticFileMessage = {
                        sender: { 
                            _id: userInfo.id, 
                            firstName: userInfo.firstName, 
                            lastName: userInfo.lastName,
                            email: userInfo.email,
                            image: userInfo.image,
                            color: userInfo.color,
                        },
                        messageType: "file",
                        fileUrl: fileUrl,
                        timestamp: new Date().toISOString(),
                        channelId: selectedChatData._id,
                        _id: tempId,
                        optimisticId: tempId,
                        isOptimistic: true,
                    };
                    
                    addMessage(optimisticFileMessage);
                    
                    socket.emit("send-channel-message", messageData);
                }
            }
        } catch (error) {
            setUploading(false);
            setFileUploadingprogress(0);
            toast.error("File upload failed");
            console.error("File upload failed", error);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <form
            className="w-full bg-gradient-to-r from-[#1a1b23] to-[#2a2b35] border-t border-[#3a3b45] flex items-center px-4 py-4 md:px-8 gap-3 md:gap-4 relative shadow-lg"
            aria-label="Message Bar"
            onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
        >
            <div className="flex-1 flex bg-[#2a2b33] rounded-2xl items-center gap-3 md:gap-4 pr-3 md:pr-4 min-w-0 border border-[#3a3b45] shadow-inner">
                <input
                    type="text"
                    className="flex-1 p-4 md:p-5 bg-transparent rounded-2xl focus:outline-none text-base md:text-lg placeholder:text-gray-400 text-white transition-all duration-200"
                    placeholder={selectedChatType === "channel" ? `Message #${selectedChatData?.name || 'channel'}` : "Type your message..."}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    aria-label="Message input"
                    onKeyDown={handleKeyDown}
                />
                <button
                    type="button"
                    className="text-neutral-400 hover:text-purple-400 focus:outline-none transition-all duration-200 p-2 hover:bg-purple-500/10 rounded-lg transform hover:scale-110"
                    aria-label="Attach file"
                    onClick={handleAttachmentClick}
                >
                    <GrAttachment className="text-xl" />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                    aria-label="File input"
                />
                <button
                    type="button"
                    className="text-neutral-400 hover:text-yellow-400 focus:outline-none transition-all duration-200 p-2 hover:bg-yellow-500/10 rounded-lg transform hover:scale-110"
                    onClick={() => setEmojiPickerOpen(true)}
                    aria-label="Open emoji picker"
                >
                    <RiEmojiStickerLine className="text-xl" />
                </button>
                {emojiPickerOpen && (
                    <div className="absolute z-20 bottom-20 right-4 md:right-8" ref={emojiRef}>
                        <EmojiPicker
                            theme="dark"
                            open={emojiPickerOpen}
                            onEmojiClick={handleAddEmoji}
                            autoFocusSearch={false}
                        />
                    </div>
                )}
            </div>
            <button
                type="submit"
                disabled={!message.trim()}
                className={`rounded-xl flex items-center justify-center p-4 md:p-4 focus:outline-none text-white transition-all duration-200 transform ${
                    message.trim() 
                        ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 hover:scale-105 shadow-lg"
                        : "bg-gray-600 cursor-not-allowed opacity-50"
                }`}
                aria-label="Send message"
            >
                <IoSend className="text-xl" />
            </button>
        </form>
    );
};

export default MessageBar;