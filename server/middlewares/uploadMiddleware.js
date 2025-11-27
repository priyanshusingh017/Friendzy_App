import multer from "multer";
import path from "path";
import sharp from "sharp"; 

// Use memory storage to upload files to GridFS instead of disk
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for MongoDB free tier
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes =
      /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|mp3|wav|avi|mov|webp|svg/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images, documents, and media files are allowed!"));
    }
  },
});

// Create a middleware that accepts any field name
export const uploadAny = upload.any(); // Accept any field name

// Helper function to generate unique filename
export const generateFilename = (originalname) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const ext = path.extname(originalname);
  return `${timestamp}-${randomString}${ext}`;
};

// ✅ Temporary: Return buffer as-is without processing
export const processImage = async (buffer, mimetype) => {
  try {
    // For now, just return the original buffer
    // TODO: Add Sharp processing once installed
    console.log('⚠️ Image processing disabled - Sharp not installed');
    return buffer;
  } catch (error) {
    console.error("⚠️ Error processing image:", error);
    return buffer;
  }
};