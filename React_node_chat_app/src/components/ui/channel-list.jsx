import { useAppStore } from "@/store";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { HOST } from "@/utils/constants";
import { Badge } from "./badge";
import { useSocket } from "@/context/socketcontext";

const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/api/auth/files/')) return `${HOST}${imagePath}`;
    return `${HOST}/api/auth/files/${imagePath}`;
};

const ChannelList = ({ channels = [] }) => {
    const { setSelectedChatType, setSelectedChatData, selectedChatData, selectedChatType } = useAppStore();
    const socket = useSocket();

    const handleChannelSelect = (channel) => {
        setSelectedChatType("channel");
        setSelectedChatData(channel);
        
        // Join the channel room for real-time messaging
        if (socket) {
            socket.emit("joinChannel", channel._id);
            console.log("Joined channel:", channel._id);
        }
    };

    return (
        <div className="px-4 pt-2 pb-4">
            {channels.length === 0 ? (
                <div className="text-center text-gray-400 pt-4">
                    No channels available.
                </div>
            ) : (
                channels.map((channel) => (
                    <div
                        key={channel._id}
                        className={`flex items-center gap-3 p-3 hover:bg-[#25272e] rounded mb-1 cursor-pointer transition-all ${
                            selectedChatType === "channel" && selectedChatData?._id === channel._id ? "bg-[#343440]" : ""
                        }`}
                        onClick={() => handleChannelSelect(channel)}
                    >
                        <div className="relative">
                            <Avatar className="h-10 w-10">
                                {channel.image ? (
                                    <AvatarImage
                                        src={getImageUrl(channel.image)}
                                        alt={channel.name}
                                        className="object-cover"
                                    />
                                ) : (
                                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-700 text-white font-bold text-lg">
                                        #
                                    </AvatarFallback>
                                )}
                            </Avatar>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="text-white font-medium mb-0.5 truncate max-w-[180px]">
                                    {channel.name}
                                </h3>
                                {channel.unreadCount && channel.unreadCount > 0 && (
                                    <Badge className="bg-purple-600 text-xs px-1.5 py-0.5 ml-2 shrink-0">
                                        {channel.unreadCount}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-xs text-gray-400">
                                    {channel.members?.length || 0} members
                                </span>
                                {channel.admin && (
                                    <>
                                        <span className="text-xs text-gray-500">•</span>
                                        <span className="text-xs text-purple-400 truncate max-w-[120px]">
                                            Admin: {channel.admin.firstName || channel.admin.email}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ChannelList;