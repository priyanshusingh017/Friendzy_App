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
import { ScrollArea } from "@/components/ui/scroll-area";
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
            <DialogContent className="bg-[#181920] border-none text-white w-[75vw] max-w-[400px] h-[70vh] flex flex-col mx-2">
                <DialogHeader className="flex-shrink-0 pb-2">
                    <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                        <span>#</span>
                        {isEditing ? (
                            <Input
                                value={channelName}
                                onChange={(e) => setChannelName(e.target.value)}
                                className="bg-[#2c2e3b] border-none text-white"
                                placeholder="Channel name"
                            />
                        ) : (
                            <span>{channel.name}</span>
                        )}
                        {isAdmin && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditing(!isEditing)}
                                className="text-purple-400 hover:text-purple-300"
                            >
                                <FaEdit size={14} />
                            </Button>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Channel Details
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-2">
                    {/* Channel Image */}
                    <div className="flex flex-col items-center mb-2">
                        <div className="relative">
                            <Avatar className="h-12 w-12 mb-1">
                                {channelImagePreview ? (
                                    <AvatarImage src={channelImagePreview} alt="Channel" />
                                ) : channel.image ? (
                                    <AvatarImage src={`${HOST}/${channel.image}`} alt="Channel" />
                                ) : (
                                    <AvatarFallback className="bg-purple-600 text-white text-xl font-bold">
                                        #
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            {isAdmin && isEditing && (
                                <>
                                    <button
                                        type="button"
                                        className="absolute -bottom-1 -right-1 bg-purple-600 hover:bg-purple-700 rounded-full p-1 transition-colors"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <FaCamera className="w-2.5 h-2.5" />
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
                        <h2 className="text-sm font-semibold">{channel.name}</h2>
                        {channel.description && (
                            <p className="text-gray-400 text-xs mt-0.5 text-center">
                                {channel.description}
                            </p>
                        )}
                    </div>

                    {/* Channel Description */}
                    {isEditing && (
                        <div className="mb-2">
                            <label className="text-xs text-gray-400 mb-1 block">Description</label>
                            <Input
                                value={channelDescription}
                                onChange={(e) => setChannelDescription(e.target.value)}
                                className="bg-[#2c2e3b] border-none text-white text-xs p-1.5"
                                placeholder="Channel description (optional)"
                            />
                        </div>
                    )}

                    {/* Members Section */}
                    <div className="mb-2">
                        <div className="flex items-center justify-between mb-1.5">
                            <h3 className="text-xs font-semibold">Members ({channel.members?.length || 0})</h3>
                            {isAdmin && !showAddMembers && (
                                <Button
                                    onClick={handleShowAddMembers}
                                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-1.5 py-0.5"
                                >
                                    <FaUserPlus className="mr-1" size={8} />
                                    Add
                                </Button>
                            )}
                        </div>

                        {/* Add Members Section */}
                        {showAddMembers && (
                            <div className="mb-3 p-3 bg-[#2c2e3b] rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-sm">Add New Members</h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowAddMembers(false)}
                                        className="p-1"
                                    >
                                        <IoClose size={16} />
                                    </Button>
                                </div>
                                
                                <ScrollArea className="max-h-24 mb-2">
                                    {allContacts.map(contact => (
                                        <div
                                            key={contact._id}
                                            className={`flex items-center gap-2 p-1.5 hover:bg-[#23242a] rounded cursor-pointer transition-all ${
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
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={contact.image ? `${HOST}/${contact.image}` : ""} />
                                                <AvatarFallback className="bg-gray-600 text-white text-xs">
                                                    {contact.firstName?.[0]?.toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs truncate">{contact.firstName} {contact.lastName}</span>
                                        </div>
                                    ))}
                                </ScrollArea>
                                
                                {selectedNewMembers.length > 0 && (
                                    <Button
                                        onClick={handleAddMembers}
                                        className="w-full bg-green-600 hover:bg-green-700 text-xs py-1"
                                    >
                                        Add {selectedNewMembers.length} Member(s)
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Current Members List */}
                        <ScrollArea className="max-h-24">
                            {channel.members?.map(member => (
                                <div
                                    key={member._id || member.id}
                                    className="flex items-center justify-between p-1.5 hover:bg-[#2c2e3b] rounded mb-0.5"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={member.image ? `${HOST}/${member.image}` : ""} />
                                            <AvatarFallback className="bg-gray-600 text-white text-xs">
                                                {member.firstName?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium text-xs flex items-center">
                                                <span className="truncate">
                                                    {member.firstName} {member.lastName}
                                                </span>
                                                {(member._id === channel.admin?._id || member._id === channel.admin) && (
                                                    <Badge className="ml-1 bg-yellow-600 text-yellow-100 text-xs px-1">
                                                        <FaCrown className="mr-0.5" size={6} />
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
                                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 ml-2"
                                        >
                                            <FaUserMinus size={12} />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </ScrollArea>
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && (
                        <div className="border-t border-gray-700 pt-2 mt-2">
                            <h3 className="text-xs font-semibold mb-1.5 text-red-400">Danger Zone</h3>
                            <Button
                                onClick={handleDeleteChannel}
                                variant="destructive"
                                className="w-full bg-red-600 hover:bg-red-700 text-xs py-1.5"
                            >
                                <FaTrash className="mr-1" size={10} />
                                Delete Channel
                            </Button>
                        </div>
                    )}
                </ScrollArea>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-gray-700 flex-shrink-0">
                    {isEditing ? (
                        <>
                            <Button
                                onClick={handleSaveChanges}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-xs py-1.5"
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
                                className="flex-1 text-xs py-1.5"
                            >
                                Cancel
                            </Button>
                        </>
                    ) : (
                        <Button onClick={onClose} variant="ghost" className="flex-1 text-xs py-1.5">
                            Close
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ChannelDetails;