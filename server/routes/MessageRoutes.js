import { Router } from "express";
import { getMessages, uploadFile } from "../controllers/MessageController.js";
import { verifyToken } from "../middlewares/AuthMiddle.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const messagesRoutes = Router();

// Get messages for a conversation
messagesRoutes.post("/get-message", verifyToken, (req, res, next) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ error: "Recipient ID is required." });
    }
    next();
}, getMessages);

// Upload a file in direct message chat
messagesRoutes.post("/upload-file", verifyToken, upload.any(), uploadFile);

export default messagesRoutes;
