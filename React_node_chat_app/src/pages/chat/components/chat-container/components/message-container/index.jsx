import { useAppStore } from "@/store";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import apiClient from "@/lib/api_client";
import { GET_ALL_MESSAGES_ROUTE, GET_CHANNEL_MESSAGES_ROUTE, HOST } from "@/utils/constants";
import { IoMdArrowRoundDown } from "react-icons/io";
import { MdFolderZip } from "react-icons/md";
import { IoCloseSharp } from "react-icons/io5";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";

const MessageContainer = () => {
    const scrollRef = useRef();
    const {
        selectedChatMessages,
        selectedChatType,
        selectedChatData,
        userInfo,
        setSelectedChatMessages,
        setFileDownloadingprogress,
        setDownloading,
    } = useAppStore();

    const [showImage, setShowImage] = useState(false);
    const [imageURL, setImageURL] = useState(null);

    useEffect(() => {
        const getMessages = async () => {
            try {
                const response = await apiClient.post(
                    GET_ALL_MESSAGES_ROUTE,
                    { id: selectedChatData._id },
                    { withCredentials: true }
                );
                if (response.data.messages) {
                    setSelectedChatMessages(response.data.messages);
                }
            } catch (error) {
                console.log({ error });
            }
        };

        const getChannelMessages = async () => {
            try {
                const response = await apiClient.get(
                    `${GET_CHANNEL_MESSAGES_ROUTE}/${selectedChatData._id}`,
                    { withCredentials: true }
                );
                console.log("📥 Fetched channel messages:", response.data);
                if (response.data.messages) {
                    setSelectedChatMessages(response.data.messages);
                }
            } catch (error) {
                console.log("Error fetching channel messages:", error);
            }
        };

        if (selectedChatData?._id) {
            if (selectedChatType === "contact") {
                getMessages();
            } else if (selectedChatType === "channel") {
                getChannelMessages();
            }
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

    const getFileUrl = (fileUrl) => {
        if (!fileUrl) return null;
        if (fileUrl.startsWith('http')) return fileUrl;
        if (fileUrl.startsWith('/api/auth/files/')) return `${HOST}${fileUrl}`;
        return `${HOST}/api/auth/files/${fileUrl}`;
    };

    const getUserImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        if (imagePath.startsWith('/api/auth/files/')) return `${HOST}${imagePath}`;
        return `${HOST}/api/auth/files/${imagePath}`;
    };

    const downloadFile = async (url) => {
        setDownloading(true);
        setFileDownloadingprogress(0);
        try {
            const fileUrl = getFileUrl(url);
            const response = await apiClient.get(fileUrl, {
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
        const isOwnMessage = message.sender === selectedChatData._id;

        return (
            <div className={`${isOwnMessage ? "text-left" : "text-right"}`}>
                {message.messageType === "text" && (
                    <div
                        className={`${
                            !isOwnMessage
                                ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50"
                                : "bg-[#2a2b33]/5 text-white/80 border-[#ffffff]/20"
                        } border inline-block p-4 rounded my-1 max-w-[50%] break-words`}
                    >
                        {message.content}
                    </div>
                )}
                {message.messageType === "file" && (
                    <div
                        className={`${
                            !isOwnMessage
                                ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50"
                                : "bg-[#2a2b33]/5 text-white/80 border-[#ffffff]/20"
                        } border inline-block p-4 rounded my-1 max-w-[50%] break-words`}
                    >
                        {checkIfImage(message.fileUrl) ? (
                            <div
                                className="cursor-pointer"
                                onClick={() => {
                                    setShowImage(true);
                                    setImageURL(message.fileUrl);
                                }}
                            >
                                <img
                                    src={getFileUrl(message.fileUrl)}
                                    height={300}
                                    width={300}
                                    alt="attachment"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-4">
                                <span className="text-white/80 text-3xl rounded-full bg-black/20 p-3">
                                    <MdFolderZip />
                                </span>
                                <span>{message.fileUrl.split("/").pop()}</span>
                                <span
                                    className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
                                    onClick={() => downloadFile(message.fileUrl)}
                                >
                                    <IoMdArrowRoundDown />
                                </span>
                            </div>
                        )}
                    </div>
                )}
                <div className="text-xs text-gray-600">
                    {moment(message.timestamp).format("LT")}
                </div>
            </div>
        );
    };

    const renderChannelMessages = (message) => {
        const senderImage = getUserImageUrl(message.sender?.image);
        const senderColor = getColor(message.sender?.color || 0);

        return (
            <div
                className={`mt-5 flex ${
                    message.sender?._id === userInfo.id ? "justify-end" : "justify-start"
                }`}
            >
                {message.sender?._id !== userInfo.id && (
                    <div className="flex items-start gap-3">
                        {/* Sender Profile Image or Avatar */}
                        <div className="flex-shrink-0">
                            {senderImage ? (
                                <img
                                    src={senderImage}
                                    alt={`${message.sender?.firstName} ${message.sender?.lastName}`}
                                    className="h-10 w-10 rounded-full object-cover"
                                    onError={(e) => {
                                        console.error("Failed to load image:", senderImage);
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div 
                                className={`h-10 w-10 rounded-full flex items-center justify-center text-lg font-semibold ${
                                    senderImage ? 'hidden' : 'flex'
                                }`}
                                style={{ backgroundColor: senderColor }}
                            >
                                {message.sender?.firstName
                                    ? message.sender.firstName.charAt(0).toUpperCase()
                                    : message.sender?.email?.charAt(0).toUpperCase() || "?"}
                            </div>
                        </div>

                        {/* Message Content */}
                        <div className="flex flex-col max-w-[70%]">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white/90">
                                    {message.sender?.firstName && message.sender?.lastName
                                        ? `${message.sender.firstName} ${message.sender.lastName}`
                                        : message.sender?.email || "Unknown User"}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {moment(message.timestamp).format("LT")}
                                </span>
                            </div>
                            {message.messageType === "text" ? (
                                <div className="bg-[#2a2b33] text-white/90 border border-white/10 break-words p-3 rounded-lg">
                                    {message.content}
                                </div>
                            ) : (
                                <div className="bg-[#2a2b33] text-white/90 border border-white/10 rounded-lg overflow-hidden">
                                    {checkIfImage(message.fileUrl) ? (
                                        <div
                                            className="cursor-pointer"
                                            onClick={() => {
                                                setImageURL(getFileUrl(message.fileUrl));
                                                setShowImage(true);
                                            }}
                                        >
                                            <img
                                                src={getFileUrl(message.fileUrl)}
                                                alt="attachment"
                                                className="w-full h-auto max-w-sm object-cover rounded-lg"
                                                style={{ maxHeight: '400px' }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 p-3">
                                            <span className="text-white/80 text-3xl bg-black/20 rounded-full p-3">
                                                <MdFolderZip />
                                            </span>
                                            <span className="text-sm flex-1 truncate">{message.fileUrl?.split("/").pop()}</span>
                                            <span
                                                className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
                                                onClick={() => downloadFile(getFileUrl(message.fileUrl))}
                                            >
                                                <IoMdArrowRoundDown />
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {message.sender?._id === userInfo.id && (
                    <div className="flex flex-col max-w-[70%]">
                        <div className="flex items-center justify-end gap-2 mb-1">
                            <span className="text-xs text-gray-400">
                                {moment(message.timestamp).format("LT")}
                            </span>
                        </div>
                        {message.messageType === "text" ? (
                            <div className="bg-[#8417ff]/20 text-white/90 border border-[#8417ff]/50 break-words p-3 rounded-lg">
                                {message.content}
                            </div>
                        ) : (
                            <div className="bg-[#8417ff]/20 text-white/90 border border-[#8417ff]/50 rounded-lg overflow-hidden">
                                {checkIfImage(message.fileUrl) ? (
                                    <div
                                        className="cursor-pointer"
                                        onClick={() => {
                                            setImageURL(getFileUrl(message.fileUrl));
                                            setShowImage(true);
                                        }}
                                    >
                                        <img
                                            src={getFileUrl(message.fileUrl)}
                                            alt="attachment"
                                            className="w-full h-auto max-w-sm object-cover rounded-lg"
                                            style={{ maxHeight: '400px' }}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 p-3">
                                        <span className="text-white/80 text-3xl bg-black/20 rounded-full p-3">
                                            <MdFolderZip />
                                        </span>
                                        <span className="text-sm flex-1 truncate">{message.fileUrl?.split("/").pop()}</span>
                                        <span
                                            className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
                                            onClick={() => downloadFile(getFileUrl(message.fileUrl))}
                                        >
                                            <IoMdArrowRoundDown />
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderMessages = () => {
        let lastDate = null;

        const uniqueMessages = selectedChatMessages.reduce((acc, message) => {
            const messageId = message._id;
            const optimisticId = message.optimisticId;

            const existingIndex = acc.findIndex(msg => {
                if (messageId && msg._id === messageId) return true;
                if (optimisticId && msg.optimisticId === optimisticId) return true;
                return false;
            });

            if (existingIndex !== -1) {
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

            return (
                <div key={message._id || message.optimisticId || `msg-${index}`}>
                    {showDate && (
                        <div className="text-center text-gray-500 my-2">
                            {moment(message.timestamp).format("LL")}
                        </div>
                    )}
                    {selectedChatType === "contact" && renderDMMessages(message)}
                    {selectedChatType === "channel" && renderChannelMessages(message)}
                </div>
            );
        });
    };

    return (
        <div className="flex-1 overflow-y-auto scrollbar-hidden p-4 px-8 md:w-[65vw] lg:w-[70vw] xl:w-[80vw] w-full">
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
                <>
                    {renderMessages()}
                    <div ref={scrollRef} />
                </>
            )}
            {showImage && (
                <div className="fixed z-[1000] top-0 left-0 h-[100vh] w-[100vw] flex items-center justify-center backdrop-blur-lg flex-col bg-black/80">
                    <div className="relative max-w-[90vw] max-h-[90vh]">
                        <img
                            src={getFileUrl(imageURL)}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            alt="preview"
                        />
                    </div>
                    <div className="flex gap-5 fixed top-0 mt-5">
                        <button
                            className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300 text-white"
                            onClick={() => downloadFile(imageURL)}
                        >
                            <IoMdArrowRoundDown />
                        </button>
                        <button
                            className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300 text-white"
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
