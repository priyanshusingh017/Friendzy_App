import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }],
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    image: {
        type: String,
        default: null,
    },
    description: {
        type: String,
        maxlength: 500,
        default: "",
    },
    isPrivate: {
        type: Boolean,
        default: false,
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null,
    },
    lastActivity: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Index for efficient queries
channelSchema.index({ members: 1 });
channelSchema.index({ admin: 1 });
channelSchema.index({ lastActivity: -1 });

const Channel = mongoose.model("Channel", channelSchema);

export default Channel;