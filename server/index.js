import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import multer from "multer";

// Import GridFS configuration
import { initGridFS } from "./config/gridfs.js";

// Import models
import "./models/userModel.js";
import "./models/MessagesModel.js";
import "./models/channelModel.js";

// Import routes
import authRoutes from "./routes/AuthRoutes.js";
import contactsRoutes from "./routes/ContactRoutes.js";
import messagesRoutes from "./routes/MessageRoutes.js";
import channelRoutes from "./routes/ChannelRoutes.js";
import setupSocket from "./socket.js";

// Only load .env in development
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 8747;
const DATABASE_URL = process.env.DATABASE_URL;

const allowedOrigins = [
  process.env.ORIGIN,
  "https://friendzy-app.vercel.app",
  /https:\/\/friendzy-.*\.vercel\.app$/,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === "string") return allowed === origin;
        if (allowed instanceof RegExp) return allowed.test(origin);
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes - channels route does NOT use multer middleware here
app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/channels", channelRoutes); // ✅ Remove multer from here

// Connect to MongoDB first, then start server
mongoose
  .connect(DATABASE_URL)
  .then(() => {
    console.log("✅ DB Connection Successful");

    // Initialize GridFS
    initGridFS();

    // Start server AFTER GridFS is initialized
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });

    // Setup Socket.IO
    setupSocket(server);
  })
  .catch((err) => {
    console.log("❌ DB Connection Error:", err.message);
    process.exit(1);
  });