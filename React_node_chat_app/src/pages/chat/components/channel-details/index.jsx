import { useState, useRef } from "react";
import { FaCamera, FaEdit, FaUserPlus, FaUserMinus, FaTrash, FaCrown } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/lib/api_client";
import { HOST, GET_ALL_CONTACTS_ROUTE } from "@/utils/constants";
import { useAppStore } from "@/store";

const ChannelDetails = ({ channel, isOpen, onClose, onUpdate }) => {
    const { userInfo, removeChannel } = useAppStore();
    const [isEditing, setIsEditing] = useState(false);
    const [channelName, setChannelName] = useState(channel?.name || "");
    const [channelDescription, setChannelDescription] = useState(channel?.description || "");
    const [channelImage, setChannelImage] = useState(null);
    const [channelImagePreview, setChannelImagePreview] = useState("");
    const [showAddMembers, setShowAddMembers] = useState(false);
    const [allContacts, setAllContacts] = useState([]);
    const [selectedNewMembers, setSelectedNewMembers] = useState([]);
    const fileInputRef = useRef(null);

    const isAdmin = channel?.admin?._id === userInfo?.id || channel?.admin === userInfo?.id;

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setChannelImage(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setChannelImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = async () => {
        try {
            const formData = new FormData();
            formData.append('name', channelName);
            formData.append('description', channelDescription);
            
            if (channelImage) {
                formData.append('image', channelImage);
            }

            const response = await apiClient.put(`/api/channels/${channel._id}`, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                onUpdate(response.data.channel);
                setIsEditing(false);
                setChannelImage(null);
                setChannelImagePreview("");
            }
        } catch (error) {
            console.error("Failed to update channel:", error);
        }
    };

    const handleRemoveMember = async (memberId) => {
        try {
            const response = await apiClient.delete(`/api/channels/${channel._id}/members`, {
                data: { members: [memberId] },
                withCredentials: true,
            });

            if (response.data.success) {
                onUpdate(response.data.channel);
            }
        } catch (error) {
            console.error("Failed to remove member:", error);
        }
    };

    const handleAddMembers = async () => {
        try {
            const memberIds = selectedNewMembers.map(contact => contact.id || contact._id);
            const response = await apiClient.post(`/api/channels/${channel._id}/members`, {
                members: memberIds
            }, {
                withCredentials: true,
            });

            if (response.data.success) {
                onUpdate(response.data.channel);
                setShowAddMembers(false);
                setSelectedNewMembers([]);
            }
        } catch (error) {
            console.error("Failed to add members:", error);
        }
    };

    const handleDeleteChannel = async () => {
        if (window.confirm("Are you sure you want to delete this channel? This action cannot be undone.")) {
            try {
                const response = await apiClient.delete(`/api/channels/${channel._id}`, {
                    withCredentials: true,
                });

                if (response.data.success) {
                    // Remove channel from global state
                    removeChannel(channel._id);
                    onClose();
                }
            } catch (error) {
                console.error("Failed to delete channel:", error);
            }
        }
    };

    const loadContacts = async () => {
        try {
            const response = await apiClient.get(GET_ALL_CONTACTS_ROUTE, {
                withCredentials: true,
            });
            const contacts = response.data.contacts || [];
            // Filter out existing members
            const existingMemberIds = channel.members.map(member => member._id || member.id);
            const availableContacts = contacts.filter(contact => 
                !existingMemberIds.includes(contact._id || contact.id)
            );
            setAllContacts(availableContacts);
        } catch (error) {
            console.error("Failed to fetch contacts:", error);
        }
    };

    const handleShowAddMembers = () => {
        setShowAddMembers(true);
        loadContacts();
    };

    if (!channel) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent 
                className="bg-[#181920] border-none text-white w-[95vw] sm:w-[90vw] md:w-[550px] max-w-[550px] h-[90vh] max-h-[700px] flex flex-col p-0 gap-0 overflow-hidden"
                style={{ zIndex: 9999 }}
            >
                {/* Header */}
                <DialogHeader className="flex-shrink-0 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-700">
                    <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-purple-400">#</span>
                        {isEditing ? (
                            <Input
                                value={channelName}
                                onChange={(e) => setChannelName(e.target.value)}
                                className="bg-[#2c2e3b] border-none text-white h-8 text-sm sm:text-base px-3"
                                placeholder="Channel name"
                            />
                        ) : (
                            <span className="truncate">{channel.name}</span>
                        )}
                        {isAdmin && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditing(!isEditing)}
                                className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 p-1.5 h-auto"
                            >
                                <FaEdit size={14} />
                            </Button>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 text-xs sm:text-sm mt-1">
                        Channel Details
                    </DialogDescription>
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4">
                    {/* Channel Image */}
                    <div className="flex flex-col items-center mb-5">
                        <div className="relative mb-3">
                            <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                                {channelImagePreview ? (
                                    <AvatarImage src={channelImagePreview} alt="Channel" />
                                ) : channel.image ? (
                                    <AvatarImage src={`${HOST}/${channel.image}`} alt="Channel" />
                                ) : (
                                    <AvatarFallback className="bg-purple-600 text-white text-5xl sm:text-6xl">
                                        👥
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            {isAdmin && isEditing && (
                                <>
                                    <button
                                        type="button"
                                        className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 rounded-full p-2 transition-colors shadow-lg"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <FaCamera className="w-3 h-3" />
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </>
                            )}
                        </div>
                        <h2 className="text-lg sm:text-xl font-semibold mb-1">{channel.name}</h2>
                        {channel.description && (
                            <p className="text-gray-400 text-xs sm:text-sm text-center max-w-xs px-4">
                                {channel.description}
                            </p>
                        )}
                    </div>

                    {/* Channel Description Edit */}
                    {isEditing && (
                        <div className="mb-5">
                            <label className="text-xs sm:text-sm text-gray-400 mb-2 block">Description</label>
                            <Input
                                value={channelDescription}
                                onChange={(e) => setChannelDescription(e.target.value)}
                                className="bg-[#2c2e3b] border-none text-white text-sm px-3"
                                placeholder="Channel description (optional)"
                            />
                        </div>
                    )}

                    {/* Members Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm sm:text-base font-semibold">
                                Members ({channel.members?.length || 0})
                            </h3>
                            {isAdmin && !showAddMembers && (
                                <Button
                                    onClick={handleShowAddMembers}
                                    size="sm"
                                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 h-auto flex items-center gap-1.5"
                                >
                                    <FaUserPlus size={12} />
                                    Add
                                </Button>
                            )}
                        </div>

                        {/* Add Members Section */}
                        {showAddMembers && (
                            <div className="mb-4 p-3 sm:p-4 bg-[#2c2e3b] rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-xs sm:text-sm">Add New Members</h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowAddMembers(false);
                                            setSelectedNewMembers([]);
                                        }}
                                        className="p-1 h-auto hover:bg-gray-700"
                                    >
                                        <IoClose size={18} />
                                    </Button>
                                </div>
                                
                                <div className="max-h-40 overflow-y-auto mb-3 space-y-1">
                                    {allContacts.map(contact => (
                                        <div
                                            key={contact._id}
                                            className={`flex items-center gap-3 p-2.5 hover:bg-[#23242a] rounded cursor-pointer transition-all ${
                                                selectedNewMembers.some(c => (c.id || c._id) === (contact.id || contact._id))
                                                    ? "bg-purple-900"
                                                    : ""
                                            }`}
                                            onClick={() => {
                                                setSelectedNewMembers(prev =>
                                                    prev.some(c => (c.id || c._id) === (contact.id || contact._id))
                                                        ? prev.filter(c => (c.id || c._id) !== (contact.id || contact._id))
                                                        : [...prev, contact]
                                                );
                                            }}
                                        >
                                            <Avatar className="h-8 w-8 flex-shrink-0">
                                                <AvatarImage src={contact.image ? `${HOST}/${contact.image}` : ""} />
                                                <AvatarFallback className="bg-gray-600 text-white text-xs">
                                                    {contact.firstName?.[0]?.toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs sm:text-sm truncate">
                                                {contact.firstName} {contact.lastName}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                
                                {selectedNewMembers.length > 0 && (
                                    <Button
                                        onClick={handleAddMembers}
                                        className="w-full bg-green-600 hover:bg-green-700 text-xs sm:text-sm py-2 h-auto"
                                    >
                                        Add {selectedNewMembers.length} Member(s)
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Current Members List */}
                        <div className="space-y-1">
                            {channel.members?.map(member => (
                                <div
                                    key={member._id || member.id}
                                    className="flex items-center justify-between p-2.5 sm:p-3 hover:bg-[#2c2e3b] rounded transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Avatar className="h-10 w-10 flex-shrink-0">
                                            <AvatarImage src={member.image ? `${HOST}/${member.image}` : ""} />
                                            <AvatarFallback className="bg-gray-600 text-white text-sm">
                                                {member.firstName?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium text-sm flex items-center gap-2">
                                                <span className="truncate">
                                                    {member.firstName} {member.lastName}
                                                </span>
                                                {(member._id === channel.admin?._id || member._id === channel.admin) && (
                                                    <Badge className="bg-yellow-600 text-yellow-100 text-[10px] px-1.5 py-0.5 flex-shrink-0 flex items-center gap-1">
                                                        <FaCrown size={8} />
                                                        Admin
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400 truncate">{member.email}</div>
                                        </div>
                                    </div>
                                    
                                    {isAdmin && member._id !== channel.admin?._id && member._id !== channel.admin && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveMember(member._id)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 ml-2 flex-shrink-0 h-auto"
                                        >
                                            <FaUserMinus size={14} />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Admin Actions - Danger Zone */}
                    {isAdmin && (
                        <div className="border-t border-gray-700 pt-4 mt-6">
                            <h3 className="text-xs sm:text-sm font-semibold mb-3 text-red-400 flex items-center gap-2">
                                <FaTrash size={12} />
                                Danger Zone
                            </h3>
                            <Button
                                onClick={handleDeleteChannel}
                                variant="destructive"
                                className="w-full bg-red-600 hover:bg-red-700 text-sm py-2.5 h-auto flex items-center justify-center gap-2"
                            >
                                <FaTrash size={12} />
                                Delete Channel
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer Action Buttons */}
                <div className="flex-shrink-0 px-4 sm:px-5 py-3 border-t border-gray-700 bg-[#181920]">
                    {isEditing ? (
                        <div className="flex gap-2">
                            <Button
                                onClick={handleSaveChanges}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-sm py-2 h-auto"
                            >
                                Save Changes
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsEditing(false);
                                    setChannelName(channel.name);
                                    setChannelDescription(channel.description || "");
                                    setChannelImage(null);
                                    setChannelImagePreview("");
                                }}
                                variant="ghost"
                                className="flex-1 text-sm py-2 h-auto hover:bg-gray-700"
                            >
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <Button 
                            onClick={onClose} 
                            variant="ghost" 
                            className="w-full text-sm py-2 h-auto hover:bg-gray-700"
                        >
                            Close
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ChannelDetails;