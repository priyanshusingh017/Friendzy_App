import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/AuthRoutes.js";
import contactsRoutes from "./routes/ContactRoutes.js";
import setupSocket from "./socket.js";
import messagesRoutes from "./routes/MessageRoutes.js";
import channelRoutes from "./routes/ChannelRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

// Only load .env in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 8747;
const DATABASE_URL = process.env.DATABASE_URL;

// Allow multiple origins (production + preview URLs)
const allowedOrigins = [
  process.env.ORIGIN,
  'https://friendzy-app.vercel.app',
  /https:\/\/friendzy-.*\.vercel\.app$/ // Allow all Vercel preview URLs
].filter(Boolean);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      // Check if origin is allowed
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') return allowed === origin;
        if (allowed instanceof RegExp) return allowed.test(origin);
        return false;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use("/uploads/profiles", express.static(path.join(__dirname, "uploads/profiles")));
app.use("/uploads/files", express.static(path.join(__dirname, "uploads/files")));

app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/channel", channelRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

console.log("Attempting connection with:", DATABASE_URL?.replace(/\/\/[^:]+:[^@]+@/, "//*****:*****@"));

mongoose
  .connect(DATABASE_URL)
  .then(() => {
    console.log("DB Connection Successful");
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
    });
    setupSocket(server);
  })
  .catch((err) => console.log("DB Connection Error:", err.message));