import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { useAppStore } from '@/store';
import { HOST } from '@/utils/constants';
import { RiCloseFill } from 'react-icons/ri';
import { FaInfoCircle } from 'react-icons/fa';
import { getColor } from '@/lib/utils';
import { useState } from 'react';
import ChannelDetails from '@/pages/chat/components/channel-details';

const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${HOST}${imagePath}`;
    if (imagePath.startsWith('/api/auth/files/')) return `${HOST}${imagePath}`;
    return `${HOST}/api/auth/files/${imagePath}`;
};

const ChatHeader = () => {
    const { closeChat, selectedChatData, selectedChatType, updateChannel } = useAppStore();
    const [showChannelDetails, setShowChannelDetails] = useState(false);

    if (!selectedChatData) {
        return null;
    }

    const handleChannelUpdate = (updatedChannel) => {
        updateChannel(updatedChannel);
        console.log("Channel updated:", updatedChannel);
    };

    return (
        <>
            <header
                className="h-[10vh] bg-gradient-to-r from-[#1a1b23] to-[#2a2b35] border-b border-[#3a3b45] flex items-center justify-between px-6 md:px-20 shadow-lg backdrop-blur-sm"
                aria-label="Chat Header"
            >
                <div className="flex gap-5 items-center w-full justify-between">
                    <div className="flex gap-4 items-center justify-center min-w-0">
                        <div className="w-12 h-12 relative group">
                            <Avatar className="h-12 w-12 rounded-full overflow-hidden ring-2 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all duration-300">
                                {selectedChatData.image ? (
                                    <AvatarImage
                                        src={getImageUrl(selectedChatData.image)}
                                        alt="profile"
                                        className="object-cover w-full h-full bg-black"
                                        onError={e => { e.target.style.display = 'none'; }}
                                    />
                                ) : selectedChatType === "channel" ? (
                                    <div
                                        className="h-12 w-12 text-lg border-2 border-purple-500/30 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg"
                                        aria-label="Channel"
                                    >
                                        #
                                    </div>
                                ) : (
                                    <div
                                        className="uppercase h-12 w-12 text-lg border-2 flex items-center justify-center rounded-full shadow-lg font-semibold"
                                        style={{
                                            background: `linear-gradient(135deg, ${getColor(selectedChatData.color)?.bg}, ${getColor(selectedChatData.color)?.bg}dd)`,
                                            color: getColor(selectedChatData.color)?.text,
                                            borderColor: `${getColor(selectedChatData.color)?.border}66`
                                        }}
                                        aria-label="User Initial"
                                    >
                                        {selectedChatData.firstName
                                            ? selectedChatData.firstName[0].toUpperCase()
                                            : (selectedChatData.email ? selectedChatData.email[0].toUpperCase() : "?")}
                                    </div>
                                )}
                            </Avatar>
                            {/* ✅ Removed online status indicator */}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate max-w-[180px] md:max-w-[300px] text-white font-medium text-lg" aria-label="Chat User Name">
                                {selectedChatType === "contact" && selectedChatData.firstName
                                    ? `${selectedChatData.firstName}${selectedChatData.lastName ? ` ${selectedChatData.lastName}` : ""}`
                                    : selectedChatType === "channel" 
                                        ? `${selectedChatData.name}`
                                        : selectedChatData.email}
                            </div>
                            {selectedChatType === "channel" && (
                                <div className="text-sm text-gray-400 flex items-center gap-1">
                                    {/* ✅ Removed green dot indicator */}
                                    {selectedChatData.members?.length || 0} members
                                </div>
                            )}
                            {/* ✅ Removed "Online" status text for contacts */}
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        {selectedChatType === "channel" && (
                            <button
                                className="p-2 text-neutral-400 focus:outline-none hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 transform hover:scale-105"
                                onClick={() => setShowChannelDetails(true)}
                                aria-label="Channel details"
                            >
                                <FaInfoCircle className="text-xl" />
                            </button>
                        )}
                        <button
                            className="p-2 text-neutral-400 focus:outline-none hover:text-white hover:bg-red-500/20 rounded-lg transition-all duration-200 transform hover:scale-105"
                            onClick={closeChat}
                            aria-label="Close chat"
                        >
                            <RiCloseFill className="text-2xl" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Channel Details Modal */}
            {selectedChatType === "channel" && (
                <ChannelDetails
                    channel={selectedChatData}
                    isOpen={showChannelDetails}
                    onClose={() => setShowChannelDetails(false)}
                    onUpdate={handleChannelUpdate}
                />
            )}
        </>
    );
};

export default ChatHeader;