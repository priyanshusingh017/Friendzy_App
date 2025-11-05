import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import http from "http";
import path from "path";

import authRoutes from "./routes/AuthRoutes.js";
import contactRoutes from "./routes/ContactRoutes.js";
import channelRoutes from "./routes/ChannelRoutes.js";
import messageRoutes from "./routes/MessageRoutes.js";
import setupSocket from "./socket.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8747;
const DATABASE_URL = process.env.DATABASE_URL;

const allowedOrigins = (process.env.ORIGIN || "http://localhost:5173")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

app.use("/uploads/profiles", express.static("uploads/profiles"));
app.use("/uploads/files", express.static(path.join(process.cwd(), "uploads/files")));
app.use("/uploads/channels", express.static("uploads/channels"));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (_, res) => res.send("Chat Application API is running"));

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set in environment variables.");
  process.exit(1);
}

console.log("Attempting connection with:", DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

mongoose.connect(DATABASE_URL)
  .then(() => {
    console.log("DB Connection Successful");
    const server = http.createServer(app);
    setupSocket(server);
    server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  })
  .catch(err => {
    console.error("DB Connection Error:", err.message);
    process.exit(1);
  });