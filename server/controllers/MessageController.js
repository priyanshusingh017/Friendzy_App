import Message from "../models/MessagesModel.js";
import { uploadToGridFS } from "../config/gridfs.js";
import { generateFilename, processImage } from "../middlewares/uploadMiddleware.js"; // ✅ Import processImage

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

    // ✅ Process image if it's an image file
    let fileBuffer = file.buffer;
    let contentType = file.mimetype;

    if (file.mimetype.startsWith('image/')) {
      fileBuffer = await processImage(file.buffer, file.mimetype);
      contentType = 'image/jpeg'; // Sharp converts to JPEG
      console.log("✅ Image processed and orientation corrected");
    }

    // Generate unique filename
    const filename = generateFilename(file.originalname);
    
    // Create plain metadata object
    const plainMetadata = {
      userId: String(request.userId),
      uploadDate: new Date().toISOString(),
      contentType: String(contentType),
      originalName: String(file.originalname),
      fileSize: Number(fileBuffer.length), // ✅ Use processed buffer length
      fileType: 'message-attachment'
    };

    console.log("📝 Metadata:", plainMetadata);
    
    // Upload to GridFS with processed buffer
    await uploadToGridFS(filename, fileBuffer, plainMetadata);

    console.log("✅ File uploaded to GridFS:", filename);

    return response.status(200).json({ 
      filePath: filename
    });
  } catch (error) {
    console.log("❌ Error uploading file:", error);
    return response.status(500).send("Internal Server Error");
  }
};