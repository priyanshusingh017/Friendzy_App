
/**
 * Zustand chat slice for chat-related state management
 */
export const createChatSlice = (set, get) => ({
    selectedChatType: undefined,
    selectedChatData: undefined,
    selectedChatMessages: [],
    directMessageContacts:[],
    channels: [], // Add channels state
    isUploading : false,
    isDownloading:false,
    fileuploadprogress:0,
    fileDownloadprogress:0,
    setUploading:(isUploading) => set({isUploading}),
    setDownloading:(isDownloading) => set({isDownloading}), 
    setFileUploadingprogress:(fileDownloadprogress) =>set({fileDownloadprogress}),
    setFileDownloadingprogress:(fileDownloadingProgress)=>set({fileDownloadingProgress}),
    setSelectedChatType: (selectedChatType) => set({ selectedChatType }),
    setSelectedChatData: (selectedChatData) => set({ selectedChatData }),
    setSelectedChatMessages: (selectedChatMessages) => set({ selectedChatMessages }),
    setDirectMessageContacts:(directMessageContacts) => set({directMessageContacts}),
    setChannels: (channels) => set({ channels }), // Add setChannels method
    addChannel: (channel) => { // Add method to add a new channel
        const channels = get().channels;
        set({ channels: [channel, ...channels] });
    },
    updateChannel: (updatedChannel) => { // Add method to update an existing channel
        const channels = get().channels;
        const updatedChannels = channels.map(channel => 
            channel._id === updatedChannel._id ? updatedChannel : channel
        );
        set({ channels: updatedChannels });
        
        // Also update selectedChatData if it's the same channel
        const selectedChatData = get().selectedChatData;
        if (selectedChatData && selectedChatData._id === updatedChannel._id) {
            set({ selectedChatData: updatedChannel });
        }
    },
    removeChannel: (channelId) => { // Add method to remove a channel
        const channels = get().channels;
        const updatedChannels = channels.filter(channel => channel._id !== channelId);
        set({ channels: updatedChannels });
        
        // Close chat if the deleted channel is currently selected
        const selectedChatData = get().selectedChatData;
        if (selectedChatData && selectedChatData._id === channelId) {
            set({
                selectedChatData: undefined,
                selectedChatType: undefined,
                selectedChatMessages: [],
            });
        }
    },
    closeChat: () => set({
        selectedChatData: undefined,
        selectedChatType: undefined,
        selectedChatMessages: [],
    }),

    addMessage: (message) => {
        const selectedChatMessages = get().selectedChatMessages;
        const selectedChatType = get().selectedChatType;

        set({
            selectedChatMessages: [
                ...selectedChatMessages,
                {
                    ...message,
                    recipient:
                        selectedChatType === "channel"
                            ? message.recipient
                            : message.recipient._id,

                    sender:
                        selectedChatType === "channel"
                            ? message.sender
                            : message.sender._id,
                },
            ],
        });
    },
});