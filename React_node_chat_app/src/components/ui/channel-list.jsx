import { useAppStore } from "@/store";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { HOST } from "@/utils/constants";
import { Badge } from "./badge";
import { useSocket } from "@/context/socketcontext";

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
                                <AvatarImage
                                    src={channel.image ? `${HOST}/${channel.image}` : ""}
                                    alt={channel.name}
                                />
                                <AvatarFallback className="bg-purple-600 text-white font-bold text-sm">
                                    #
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="text-white font-medium mb-0.5">{channel.name}</h3>
                                {channel.unreadCount && channel.unreadCount > 0 && (
                                    <Badge className="bg-purple-600 text-xs px-1">
                                        {channel.unreadCount}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                                {channel.admin && (
                                    <span className="text-xs text-purple-400">
                                        • Admin: {channel.admin.firstName} {channel.admin.lastName}
                                    </span>
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