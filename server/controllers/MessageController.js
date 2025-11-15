import Message from "../models/MessagesModel.js";
import { uploadToGridFS } from "../config/gridfs.js";
import { generateFilename } from "../middlewares/uploadMiddleware.js";

export const getMessages = async (request, response, next) => {
  try {
    const user1 = request.userId;
    const user2 = request.body.id;

    if (!user1 || !user2) {
      return response.status(400).send("Both user ID's are required.");
    }

    const messages = await Message.find({
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 },
      ],
    }).sort({ timestamp: 1 });

    return response.status(200).json({ messages });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error");
  }
};

export const uploadFile = async (request, response, next) => {
  try {
    // Handle both upload.single() and upload.any()
    const file = request.file || (request.files && request.files[0]);
    
    if (!file) {
      return response.status(400).send("File is required.");
    }

    console.log("📤 Uploading file:", file.originalname);

    // Generate unique filename
    const filename = generateFilename(file.originalname);
    
    // Create plain metadata object - convert everything to primitive types
    const plainMetadata = {
      userId: String(request.userId), // Ensure it's a string
      uploadDate: new Date().toISOString(), // ISO string
      contentType: String(file.mimetype),
      originalName: String(file.originalname),
      fileSize: Number(file.size),
      fileType: 'message-attachment'
    };

    console.log("📝 Metadata:", plainMetadata);
    
    // Upload to GridFS with plain metadata
    await uploadToGridFS(filename, file.buffer, plainMetadata);

    console.log("✅ File uploaded to GridFS:", filename);

    return response.status(200).json({ 
      filePath: filename
    });
  } catch (error) {
    console.log("❌ Error uploading file:", error);
    return response.status(500).send("Internal Server Error");
  }
};