import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState, useRef, useCallback } from "react";
import { FaPlus, FaCamera } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/api_client";
import { 
    HOST, 
    GET_ALL_CONTACTS_ROUTE, 
    CREATE_CHANNEL_ROUTE, 
    UPDATE_CHANNEL_ROUTE // ✅ Add this import
} from "@/utils/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/store";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CreateChannel = () => {
    const { setSelectedChatType, setSelectedChatData, addChannel } = useAppStore();
    const [newChannelModal, setNewChannelModal] = useState(false);
    const [allContacts, setAllContacts] = useState([]);
    const [filteredContacts, setFilteredContacts] = useState([]);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [channelName, setChannelName] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [channelImage, setChannelImage] = useState(null);
    const [channelImagePreview, setChannelImagePreview] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSelecting, setIsSelecting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const getData = async () => {
            setIsLoading(true);
            try {
                const response = await apiClient.get(GET_ALL_CONTACTS_ROUTE, {
                    withCredentials: true,
                });
                const contacts = response.data.contacts || [];
                console.log("Fetched contacts:", contacts);
                setAllContacts(contacts);
                setFilteredContacts(contacts);
            } catch (error) {
                console.error("Failed to fetch contacts:", error);
                setAllContacts([]);
                setFilteredContacts([]);
            } finally {
                setIsLoading(false);
            }
        };
        
        if (newChannelModal) {
            setSearchTerm("");
            setSelectedContacts([]);
            setChannelName("");
            setChannelImage(null);
            setChannelImagePreview("");
            getData();
        }
    }, [newChannelModal]);

    useEffect(() => {
        if (!searchTerm || searchTerm.trim() === "") {
            setFilteredContacts(allContacts);
        } else {
            const searchLower = searchTerm.toLowerCase().trim();
            const searchResults = allContacts.filter(contact => {
                const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.toLowerCase();
                const email = (contact.email || '').toLowerCase();
                return fullName.includes(searchLower) || email.includes(searchLower);
            });
            setFilteredContacts(searchResults);
        }
    }, [searchTerm, allContacts]);

    const handleContactSelect = useCallback((contact) => {
        if (isSelecting) return;
        
        const contactId = contact.id || contact._id;
        if (!contactId) return;
        
        setIsSelecting(true);
        
        setSelectedContacts(prev => {
            const isSelected = prev.some(c => (c.id || c._id) === contactId);
            if (isSelected) {
                return prev.filter(c => (c.id || c._id) !== contactId);
            } else {
                const alreadyExists = prev.some(c => (c.id || c._id) === contactId);
                if (alreadyExists) return prev;
                return [...prev, contact];
            }
        });
        
        setTimeout(() => setIsSelecting(false), 200);
    }, [isSelecting]);

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

    const removeChannelImage = () => {
        setChannelImage(null);
        setChannelImagePreview("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const resetForm = () => {
        setChannelName("");
        setSearchTerm("");
        setSelectedContacts([]);
        setChannelImage(null);
        setChannelImagePreview("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleCreateChannel = async () => {
        try {
            // Validate inputs
            if (!channelName.trim()) {
                alert("Channel name is required");
                return;
            }

            if (selectedContacts.length === 0) {
                alert("At least one member is required");
                return;
            }

            const memberIds = selectedContacts.map(contact => contact.id || contact._id);
            
            console.log("📝 Creating channel:", {
                name: channelName,
                memberIds: memberIds,
                hasImage: !!channelImage
            });

            // ✅ Create channel without image first
            const response = await apiClient.post(
                CREATE_CHANNEL_ROUTE,
                {
                    name: channelName.trim(),
                    members: memberIds,
                },
                { withCredentials: true }
            );
            
            console.log("✅ Channel created:", response.data);

            if (response.status === 201 && response.data.channel) {
                let finalChannel = response.data.channel;

                console.log("✅ Created channel members:", finalChannel.members?.map(m => ({
                    id: m._id,
                    name: `${m.firstName} ${m.lastName}`
                })));

                // ✅ If image was uploaded, update the channel with the image
                if (channelImage) {
                    try {
                        const formData = new FormData();
                        formData.append('image', channelImage);
                        
                        console.log("📸 Uploading channel image...");
                        
                        const updateResponse = await apiClient.put(
                            UPDATE_CHANNEL_ROUTE(response.data.channel._id),
                            formData,
                            {
                                withCredentials: true,
                                headers: {
                                    'Content-Type': 'multipart/form-data',
                                },
                            }
                        );
                        
                        if (updateResponse.data.success) {
                            console.log("✅ Channel image updated");
                            finalChannel = updateResponse.data.channel;
                            
                            console.log("✅ Updated channel members:", finalChannel.members?.map(m => ({
                                id: m._id,
                                name: `${m.firstName} ${m.lastName}`
                            })));
                        }
                    } catch (imageError) {
                        console.error("⚠️ Failed to upload channel image:", imageError);
                        // Channel was created, just image upload failed - continue
                    }
                }
                
                // ✅ Verify members are populated before adding to store
                console.log("✅ Final channel data before adding to store:", {
                    id: finalChannel._id,
                    name: finalChannel.name,
                    membersCount: finalChannel.members?.length,
                    firstMember: finalChannel.members?.[0]
                });
                
                // Add the final channel to the store
                addChannel(finalChannel);
                
                setNewChannelModal(false);
                resetForm();
            }
        } catch (error) {
            console.error("❌ Failed to create channel:", error);
            console.error("Error details:", error.response?.data);
            alert(`Failed to create channel: ${error.response?.data || error.message}`);
        }
    };

    return (
        <>
            <Tooltip>
                <TooltipTrigger>
                    <FaPlus
                        className="text-neutral-400 font-light text-opacity-90 text-start hover:text-neutral-100 cursor-pointer transition-all"
                        onClick={() => setNewChannelModal(true)}
                        aria-label="Add new contact"
                    />
                </TooltipTrigger>
                <TooltipContent
                    className="bg-[#1c1b1e] border-none mb-2 p-3 text-white">
                    Create New Channel
                </TooltipContent>
            </Tooltip>
            <Dialog open={newChannelModal} onOpenChange={(open) => {
                if (!open) {
                    resetForm();
                }
                setNewChannelModal(open);
            }}>
                <DialogContent
                    className="bg-[#181920] border-none text-white w-[80vw] max-w-[450px] h-[85vh] flex flex-col mx-2"
                    aria-label="Create New Channel Dialog"
                >
                    <DialogHeader className="flex-shrink-0 mb-3">
                        <DialogTitle className="text-lg font-semibold">Create New Channel</DialogTitle>
                        <DialogDescription className="text-sm">
                            Please fill up the details for new channel.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {/* Channel Image Upload */}
                    <div className="flex flex-col items-center mb-2 flex-shrink-0">
                        <div className="relative">
                            <Avatar className="h-14 w-14 sm:h-16 sm:w-16 mb-1">
                                {channelImagePreview ? (
                                    <AvatarImage src={channelImagePreview} alt="Channel" />
                                ) : (
                                    <div className="w-full h-full bg-purple-600 flex items-center justify-center text-lg sm:text-xl font-bold">
                                        #
                                    </div>
                                )}
                            </Avatar>
                            <button
                                type="button"
                                className="absolute -bottom-1 -right-1 bg-purple-600 hover:bg-purple-700 rounded-full p-1 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                                aria-label="Upload channel image"
                            >
                                <FaCamera className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                            </button>
                            {channelImagePreview && (
                                <button
                                    type="button"
                                    className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 rounded-full p-0.5 transition-colors"
                                    onClick={removeChannelImage}
                                    aria-label="Remove channel image"
                                >
                                    <IoClose className="w-2.5 h-2.5" />
                                </button>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <p className="text-xs text-gray-400 mt-0.5">Upload image (optional)</p>
                    </div>

                    {/* Channel Name Input */}
                    <div className="mb-2 flex-shrink-0">
                        <Input
                            placeholder="Channel Name"
                            className="rounded-lg p-2 sm:p-2.5 bg-[#2c2e3b] border-none text-sm sm:text-base"
                            onChange={e => setChannelName(e.target.value)}
                            value={channelName}
                            aria-label="Channel Name"
                        />
                    </div>

                    {/* Contact Search */}
                    <div className="mb-2 flex-shrink-0">
                        <Input
                            placeholder="Search contacts..."
                            className="rounded-lg p-2 sm:p-2.5 bg-[#2c2e3b] border-none text-sm sm:text-base"
                            onChange={e => setSearchTerm(e.target.value)}
                            value={searchTerm}
                            aria-label="Search Contacts"
                        />
                    </div>

                    {/* Selected Contacts Display */}
                    {selectedContacts.length > 0 && (
                        <div className="mb-2 flex-shrink-0">
                            <p className="text-xs mb-1.5 text-gray-300">
                                Selected: {selectedContacts.length}
                            </p>
                            <div className="flex flex-wrap gap-1 max-h-10 overflow-y-auto">
                                {selectedContacts.map(contact => (
                                    <Badge 
                                        key={`selected-${contact.id || contact._id}`}
                                        className="bg-purple-700 flex items-center gap-1 px-1.5 py-0.5 text-xs"
                                    >
                                        <span className="truncate max-w-16 sm:max-w-20">
                                            {contact.firstName} {contact.lastName}
                                        </span>
                                        <IoClose 
                                            className="cursor-pointer hover:text-white hover:bg-purple-800 rounded flex-shrink-0 ml-0.5 p-0.5" 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const contactId = contact.id || contact._id;
                                                if (contactId && !isSelecting) {
                                                    setSelectedContacts(prev => 
                                                        prev.filter(c => (c.id || c._id) !== contactId)
                                                    );
                                                }
                                            }}
                                            size={10}
                                        />
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Contacts List */}
                    <div className="flex-1 overflow-hidden mb-3">
                        <p className="text-xs text-gray-400 mb-1.5">All contacts ({filteredContacts.length})</p>
                        <ScrollArea className="h-full border border-gray-700 rounded-lg bg-[#2c2e3b]">
                            <div className="p-1.5">
                            {isLoading ? (
                                <div className="text-center text-gray-400 mt-6">
                                    Loading contacts...
                                </div>
                            ) : filteredContacts.length === 0 ? (
                                <div className="text-center text-gray-400 mt-6">
                                    {searchTerm ? "No contacts found." : "No contacts available."}
                                </div>
                            ) : (
                                filteredContacts.map(contact => (
                                    <div
                                        key={contact.id || contact._id}
                                        className={`flex items-center gap-2 p-1.5 sm:p-2 hover:bg-[#23242a] rounded mb-0.5 cursor-pointer transition-all ${
                                            selectedContacts.some(c => (c.id || c._id) === (contact.id || contact._id))
                                                ? "bg-purple-900"
                                                : ""
                                        }`}
                                        onClick={() => handleContactSelect(contact)}
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage 
                                                src={contact.image ? `${HOST}${contact.image}` : ""} 
                                            />
                                            <AvatarFallback className="bg-purple-600 text-white text-xs">
                                                {contact.firstName?.[0]?.toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">
                                                {contact.firstName} {contact.lastName}
                                            </div>
                                            <div className="text-xs text-gray-400 truncate">
                                                {contact.email}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            </div>
                        </ScrollArea>
                    </div>
                    
                    {/* Create Channel Button */}
                    <div className="flex-shrink-0 pt-3 border-t border-gray-700">
                        <Button
                            className="w-full bg-purple-700 hover:bg-purple-900 transition-all py-2 sm:py-3"
                            onClick={handleCreateChannel}
                            disabled={!channelName.trim() || selectedContacts.length === 0}
                        >
                            Create Channel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CreateChannel;