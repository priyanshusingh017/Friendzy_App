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
        if (!message.trim() || !socket || !userInfo || !selectedChatData) return;

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
            // Generate unique optimistic message ID
            const tempId = `optimistic_${userInfo.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Add message immediately for optimistic UI update
            const optimisticMessage = {
                sender: { _id: userInfo.id, firstName: userInfo.firstName, lastName: userInfo.lastName },
                content: message,
                messageType: "text",
                timestamp: new Date().toISOString(),
                recipient: selectedChatData._id,
                _id: tempId,
                isOptimistic: true, // Mark as optimistic
            };
            
            addMessage(optimisticMessage);
            
            socket.emit("sendChannelMessage", {
                channelId: selectedChatData._id,
                message: {
                    sender: userInfo.id,
                    content: message,
                    messageType: "text",
                    fileUrl: undefined,
                },
                optimisticId: tempId, // Send the optimistic ID to server for replacement
            });
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
        formData.append("sender", userInfo.id);
        formData.append("recipientId", selectedChatData._id); // <-- Correct field name

        // Use relative path in dev (proxy), full URL in prod
        const uploadUrl = import.meta.env.PROD ? UPLOAD_FILE_ROUTE : '/api/message/upload-file';

        try {
            setUploading(true);
            const response = await apiClient.post(uploadUrl, formData, {
                withCredentials: true,
                onUploadProgress: (data) => {
                    setFileUploadingprogress(Math.round((100 * data.loaded) / data.total));
                }
            });
            setUploading(false);
            setFileUploadingprogress(0);

            if (response.status === 200 && response.data && response.data.message) {
                if (selectedChatType === "contact") {
                    socket.emit("sendMessage", {
                        sender: userInfo.id,
                        recipient: selectedChatData._id,
                        messageType: "file",
                        fileUrl: response.data.message.fileUrl,
                        fileName: response.data.message.fileName || file.name,
                        fileType: response.data.message.fileType || file.type,
                        content: "",
                    });
                } else if (selectedChatType === "channel") {
                    // Generate unique optimistic message ID for file
                    const tempId = `optimistic_${userInfo.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    
                    // Add file message immediately for optimistic UI update
                    const optimisticFileMessage = {
                        sender: { _id: userInfo.id, firstName: userInfo.firstName, lastName: userInfo.lastName },
                        messageType: "file",
                        fileUrl: response.data.message.fileUrl,
                        fileName: response.data.message.fileName || file.name,
                        fileType: response.data.message.fileType || file.type,
                        content: "",
                        timestamp: new Date().toISOString(),
                        recipient: selectedChatData._id,
                        _id: tempId,
                        isOptimistic: true,
                    };
                    
                    addMessage(optimisticFileMessage);
                    
                    socket.emit("sendChannelMessage", {
                        channelId: selectedChatData._id,
                        message: {
                            sender: userInfo.id,
                            messageType: "file",
                            fileUrl: response.data.message.fileUrl,
                            fileName: response.data.message.fileName || file.name,
                            fileType: response.data.message.fileType || file.type,
                            content: "",
                        },
                        optimisticId: tempId, // Send the optimistic ID to server for replacement
                    });
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
                {/* Emoji Picker: positioned above input, only visible when open */}
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