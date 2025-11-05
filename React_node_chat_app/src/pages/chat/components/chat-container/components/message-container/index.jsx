import { useAppStore } from "@/store";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/context/socketcontext";
import apiClient from "@/lib/api_client";
import { GET_ALL_MESSAGES_ROUTE, GET_CHANNEL_MESSAGES_ROUTE, HOST } from "@/utils/constants";
import { IoMdArrowRoundDown } from "react-icons/io";
import { MdFolderZip } from "react-icons/md";
import { IoCloseSharp } from "react-icons/io5";

const MessageContainer = () => {
    const scrollRef = useRef();
    const socket = useSocket();
    const {
        selectedChatMessages,
        selectedChatType,
        selectedChatData,
        userInfo,
        setSelectedChatMessages,
        setFileDownloadingprogress,
        setDownloading,
        addMessage,
    } = useAppStore();

    const [showImage, setShowImage] = useState(false);
    const [imageURL, setImageURL] = useState(null);

    useEffect(() => {
        const getMessages = async () => {
            try {
                let response;
                if (selectedChatType === "contact") {
                    response = await apiClient.post(
                        "/api/messages/get-message",
                        { id: selectedChatData._id },
                        { withCredentials: true }
                    );
                } else if (selectedChatType === "channel") {
                    response = await apiClient.get(
                        GET_CHANNEL_MESSAGES_ROUTE(selectedChatData._id),
                        { withCredentials: true }
                    );
                }

                if (response?.data?.messages) {
                    setSelectedChatMessages(response.data.messages);
                } else if (response?.data?.message) {
                    setSelectedChatMessages(response.data.message);
                } else {
                    setSelectedChatMessages([]);
                }
            } catch (error) {
                console.log({ error });
                setSelectedChatMessages([]);
            }
        };

        if (selectedChatData?._id && (selectedChatType === "contact" || selectedChatType === "channel")) {
            getMessages();
        }
    }, [selectedChatData?._id, selectedChatType, setSelectedChatMessages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [selectedChatMessages]);

    const checkIfImage = (filePath) => {
        const imageRegex = /\.(jpg|jpeg|png|gif|bmp|tiff|tif|webp|svg|ico|heic|heif)$/i;
        return imageRegex.test(filePath);
    };

    const downloadFile = async (url) => {
        setDownloading(true);
        setFileDownloadingprogress(0);
        try {
            const response = await apiClient.get(`${HOST}/${url}`, {
                responseType: "blob",
                onDownloadProgress: (ProgressEvent) => {
                    const { loaded, total } = ProgressEvent;
                    const percentCompleted = Math.round((loaded * 100) / total);
                    setFileDownloadingprogress(percentCompleted);
                },
            });
            const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = urlBlob;
            link.setAttribute("download", url.split("/").pop());
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(urlBlob);
            setDownloading(false);
            setFileDownloadingprogress(0);
        } catch (error) {
            console.error("File download failed:", error);
            setDownloading(false);
            setFileDownloadingprogress(0);
        }
    };

    const renderDMMessages = (message) => {
        const isOwnMessage = message.sender?._id === userInfo?.id || message.sender === userInfo?.id;

        return (
            <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4 group`}>
                <div className={`flex items-end gap-2 max-w-[70%] ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
                    {(selectedChatType === "channel" && !isOwnMessage) && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                            {typeof message.sender === "object"
                                ? (message.sender.firstName?.[0]?.toUpperCase() ||
                                      message.sender.email?.[0]?.toUpperCase() ||
                                      "?")
                                : "?"}
                        </div>
                    )}

                    <div className="flex flex-col">
                        {selectedChatType === "channel" && !isOwnMessage && (
                            <div className="text-xs text-gray-400 mb-1 px-1">
                                {typeof message.sender === "object"
                                    ? `${message.sender.firstName || ""} ${message.sender.lastName || ""}`.trim() ||
                                      message.sender.email
                                    : "Unknown"}
                            </div>
                        )}

                        <div
                            className={`${
                                isOwnMessage
                                    ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg"
                                    : "bg-[#2a2b33] text-white border border-[#3a3b45]"
                            } inline-block px-4 py-3 rounded-2xl ${
                                isOwnMessage ? "rounded-br-md" : "rounded-bl-md"
                            } break-words shadow-md hover:shadow-lg transition-all duration-200 ${
                                message.isOptimistic ? "opacity-70" : ""
                            }`}
                        >
                            {message.messageType === "text" && (
                                <div className="text-sm leading-relaxed">{message.content}</div>
                            )}

                            {message.messageType === "file" && (
                                <div className="flex flex-col gap-2">
                                    {checkIfImage(message.fileUrl) ? (
                                        <div
                                            className="cursor-pointer rounded-lg overflow-hidden hover:opacity-80 transition-all duration-200"
                                            onClick={() => {
                                                setImageURL(message.fileUrl);
                                                setShowImage(true);
                                            }}
                                        >
                                            <img
                                                src={`${HOST}/${message.fileUrl}`}
                                                alt="Attachment"
                                                className="max-w-[200px] max-h-[200px] object-cover rounded-lg shadow-md"
                                                onError={(e) => {
                                                    console.error("Image failed to load:", `${HOST}/${message.fileUrl}`);
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className="flex items-center gap-3 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors cursor-pointer"
                                            onClick={() => downloadFile(message.fileUrl)}
                                        >
                                            <MdFolderZip className="text-2xl text-blue-400" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">
                                                    {message.fileUrl.split(/[/\\]/).pop()}
                                                </div>
                                                <div className="text-xs text-gray-400">Click to download</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div
                            className={`text-xs text-gray-500 mt-1 px-1 ${
                                isOwnMessage ? "text-right" : "text-left"
                            } opacity-0 group-hover:opacity-100 transition-opacity`}
                        >
                            {moment(message.timestamp).format("HH:mm")}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderMessages = () => {
        let lastDate = null;

        const uniqueMessages = selectedChatMessages.reduce((acc, message) => {
            const messageId = message._id;
            const optimisticId = message.optimisticId;

            const existingIndex = acc.findIndex(msg => {
                // Exact ID match
                if (messageId && msg._id === messageId) return true;
                if (optimisticId && msg.optimisticId === optimisticId) return true;

                // File message duplicate check
                if (
                    message.messageType === "file" &&
                    msg.messageType === "file" &&
                    message.fileUrl === msg.fileUrl &&
                    message.fileName === msg.fileName &&
                    message.sender === msg.sender &&
                    message.recipient === msg.recipient &&
                    Math.abs(new Date(message.timestamp) - new Date(msg.timestamp)) < 2000 // 2 seconds
                ) {
                    return true;
                }

                // Text message duplicate check (optional)
                if (
                    message.messageType === "text" &&
                    msg.messageType === "text" &&
                    message.content === msg.content &&
                    message.sender === msg.sender &&
                    message.recipient === msg.recipient &&
                    Math.abs(new Date(message.timestamp) - new Date(msg.timestamp)) < 2000
                ) {
                    return true;
                }

                return false;
            });

            if (existingIndex !== -1) {
                // Replace optimistic message with real one if needed
                if (messageId && !message.isOptimistic) {
                    acc[existingIndex] = message;
                }
            } else {
                acc.push(message);
            }

            return acc;
        }, []);

        uniqueMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        return uniqueMessages.map((message, index) => {
            const messageDate = moment(message.timestamp).format("YYYY-MM-DD");
            const showDate = messageDate !== lastDate;
            lastDate = messageDate;

            const isLast = index === uniqueMessages.length - 1;

            return (
                <div key={message._id || message.optimisticId || `msg-${index}`} ref={isLast ? scrollRef : null}>
                    {showDate && (
                        <div className="flex justify-center my-2">
                            <span className="bg-gray-700 text-white px-3 py-1 rounded-full text-xs">
                                {moment(message.timestamp).format("MMM DD, YYYY")}
                            </span>
                        </div>
                    )}
                    {renderDMMessages(message)}
                </div>
            );
        });
    };

    // Also add this helper function to your component to debug
    const logMessages = () => {
        console.log("All messages:", selectedChatMessages.map(msg => ({
            id: msg._id,
            optimisticId: msg.optimisticId,
            content: msg.content || msg.fileName,
            timestamp: msg.timestamp,
            isOptimistic: msg.isOptimistic
        })));
    };

    // You can call logMessages() in useEffect to debug
    useEffect(() => {
        console.log("Messages updated, count:", selectedChatMessages.length);
        // Uncomment the line below to debug message duplicates
        // logMessages();
    }, [selectedChatMessages]);

    // Add this useEffect to handle real-time messages
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (message) => {
            // Only add if it's for the current chat
            if (selectedChatType === "contact" && 
                (message.recipient === selectedChatData._id || message.sender === selectedChatData._id)) {
                setSelectedChatMessages([...selectedChatMessages, message]);
            }
        };

        const handleReceiveChannelMessage = (message) => {
            if (selectedChatType === "channel" && message.channelId === selectedChatData._id) {
                setSelectedChatMessages((prev) => {
                    // Replace optimistic message if optimisticId matches
                    if (message.optimisticId) {
                        return prev.map(msg =>
                            msg.optimisticId === message.optimisticId ? message : msg
                        );
                    }
                    // Otherwise, add new message
                    return [...prev, message];
                });
            }
        };

        socket.on("receiveMessage", handleReceiveMessage);
        socket.on("receiveChannelMessage", handleReceiveChannelMessage);

        return () => {
            socket.off("receiveMessage", handleReceiveMessage);
            socket.off("receiveChannelMessage", handleReceiveChannelMessage);
        };
    }, [socket, selectedChatType, selectedChatData?._id, selectedChatMessages, setSelectedChatMessages]);

    useEffect(() => {
        if (selectedChatType === "channel" && selectedChatData?._id && socket) {
            socket.emit("joinChannel", selectedChatData._id);
        }
    }, [selectedChatType, selectedChatData?._id, socket]);

    return (
        <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 py-6 md:px-8 bg-gradient-to-b from-[#1a1b23] to-[#1f202a] md:w-[65vw] lg:w-[70vw] xl:w-[80vw] w-full">
            {selectedChatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-400">
                        <div className="text-4xl mb-4">💬</div>
                        <div className="text-lg font-medium mb-2">
                            {selectedChatType === "channel" ? "Welcome to the channel!" : "Start a conversation"}
                        </div>
                        <div className="text-sm">
                            {selectedChatType === "channel"
                                ? "Send a message to get the conversation started."
                                : "Send a message to start chatting."}
                        </div>
                    </div>
                </div>
            ) : (
                renderMessages()
            )}
            <div ref={scrollRef} />
            {showImage && (
                <div className="fixed z-[1000] top-0 left-0 h-[100vh] w-[100vw] flex items-center justify-center backdrop-blur-xl bg-black/50 flex-col">
                    <div className="relative">
                        <img
                            src={`${HOST}/${imageURL}`}
                            className="max-h-[80vh] max-w-[80vw] object-contain rounded-lg shadow-2xl"
                            alt="Preview"
                        />
                    </div>
                    <div className="flex gap-4 fixed top-6 right-6">
                        <button
                            className="bg-black/30 backdrop-blur-sm p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-200 text-white border border-white/20"
                            onClick={() => downloadFile(imageURL)}
                        >
                            <IoMdArrowRoundDown />
                        </button>
                        <button
                            className="bg-black/30 backdrop-blur-sm p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-200 text-white border border-white/20"
                            onClick={() => {
                                setShowImage(false);
                                setImageURL(null);
                            }}
                        >
                            <IoCloseSharp />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageContainer;
