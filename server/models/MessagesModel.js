import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Should match your user model name
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Channel",
    required: false,
  },
  messageType: {
    type: String,
    enum: ["text", "file"],
    required: true,
  },
  content: {
    type: String,
    required: function () {
      return this.messageType === "text";
    },
  },
  fileUrl: {
    type: String,
    required: function () {
      return this.messageType === "file";
    },
  },
  fileName: {
    type: String,
    required: function () {
      return this.messageType === "file";
    },
  },
  fileSize: {
    type: Number,
    required: false, // <-- change this from true to false
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Add validation to ensure either recipient or channel is specified, but not both
messageSchema.pre('save', function(next) {
  if (this.recipient && this.channel) {
    next(new Error('Message cannot have both recipient and channel'));
  } else if (!this.recipient && !this.channel) {
    next(new Error('Message must have either recipient or channel'));
  } else {
    next();
  }
});

// Index for efficient queries
messageSchema.index({ sender: 1, timestamp: -1 });
messageSchema.index({ recipient: 1, timestamp: -1 });
messageSchema.index({ channel: 1, timestamp: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;